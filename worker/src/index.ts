import "dotenv/config";
import { createServer } from "node:http";
import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import { db } from "./firestore.js";
import { logger } from "./logger.js";
import { SessionRunner } from "./session.js";

// Unique id for THIS worker process. Used to claim a session for dispatch so
// that if two instances are briefly live at once (e.g. during a Render
// zero-downtime deploy), only ONE of them launches a bot — preventing the
// "two bots joined" / runners-racing-and-ending-early bug.
const WORKER_ID = `${process.pid}-${randomUUID().slice(0, 8)}`;
// A claim older than this is considered stale (worker died before dispatching)
// and may be re-taken, so a session never gets permanently stuck.
const DISPATCH_CLAIM_TTL_MS = 3 * 60 * 1000;

const WEBHOOK_SECRET = process.env.ATTENDEE_WEBHOOK_SECRET;
// Set to "true" to REJECT webhooks whose signature doesn't verify. Default is
// fail-open (process anyway, log a warning) — canonical-JSON signing can vary
// subtly across languages, and the bot_id->live-session guard already blocks
// random callers. Flip to strict once you've confirmed verifications pass.
const WEBHOOK_STRICT = process.env.WEBHOOK_REJECT_INVALID === "true";

function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return Object.keys(o)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = sortKeys(o[k]);
        return acc;
      }, {});
  }
  return v;
}

/** Verify Attendee's X-Webhook-Signature (HMAC-SHA256, canonical JSON, b64). */
function verifyWebhook(parsed: unknown, signature: string | undefined): boolean {
  if (!WEBHOOK_SECRET) return true; // not configured -> skip
  if (!signature) return false;
  try {
    const canonical = JSON.stringify(sortKeys(parsed));
    const expected = createHmac("sha256", Buffer.from(WEBHOOK_SECRET, "base64"))
      .update(canonical, "utf8")
      .digest("base64");
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

const active = new Map<string, SessionRunner>();
// Sessions this instance is mid-claim on (synchronous guard against the
// onSnapshot firing twice before the async claim transaction resolves).
const claiming = new Set<string>();

/**
 * Atomically claim a session for dispatch via a Firestore transaction. Returns
 * true only if THIS worker won the claim (and should launch the bot). Prevents
 * two concurrent worker instances from both dispatching the same session.
 */
async function claimDispatch(id: string): Promise<boolean> {
  const ref = db.collection("interviewSessions").doc(id);
  try {
    return await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return false;
      const data = snap.data() as {
        status?: string;
        dispatchClaimedBy?: string;
        dispatchClaimedAt?: number;
      };
      if (data.status !== "bot_dispatching") return false;
      const claimedAt = data.dispatchClaimedAt ?? 0;
      const fresh = Date.now() - claimedAt < DISPATCH_CLAIM_TTL_MS;
      // Someone else holds a fresh claim — leave it to them.
      if (data.dispatchClaimedBy && data.dispatchClaimedBy !== WORKER_ID && fresh) {
        return false;
      }
      tx.update(ref, {
        dispatchClaimedBy: WORKER_ID,
        dispatchClaimedAt: Date.now(),
      });
      return true;
    });
  } catch (err) {
    logger.warn({ err, id }, "dispatch claim transaction failed");
    return false;
  }
}

/* -------------------------------------------------------------------------
 * Health-check HTTP server.
 *
 * The worker is a background process, but most always-on hosts (Koyeb,
 * Render, Cloud Run, etc.) deploy it as a "web service" and run an HTTP
 * health check against the assigned PORT. Without a listener the host marks
 * the instance unhealthy and restarts it in a loop. So we expose a tiny
 * server that reports liveness + how many interviews are currently running.
 * --------------------------------------------------------------------- */
/**
 * Handle an Attendee `transcript.update` webhook payload. Attendee pushes one
 * of these the moment Deepgram finalizes an utterance — far faster than our
 * 1s poll. We route it straight into the live SessionRunner. Polling stays on
 * as a fallback (shared timestamp dedup means no double-processing).
 *
 * Expected shape (per Attendee webhook docs):
 *   { trigger: "transcript.update", bot_id: "bot_...",
 *     data: { speaker_name, timestamp_ms, transcription: { transcript } } }
 */
