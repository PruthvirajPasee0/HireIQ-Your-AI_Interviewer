import { logger } from "./logger.js";

const KEY = process.env.CARTESIA_API_KEY;
const VERSION = process.env.CARTESIA_VERSION ?? "2024-06-10";
const MODEL = process.env.CARTESIA_MODEL ?? "sonic-2";
const VOICE_ID =
  process.env.CARTESIA_VOICE_ID ?? "694f9389-aac1-45b6-b726-9d9369183238"; // "Sarah"
const SAMPLE_RATE = Number(process.env.CARTESIA_SAMPLE_RATE ?? 44100);
const BIT_RATE = Number(process.env.CARTESIA_BIT_RATE ?? 128000);

export function cartesiaConfigured(): boolean {
  return !!KEY;
}

export async function tts(text: string): Promise<Buffer> {
  if (!KEY) throw new Error("CARTESIA_API_KEY not set");

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
      voice: { mode: "id", id: VOICE_ID },
      output_format: {
        container: "mp3",
        sample_rate: SAMPLE_RATE,
        bit_rate: BIT_RATE,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    logger.error({ status: res.status, err, voice: VOICE_ID }, "cartesia tts error");
    throw new Error(`Cartesia TTS failed (${res.status}): ${err}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  return buf;
}
