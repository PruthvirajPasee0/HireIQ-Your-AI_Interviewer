import { logger } from "./logger.js";
import type {
  BotHandle,
  BotProvider,
  NormalizedTranscriptEntry,
} from "./provider-types.js";

const BASE = (process.env.VEXA_BASE_URL ?? "https://api.cloud.vexa.ai").replace(/\/$/, "");
const KEY = process.env.VEXA_API_KEY;
const PLATFORM = "google_meet";

function headers() {
  if (!KEY) throw new Error("VEXA_API_KEY not set");
  return {
    "X-API-Key": KEY,
    "Content-Type": "application/json",
  };
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const txt = await res.text();
  if (!res.ok) {
    logger.error({ url, status: res.status, body: txt }, "vexa api error");
    throw new Error(`Vexa ${method} ${path} -> ${res.status}: ${txt}`);
  }
  return txt ? (JSON.parse(txt) as T) : (undefined as unknown as T);
}

/**
 * Parse `https://meet.google.com/abc-defg-hij` -> `abc-defg-hij`.
 * Vexa addresses bots by (platform, native_meeting_id), not by the full URL.
 */
function parseMeetId(url: string): string {
  const m = url.match(/meet\.google\.com\/([a-z0-9-]+)/i);
  if (!m) throw new Error(`Not a Google Meet URL: ${url}`);
  return m[1];
}

interface CreateBotResp {
  id: number;
  user_id: number;
  platform: string;
  native_meeting_id: string;
  status: string;
}

interface StatusResp {
  running_bots: Array<{
    container_id: string;
    container_name: string;
    platform: string;
    native_meeting_id: string;
    status: string;
    normalized_status: string;
  }>;
}

interface TranscriptResp {
  id: number;
  platform: string;
  segments: Array<{
    start_time: number; // seconds
    end_time: number;
    text: string;
    speaker: string | null;
    completed: boolean;
  }>;
}

class VexaProvider implements BotProvider {
  name: "vexa" = "vexa";

  async createBot(meetingUrl: string, botName: string): Promise<BotHandle> {
    const meetingId = parseMeetId(meetingUrl);
    logger.info({ meetingId, botName }, "vexa: creating bot");
    const data = await call<CreateBotResp>("POST", "/bots", {
      platform: PLATFORM,
      native_meeting_id: meetingId,
      bot_name: botName,
      language: "en",
      task: "transcribe",
      voice_agent_enabled: true,
    });
    return {
      provider: "vexa",
      vexaNativeMeetingId: meetingId,
      vexaNumericId: data.id,
    };
  }

  async isBotJoined(handle: BotHandle): Promise<boolean> {
    if (!handle.vexaNativeMeetingId) return false;
    try {
      const data = await call<StatusResp>("GET", "/bots/status");
      const ours = data.running_bots.find(
        (b) =>
          b.platform === PLATFORM &&
          b.native_meeting_id === handle.vexaNativeMeetingId,
      );
      if (!ours) return false;
      return ours.normalized_status === "Up" || /up/i.test(ours.status);
    } catch (err) {
      logger.warn({ err }, "vexa status poll failed");
      return false;
    }
  }

  async isBotEnded(handle: BotHandle): Promise<boolean> {
    if (!handle.vexaNativeMeetingId) return true;
    try {
      const data = await call<StatusResp>("GET", "/bots/status");
      const ours = data.running_bots.find(
        (b) =>
          b.platform === PLATFORM &&
          b.native_meeting_id === handle.vexaNativeMeetingId,
      );
      // No longer in running_bots means it ended
      return !ours;
    } catch {
      return false;
    }
  }

  async getTranscript(handle: BotHandle): Promise<NormalizedTranscriptEntry[]> {
    if (!handle.vexaNativeMeetingId) return [];
    const data = await call<TranscriptResp>(
      "GET",
      `/transcripts/${PLATFORM}/${handle.vexaNativeMeetingId}`,
    );
    return data.segments
      .filter((s) => s.completed && s.text?.trim())
      .map((s) => ({
        speakerName: s.speaker ?? "unknown",
        text: s.text.trim(),
        timestampMs: Math.floor(s.start_time * 1000),
      }));
  }

  async outputAudio(handle: BotHandle, audioMp3: Buffer): Promise<void> {
    if (!handle.vexaNativeMeetingId) throw new Error("no vexa meeting id");
    await call(
      "POST",
      `/bots/${PLATFORM}/${handle.vexaNativeMeetingId}/speak`,
      {
        audio_base64: audioMp3.toString("base64"),
        format: "mp3",
      },
    );
  }

  async leaveBot(handle: BotHandle): Promise<void> {
    if (!handle.vexaNativeMeetingId) return;
    await call(
      "DELETE",
      `/bots/${PLATFORM}/${handle.vexaNativeMeetingId}`,
    );
  }
}

export const vexaProvider = new VexaProvider();