function handleAttendeeWebhook(body: unknown): { ok: boolean; routed?: boolean } {
  const b = body as {
    trigger?: string;
    bot_id?: string;
    data?: {
      speaker_name?: string;
      participant_name?: string;
      event_type?: string;
      timestamp_ms?: number;
      transcription?: { transcript?: string } | string;
    };
  };
  if (!b || !b.bot_id || !b.data) return { ok: true };

  // Acoustic voice-activity events — our near-realtime turn-taking signal.
  if (b.trigger === "participant_events.speech_start_stop") {
    const ev = b.data.event_type;
    if (ev === "speech_start" || ev === "speech_stop") {
      const ts =
        typeof b.data.timestamp_ms === "number" ? b.data.timestamp_ms : Date.now();
      const routed = SessionRunner.routeSpeechEvent(
        b.bot_id,
        ev,
        b.data.participant_name ?? "",
        ts,
      );
      // lagMs = how long after the acoustic event we received it (≈ Attendee
      // VAD delivery lag). Should be small (sub-second to ~1s).
      if (routed)
        logger.info(
          { botId: b.bot_id, ev, lagMs: Date.now() - ts },
          "speech event routed",
        );
    }
    return { ok: true };
  }

  if (b.trigger !== "transcript.update") return { ok: true };
  const botId = b.bot_id;
  const d = b.data;
  if (!botId || !d) return { ok: true };

  const text =
    typeof d.transcription === "string"
      ? d.transcription
      : (d.transcription?.transcript ?? "");
  const ts = typeof d.timestamp_ms === "number" ? d.timestamp_ms : Date.now();
  if (!text) return { ok: true };

  const routed = SessionRunner.routeUtterance(
    botId,
    d.speaker_name ?? "unknown",
    text,
    ts,
  );
  if (routed) {
    // sttLagMs = wall-clock now minus the speech's meeting timestamp = the FULL
    // STT pipeline lag (Attendee capture + Deepgram finalize + webhook deliver).
    // This is the number that drives premature turn-commits. Expect a few sec.
    logger.info(
      { botId, len: text.length, sttLagMs: Date.now() - ts },
      "realtime transcript routed to session",
    );
  }
  return { ok: true, routed };
}

function startHealthServer() {
  const port = Number(process.env.PORT ?? 8000);
  const server = createServer((req, res) => {
    // Realtime transcript webhook from Attendee (POST).
    if (
      req.method === "POST" &&
      req.url &&
      req.url.startsWith("/webhooks/attendee")
    ) {
      let raw = "";
      req.on("data", (c) => {
        raw += c;
        if (raw.length > 1_000_000) req.destroy(); // 1MB guard
      });
      req.on("end", () => {
        try {
          const parsed = raw ? JSON.parse(raw) : {};
          const sig = req.headers["x-webhook-signature"] as string | undefined;
          const valid = verifyWebhook(parsed, sig);
          if (!valid) {
            if (WEBHOOK_STRICT) {
              logger.warn("webhook signature invalid — rejecting (strict mode)");
              res.writeHead(401, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ ok: false, error: "bad signature" }));
              return;
            }
            logger.warn(
              "webhook signature mismatch — processing anyway (fail-open)",
            );
          }
          handleAttendeeWebhook(parsed);
        } catch (err) {
          logger.warn({ err }, "bad webhook payload");
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      });
      return;
    }

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
            if (active.has(id) || claiming.has(id)) return;
            claiming.add(id);
            claimDispatch(id)
              .then((won) => {
                if (!won) {
                  claiming.delete(id);
                  logger.info({ id }, "dispatch claimed by another worker — skipping");
                  return;
                }
                const runner = new SessionRunner(id);
                active.set(id, runner);
                claiming.delete(id);
                logger.info({ id, worker: WORKER_ID }, "picking up session (claimed)");
                runner
                  .run()
                  .catch((err) => logger.error({ err, id }, "runner failed"))
                  .finally(() => {
                    active.delete(id);
                    logger.info({ id }, "runner finished");
                  });
              })
              .catch((err) => {
                claiming.delete(id);
                logger.warn({ err, id }, "claim handling failed");
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
  installShutdownHandlers();
}

/**
 * Exit promptly on SIGTERM/SIGINT. Without this, a worker instance being
 * replaced during a Render deploy keeps its Firestore onSnapshot listener
 * alive while draining — leaving a ZOMBIE instance that races the new one for
 * session dispatch (and can run stale code). Best-effort: ask any active bots
 * to leave the call so they don't linger, with a short timeout, then exit.
 */
let shuttingDown = false;
function installShutdownHandlers() {
  const shutdown = async (sig: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ sig, active: active.size, worker: WORKER_ID }, "shutting down");
    const leaves = [...active.values()].map((r) =>
      r.leaveQuietly().catch(() => {}),
    );
    await Promise.race([
      Promise.all(leaves),
      new Promise((res) => setTimeout(res, 4000)),
    ]);
    process.exit(0);
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

main();
