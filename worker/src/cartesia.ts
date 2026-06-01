import { logger } from "./logger.js";

const KEY = process.env.CARTESIA_API_KEY;
const VERSION = process.env.CARTESIA_VERSION ?? "2024-06-10";
const MODEL = process.env.CARTESIA_MODEL ?? "sonic-2";
const VOICE_ID =
  process.env.CARTESIA_VOICE_ID ?? "694f9389-aac1-45b6-b726-9d9369183238"; // "Sarah"
const SAMPLE_RATE = Number(process.env.CARTESIA_SAMPLE_RATE ?? 44100);
const BIT_RATE = Number(process.env.CARTESIA_BIT_RATE ?? 128000);

/**
 * The recruiter picks (and previews) a Deepgram aura-2 voice in the agent form.
 * Cartesia uses its own voice IDs, so without this map every agent spoke in
 * Cartesia's single default voice ("Sarah", female) regardless of the choice —
 * a male pick came out female. Map each aura-2 voice to the closest-matching
 * Cartesia voice (gender + character) so the interview honours the selection.
 */
const AURA_TO_CARTESIA: Record<string, string> = {
  "aura-2-odysseus-en": "f4a3a8e4-694c-4c45-9ca0-27caf97901b5", // Gavin (m, friendly/warm)
  "aura-2-zeus-en": "dbfa416f-d5c3-4006-854b-235ef6bdf4fd", // Damon (m, deep/commanding)
  "aura-2-orion-en": "3e39e9a5-585c-4f5f-bac6-5e4905c51095", // Cole (m, clear/neutral)
  "aura-2-thalia-en": "d6b0c62a-c7ff-477c-9a1f-eadd64b94360", // Melina (f, bright)
  "aura-2-andromeda-en": "ca566b43-944e-4474-b494-7d9f0695f307", // Celine (f, calm/soothing)
  "aura-2-helena-en": "62305e79-9d39-4643-b003-5e0b096fe4f4", // Vicky (f, professional)
  "aura-2-asteria-en": "c5d00dfb-501f-43f3-8e79-c810d24f5acd", // Harper (f, conversational)
  "aura-2-luna-en": "c1b9a03e-747f-40ad-8e7b-18caf8aaac0b", // Lira (f, soft/tranquil)
};

/** Resolve the per-agent voice into a Cartesia voice id (with sensible fallback). */
function resolveVoiceId(voiceModel?: string): string {
  if (!voiceModel) return VOICE_ID;
  if (AURA_TO_CARTESIA[voiceModel]) return AURA_TO_CARTESIA[voiceModel];
  // Allow a raw Cartesia uuid to be passed straight through.
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-/.test(voiceModel)) return voiceModel;
  return VOICE_ID;
}

export function cartesiaConfigured(): boolean {
  return !!KEY;
}

export async function tts(text: string, voiceModel?: string): Promise<Buffer> {
  if (!KEY) throw new Error("CARTESIA_API_KEY not set");
  const voiceId = resolveVoiceId(voiceModel);

  const res = await fetch("https://api.cartesia.ai/tts/bytes", {
    method: "POST",
    headers: {
      "X-API-Key": KEY,
      "Cartesia-Version": VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model_id: MODEL,
      transcript: text,
      voice: { mode: "id", id: voiceId },
      output_format: {
        container: "mp3",
        sample_rate: SAMPLE_RATE,
        bit_rate: BIT_RATE,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    logger.error({ status: res.status, err, voice: voiceId }, "cartesia tts error");
    throw new Error(`Cartesia TTS failed (${res.status}): ${err}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  return buf;
}
