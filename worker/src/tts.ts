import { logger } from "./logger.js";
import * as deepgram from "./deepgram.js";
import * as cartesia from "./cartesia.js";

/**
 * Unified TTS adapter. Prefers CARTESIA (sonic-2) — measured ~2x faster
 * full-synthesis latency than Deepgram aura-2 (~1.7s vs ~3.7s for a 2-sentence
 * reply), which directly cuts per-turn latency in the live interview. Falls
 * back to Deepgram when Cartesia is not configured OR errors during synthesis.
 * Returns an MP3 buffer suitable for Attendee's /output_audio endpoint.
 *
 * Set TTS_PROVIDER=deepgram to flip the preference back to Deepgram (so the
 * per-agent voiceProfile is honored).
 */
const PREFER = (process.env.TTS_PROVIDER ?? "cartesia").toLowerCase();

export async function synth(text: string, voiceModel?: string): Promise<Buffer> {
  const cartesiaFirst = PREFER !== "deepgram";

  if (cartesiaFirst && cartesia.cartesiaConfigured()) {
    try {
      return await cartesia.tts(text, voiceModel);
    } catch (err) {
      logger.warn({ err }, "cartesia tts failed, attempting Deepgram fallback");
      if (deepgram.deepgramConfigured()) {
        return deepgram.tts(text, voiceModel);
      }
      throw err;
    }
  }

  if (deepgram.deepgramConfigured()) {
    try {
      return await deepgram.tts(text, voiceModel);
    } catch (err) {
      logger.warn({ err }, "deepgram tts failed, attempting Cartesia fallback");
      if (cartesia.cartesiaConfigured()) {
        return cartesia.tts(text);
      }
      throw err;
    }
  }

  // Last resort: whichever is configured
  if (cartesia.cartesiaConfigured()) return cartesia.tts(text);

  throw new Error(
    "No TTS provider configured. Set CARTESIA_API_KEY and/or DEEPGRAM_API_KEY.",
  );
}
