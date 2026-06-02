import type { AttendeeBot, AttendeeTranscriptEntry } from "./types.js";
import { logger } from "./logger.js";

/**
 * Endpoint identifier persisted on the bot handle so subsequent calls for a
 * given session always hit the same Attendee instance (cloud or self-hosted).
 */
export type AttendeeEndpoint = "cloud" | "selfhost";

export interface AttendeeConfig {
  baseUrl: string;
  apiKey: string;
  endpoint: AttendeeEndpoint;
}

function trim(s: string | undefined | null): string | null {
  if (!s) return null;
  const t = s.replace(/\/$/g, "").trim();
  return t.length > 0 ? t : null;
}

/**
 * Cloud config. Reads `ATTENDEE_CLOUD_*` first, then falls back to the
 * legacy `ATTENDEE_*` vars so existing setups keep working.
 */
export function getCloudConfig(): AttendeeConfig | null {
  const baseUrl =
    trim(process.env.ATTENDEE_CLOUD_BASE_URL) ??
    trim(process.env.ATTENDEE_BASE_URL) ??
    "https://app.attendee.dev";
  const apiKey =
    trim(process.env.ATTENDEE_CLOUD_API_KEY) ??
    trim(process.env.ATTENDEE_API_KEY);
  if (!apiKey) return null;
  return { baseUrl, apiKey, endpoint: "cloud" };
}

/** Self-hosted config. Returns null when not configured. */
export function getSelfHostConfig(): AttendeeConfig | null {
  const baseUrl =
    trim(process.env.ATTENDEE_SELFHOST_BASE_URL) ?? "http://localhost:8000";
  const apiKey = trim(process.env.ATTENDEE_SELFHOST_API_KEY);
  if (!apiKey) return null;
  return { baseUrl, apiKey, endpoint: "selfhost" };
}

export function getConfigForEndpoint(endpoint: AttendeeEndpoint): AttendeeConfig {
  const c = endpoint === "cloud" ? getCloudConfig() : getSelfHostConfig();
  if (!c) throw new Error(`Attendee ${endpoint} endpoint not configured`);
  return c;
}

/**
 * A quota / billing error from Attendee Cloud — the trigger for falling back
 * to self-hosted. Detected from HTTP status + body text.
 */
export class AttendeeQuotaError extends Error {
  constructor(public status: number, public bodyText: string) {
    super(`Attendee quota/billing limit hit (${status}): ${bodyText.slice(0, 200)}`);
    this.name = "AttendeeQuotaError";
  }
}

export class AttendeeApiError extends Error {
  constructor(public status: number, public bodyText: string) {
    super(`Attendee API error (${status}): ${bodyText.slice(0, 200)}`);
    this.name = "AttendeeApiError";
  }
}

const QUOTA_BODY_RE =
  /quota|credit|trial|billing|payment required|free tier|limit reached|out of/i;

function classifyError(status: number, body: string): "quota" | "other" {
  if (status === 402) return "quota";
  if ((status === 403 || status === 429) && QUOTA_BODY_RE.test(body)) return "quota";
  return "other";
}

async function call<T>(
  cfg: AttendeeConfig,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${cfg.baseUrl}/api/v1${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Token ${cfg.apiKey}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const txt = await res.text();
  if (!res.ok) {
    logger.error(
      { url, status: res.status, endpoint: cfg.endpoint, body: txt.slice(0, 300) },
      "attendee api error",
    );
    if (classifyError(res.status, txt) === "quota") {
      throw new AttendeeQuotaError(res.status, txt);
    }
    throw new AttendeeApiError(res.status, txt);
  }
  return txt ? (JSON.parse(txt) as T) : (undefined as unknown as T);
}

export async function createBot(
  cfg: AttendeeConfig,
  meetingUrl: string,
  botName: string,
): Promise<AttendeeBot> {
  return call<AttendeeBot>(cfg, "POST", "/bots", {
    meeting_url: meetingUrl,
    bot_name: botName,
    // Emit participant_events.speech_start_stop webhooks — the near-realtime
    // acoustic VAD signal we use for turn-taking. Without this flag Attendee
    // never produces the speech events even if the webhook is subscribed.
    recording_settings: {
      record_participant_speech_start_stop_events: true,
    },
  });
}

export async function getBot(
  cfg: AttendeeConfig,
  botId: string,
): Promise<AttendeeBot> {
  return call<AttendeeBot>(cfg, "GET", `/bots/${botId}`);
}

export async function leaveBot(cfg: AttendeeConfig, botId: string): Promise<void> {
  await call(cfg, "POST", `/bots/${botId}/leave`);
}

export async function getTranscript(
  cfg: AttendeeConfig,
  botId: string,
): Promise<AttendeeTranscriptEntry[]> {
  const res = await call<
    AttendeeTranscriptEntry[] | { results: AttendeeTranscriptEntry[] }
  >(cfg, "GET", `/bots/${botId}/transcript`);
  if (Array.isArray(res)) return res;
  return res?.results ?? [];
}

export async function outputAudio(
  cfg: AttendeeConfig,
  botId: string,
  audioMp3Buffer: Buffer,
): Promise<void> {
  await call(cfg, "POST", `/bots/${botId}/output_audio`, {
    type: "audio/mp3",
    data: audioMp3Buffer.toString("base64"),
  });
}
