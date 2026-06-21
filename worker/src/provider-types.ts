export type ProviderName = "attendee" | "vexa";

export interface BotHandle {
  provider: ProviderName;
  /** Attendee opaque id, e.g. "bot_xxx" */
  attendeeBotId?: string;
  /** Which Attendee instance handled the create — cloud or self-hosted Docker. */
  attendeeEndpoint?: "cloud" | "selfhost";
  /** Vexa: the native meeting id parsed from the Meet URL */
  vexaNativeMeetingId?: string;
  /** Vexa: the numeric meeting id returned from POST /bots, useful for bookkeeping */
  vexaNumericId?: number;
}

export interface NormalizedTranscriptEntry {
  speakerName: string;
  text: string;
  /** Monotonic ms timestamp from the start of the meeting. */
  timestampMs: number;
  /** Optional utterance duration in milliseconds (if provider supplies it). */
  durationMs?: number;
}

export interface BotProvider {
  name: ProviderName;
  createBot(meetingUrl: string, botName: string): Promise<BotHandle>;
  /** True once the bot is in the meeting and ready for media. */
  isBotJoined(handle: BotHandle): Promise<boolean>;
  /** True if the bot ended unexpectedly (kicked, errored, left). */
  isBotEnded(handle: BotHandle): Promise<boolean>;
  getTranscript(handle: BotHandle): Promise<NormalizedTranscriptEntry[]>;
  /** Play an MP3 buffer into the meeting as the bot's audio. */
  outputAudio(handle: BotHandle, audioMp3: Buffer): Promise<void>;
  /** Provider-hosted recording URL if available (null when unavailable/not ready). */
  getRecordingDownloadUrl(handle: BotHandle): Promise<string | null>;
  leaveBot(handle: BotHandle): Promise<void>;
}
