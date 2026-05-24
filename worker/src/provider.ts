import { logger } from "./logger.js";
import { attendeeProvider } from "./attendee-provider.js";
import { vexaProvider } from "./vexa.js";
import type { BotHandle, BotProvider, ProviderName } from "./provider-types.js";

const ENV = (process.env.BOT_PROVIDER ?? "attendee").toLowerCase() as ProviderName;

function pickDefault(): BotProvider {
  if (ENV === "vexa") {
    if (!process.env.VEXA_API_KEY) {
      logger.warn(
        "BOT_PROVIDER=vexa but VEXA_API_KEY not set — falling back to attendee",
      );
      return attendeeProvider;
    }
    return vexaProvider;
  }
  return attendeeProvider;
}

export const defaultProvider: BotProvider = pickDefault();
logger.info({ provider: defaultProvider.name }, "bot provider selected");

/**
 * Resolve a provider for an existing session: prefer the one whose handle
 * id is already populated, regardless of the current default. Lets a session
 * dispatched against Attendee keep using Attendee even if the env var changes.
 */
export function resolveForHandle(handle: BotHandle): BotProvider {
  if (handle.provider === "vexa") return vexaProvider;
  if (handle.provider === "attendee") return attendeeProvider;
  return defaultProvider;
}
