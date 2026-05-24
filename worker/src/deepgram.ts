import { logger } from "./logger.js";

const KEY = process.env.DEEPGRAM_API_KEY;
const DEFAULT_VOICE =
  process.env.DEEPGRAM_TTS_VOICE ?? "aura-2-odysseus-en";

export function deepgramConfigured(): boolean {
  return !!KEY;
}

export async function tts(text: string, voiceModel?: string): Promise<Buffer> {
  if (!KEY) throw new Error("DEEPGRAM_API_KEY not set");
  const voice = voiceModel ?? DEFAULT_VOICE;
  const url = `https://api.deepgram.com/v1/speak?model=${encodeURIComponent(voice)}&encoding=mp3`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Token ${KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const err = await res.text();
    logger.error({ status: res.status, err, voice }, "deepgram tts error");
    throw new Error(`Deepgram TTS failed (${res.status}): ${err}`);
  }
  const arr = await res.arrayBuffer();
  return Buffer.from(arr);
}
