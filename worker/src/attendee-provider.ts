import { logger } from "./logger.js";
import {
  createBot,
  getBot,
  leaveBot,
  outputAudio,
  getTranscript,
  getCloudConfig,
  getSelfHostConfig,
  getConfigForEndpoint,
  AttendeeQuotaError,
  type AttendeeEndpoint,
} from "./attendee.js";
import type {
  BotHandle,
  BotProvider,
  NormalizedTranscriptEntry,
} from "./provider-types.js";

const JOINED_STATES = new Set([
  "joined",
  "joined_recording",
  "joined_not_recording",
]);
const ENDED_STATES = new Set(["ended", "fatal_error", "post_processing"]);

function extractTextFromAttendee(t: unknown): string {
  if (!t) return "";
  if (typeof t === "string") return t.trim();
  if (typeof t === "object") {
    const obj = t as Record<string, unknown>;
    const candidates = [
      obj.transcript,
      obj.text,
      (obj.alternatives as { transcript?: string }[] | undefined)?.[0]?.transcript,
    ];
    for (const c of candidates) {
      if (typeof c === "string" && c.trim()) return c.trim();
    }
  }
  return "";
}

function endpointOfHandle(handle: BotHandle): AttendeeEndpoint {
  return handle.attendeeEndpoint ?? "cloud";
}

class AttendeeProvider implements BotProvider {
  name: "attendee" = "attendee";

  /**
   * Try cloud first; on a quota/billing error, automatically retry against the
   * self-hosted endpoint if it's configured. The chosen endpoint is recorded
   * on the handle so all subsequent calls for this session hit the same
   * instance.
   */
  async createBot(meetingUrl: string, botName: string): Promise<BotHandle> {
    const cloud = getCloudConfig();
    const selfHost = getSelfHostConfig();

    if (!cloud && !selfHost) {
      throw new Error("No Attendee endpoint configured (set ATTENDEE_API_KEY)");
    }

    if (cloud) {
      try {
        logger.info({ endpoint: "cloud", meetingUrl }, "attendee: creating bot");
        const bot = await createBot(cloud, meetingUrl, botName);
        return {
          provider: "attendee",
          attendeeBotId: bot.id,
          attendeeEndpoint: "cloud",
        };
      } catch (err) {
        if (err instanceof AttendeeQuotaError && selfHost) {
          logger.warn(
            { reason: err.message },
            "attendee cloud quota exhausted — falling back to self-hosted",
          );
          // fall through
        } else {
          throw err;
        }
      }
    }

    // Self-hosted fallback (or primary if cloud isn't configured)
    if (!selfHost) {
      throw new Error(
        "Attendee cloud exhausted and self-host not configured (set ATTENDEE_SELFHOST_API_KEY)",
      );
    }
    logger.info({ endpoint: "selfhost", meetingUrl }, "attendee: creating bot");
    const bot = await createBot(selfHost, meetingUrl, botName);
    return {
      provider: "attendee",
      attendeeBotId: bot.id,
      attendeeEndpoint: "selfhost",
    };
  }

  async isBotJoined(handle: BotHandle): Promise<boolean> {
    if (!handle.attendeeBotId) return false;
    const cfg = getConfigForEndpoint(endpointOfHandle(handle));
    try {
      const bot = await getBot(cfg, handle.attendeeBotId);
      return JOINED_STATES.has(bot.state);
    } catch (err) {
      logger.warn({ err }, "attendee status poll failed");
      return false;
    }
  }

  async isBotEnded(handle: BotHandle): Promise<boolean> {
    if (!handle.attendeeBotId) return true;
    const cfg = getConfigForEndpoint(endpointOfHandle(handle));
    try {
      const bot = await getBot(cfg, handle.attendeeBotId);
      return ENDED_STATES.has(bot.state);
    } catch {
      return false;
    }
  }

  async getTranscript(handle: BotHandle): Promise<NormalizedTranscriptEntry[]> {
    if (!handle.attendeeBotId) return [];
    const cfg = getConfigForEndpoint(endpointOfHandle(handle));
    const entries = await getTranscript(cfg, handle.attendeeBotId);
    return entries
      .map((e) => ({
        speakerName: e.speaker_name,
        text: extractTextFromAttendee(e.transcription),
        timestampMs: e.timestamp_ms,
      }))
      .filter((e) => e.text.length > 0);
  }

  async outputAudio(handle: BotHandle, audioMp3: Buffer): Promise<void> {
    if (!handle.attendeeBotId) throw new Error("no attendee bot id");
    const cfg = getConfigForEndpoint(endpointOfHandle(handle));
    await outputAudio(cfg, handle.attendeeBotId, audioMp3);
  }

  async leaveBot(handle: BotHandle): Promise<void> {
    if (!handle.attendeeBotId) return;
    const cfg = getConfigForEndpoint(endpointOfHandle(handle));
    await leaveBot(cfg, handle.attendeeBotId);
  }
}

export const attendeeProvider = new AttendeeProvider();
