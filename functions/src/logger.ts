/**
 * Wraps firebase-functions/logger in the pino-style API the rest of the
 * worker code uses: logger.info({ payload }, "message"). Cloud Functions
 * logs flow into Cloud Logging — view with `firebase functions:log` or in
 * the Firebase Console -> Functions -> Logs tab.
 */
import * as fnLogger from "firebase-functions/logger";

type Payload = Record<string, unknown>;

function call(
  fn: (msg: string, ...args: unknown[]) => void,
  arg1: unknown,
  arg2?: unknown,
) {
  if (typeof arg1 === "string") {
    fn(arg1);
    return;
  }
  if (typeof arg2 === "string") {
    fn(arg2, arg1 as Payload);
    return;
  }
  fn(String(arg1));
}

export const logger = {
  info: (a: unknown, b?: unknown) => call(fnLogger.info, a, b),
  warn: (a: unknown, b?: unknown) => call(fnLogger.warn, a, b),
  error: (a: unknown, b?: unknown) => call(fnLogger.error, a, b),
  debug: (a: unknown, b?: unknown) => call(fnLogger.debug, a, b),
};
