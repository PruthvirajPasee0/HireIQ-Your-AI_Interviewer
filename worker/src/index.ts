import "dotenv/config";
import { db } from "./firestore.js";
import { logger } from "./logger.js";
import { SessionRunner } from "./session.js";

const active = new Map<string, SessionRunner>();

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
  watchSessions();
}

main();
