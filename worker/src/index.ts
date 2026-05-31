import "dotenv/config";
import { createServer } from "node:http";
import { db } from "./firestore.js";
import { logger } from "./logger.js";
import { SessionRunner } from "./session.js";

const active = new Map<string, SessionRunner>();

/* -------------------------------------------------------------------------
 * Health-check HTTP server.
 *
 * The worker is a background process, but most always-on hosts (Koyeb,
 * Render, Cloud Run, etc.) deploy it as a "web service" and run an HTTP
 * health check against the assigned PORT. Without a listener the host marks
 * the instance unhealthy and restarts it in a loop. So we expose a tiny
 * server that reports liveness + how many interviews are currently running.
 * --------------------------------------------------------------------- */
function startHealthServer() {
  const port = Number(process.env.PORT ?? 8000);
  const server = createServer((req, res) => {
    if (req.url === "/health" || req.url === "/" || req.url === "/healthz") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "ok",
          activeSessions: active.size,
          uptimeSeconds: Math.round(process.uptime()),
        }),
      );
      return;
    }
    res.writeHead(404);
    res.end();
  });
  server.listen(port, "0.0.0.0", () => {
    logger.info({ port }, "health server listening");
  });
}

/* -------------------------------------------------------------------------
 * Auto-dispatch scheduler
 *
 * Every AUTO_DISPATCH_TICK_MS, scan for sessions whose status is "scheduled"
 * and whose scheduledAt is within the dispatch window. Flip them to
 * "bot_dispatching" — the snapshot listener below then picks them up and
 * starts the bot. Means recruiters don't have to manually click "Dispatch AI
 * bot now" at the scheduled time.
 * --------------------------------------------------------------------- */

const AUTO_DISPATCH_TICK_MS = 15_000;
// Dispatch up to this long BEFORE scheduledAt so the bot has time to join.
const AUTO_DISPATCH_LEAD_MS = 30_000;
// Don't auto-dispatch sessions whose scheduled time passed more than this
// long ago — they're stale (recruiter probably abandoned them).
const AUTO_DISPATCH_GRACE_MS = 2 * 60 * 60 * 1000;

async function autoDispatchTick() {
  const now = Date.now();
  const cutoffEarliest = now - AUTO_DISPATCH_GRACE_MS;
  const cutoffLatest = now + AUTO_DISPATCH_LEAD_MS;

  // Query by status only — filter the scheduledAt window in-memory to avoid
  // requiring a composite Firestore index (status + scheduledAt). For the
  // expected volume this scan is trivial.
  const snap = await db
    .collection("interviewSessions")
    .where("status", "==", "scheduled")
    .get();

  for (const doc of snap.docs) {
    const data = doc.data() as { scheduledAt?: string };
    const scheduledMs = data.scheduledAt ? Date.parse(data.scheduledAt) : NaN;
    if (!Number.isFinite(scheduledMs)) continue;
    if (scheduledMs > cutoffLatest) continue; // still in the future
    if (scheduledMs < cutoffEarliest) continue; // too stale, leave alone

    try {
      await doc.ref.update({ status: "bot_dispatching" });
      logger.info(
        {
          id: doc.id,
          scheduledAt: data.scheduledAt,
          leadMs: scheduledMs - now,
        },
        "auto-dispatching scheduled session",
      );
    } catch (err) {
      logger.warn({ err, id: doc.id }, "auto-dispatch flip failed");
    }
  }
}

function startAutoDispatcher() {
  setInterval(() => {
    autoDispatchTick().catch((err) =>
      logger.error({ err }, "auto-dispatch tick crashed"),
    );
  }, AUTO_DISPATCH_TICK_MS);
  // Run once immediately on startup so any sessions whose time has already
  // passed (or is within the lead window) get picked up without waiting a tick.
  autoDispatchTick().catch((err) =>
    logger.error({ err }, "initial auto-dispatch tick crashed"),
  );
}

function watchSessions() {
  db.collection("interviewSessions")
    .where("status", "==", "bot_dispatching")
    .onSnapshot(
      (snap) => {
        snap.docChanges().forEach((change) => {
          if (change.type === "added" || change.type === "modified") {
            const id = change.doc.id;
            if (active.has(id)) return;
            const runner = new SessionRunner(id);
            active.set(id, runner);
            logger.info({ id }, "picking up session");
            runner
              .run()
              .catch((err) => logger.error({ err, id }, "runner failed"))
              .finally(() => {
                active.delete(id);
                logger.info({ id }, "runner finished");
              });
          }
        });
      },
      (err) => {
        logger.error({ err }, "firestore listener error — restarting in 5s");
        setTimeout(watchSessions, 5000);
      },
    );
}

function main() {
  for (const key of [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
    "ATTENDEE_API_KEY",
    "DEEPGRAM_API_KEY",
    "GOOGLE_GENERATIVE_AI_API_KEY",
  ]) {
    if (!process.env[key]) {
      logger.error({ missing: key }, "required env var missing");
      process.exit(1);
    }
  }
  logger.info("worker started — watching interviewSessions");
  startHealthServer();
  watchSessions();
  startAutoDispatcher();
  logger.info(
    {
      tickMs: AUTO_DISPATCH_TICK_MS,
      leadMs: AUTO_DISPATCH_LEAD_MS,
      graceMs: AUTO_DISPATCH_GRACE_MS,
    },
    "auto-dispatcher running",
  );
}

main();
