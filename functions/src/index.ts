import { setGlobalOptions } from "firebase-functions/v2";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";

import { db } from "./firestore";
import { SessionRunner } from "./session";

setGlobalOptions({ region: "us-central1" });

// Secrets injected from Google Secret Manager at runtime.
// Set with: firebase functions:secrets:set <NAME>
const ATTENDEE_CLOUD_API_KEY = defineSecret("ATTENDEE_CLOUD_API_KEY");
const DEEPGRAM_API_KEY = defineSecret("DEEPGRAM_API_KEY");
const CARTESIA_API_KEY = defineSecret("CARTESIA_API_KEY");
const GOOGLE_GENERATIVE_AI_API_KEY = defineSecret("GOOGLE_GENERATIVE_AI_API_KEY");

const allSecrets = [
  ATTENDEE_CLOUD_API_KEY,
  DEEPGRAM_API_KEY,
  CARTESIA_API_KEY,
  GOOGLE_GENERATIVE_AI_API_KEY,
];

/* ──────────────────────────────────────────────────────────────────────
 * Trigger: an interviewSession doc's status flips.
 * When it becomes "bot_dispatching", spin up the full SessionRunner loop
 * inside this function invocation. Function has up to 60 minutes to drive
 * the interview to completion.
 * ───────────────────────────────────────────────────────────────────── */
export const onSessionDispatch = onDocumentUpdated(
  {
    document: "interviewSessions/{sessionId}",
    timeoutSeconds: 3540, // 59 min (Gen 2 hard cap is 60)
    memory: "512MiB",
    cpu: 1,
    concurrency: 1,
    minInstances: 0,
    secrets: allSecrets,
  },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!after) return;
    if (before?.status === after.status) return;
    if (after.status !== "bot_dispatching") return;

    const sessionId = event.params.sessionId;
    logger.info("picking up session", { sessionId });

    try {
      const runner = new SessionRunner(sessionId);
      await runner.run();
      logger.info("runner finished", { sessionId });
    } catch (err) {
      logger.error("runner failed", { sessionId, err: String(err) });
    }
  },
);

/* ──────────────────────────────────────────────────────────────────────
 * Cloud Scheduler: every minute, flip "scheduled" sessions whose start
 * time has arrived (or is within the 30s lead window) to "bot_dispatching"
 * — which immediately triggers the function above. Means recruiters don't
 * have to click "Dispatch AI bot now" at the scheduled minute.
 * ───────────────────────────────────────────────────────────────────── */
const AUTO_DISPATCH_LEAD_MS = 30_000;
const AUTO_DISPATCH_GRACE_MS = 2 * 60 * 60 * 1000;

export const autoDispatchScheduled = onSchedule(
  {
    schedule: "every 1 minutes",
    timeoutSeconds: 60,
    memory: "256MiB",
  },
  async () => {
    const now = Date.now();
    const cutoffEarliest = now - AUTO_DISPATCH_GRACE_MS;
    const cutoffLatest = now + AUTO_DISPATCH_LEAD_MS;

    const snap = await db
      .collection("interviewSessions")
      .where("status", "==", "scheduled")
      .get();

    let flipped = 0;
    for (const doc of snap.docs) {
      const data = doc.data() as { scheduledAt?: string };
      const scheduledMs = data.scheduledAt ? Date.parse(data.scheduledAt) : NaN;
      if (!Number.isFinite(scheduledMs)) continue;
      if (scheduledMs > cutoffLatest) continue;
      if (scheduledMs < cutoffEarliest) continue;

      try {
        await doc.ref.update({ status: "bot_dispatching" });
        flipped += 1;
        logger.info("auto-dispatched", {
          id: doc.id,
          scheduledAt: data.scheduledAt,
          leadMs: scheduledMs - now,
        });
      } catch (err) {
        logger.warn("auto-dispatch flip failed", { id: doc.id, err: String(err) });
      }
    }
    if (flipped > 0) logger.info("auto-dispatch tick complete", { flipped });
  },
);
