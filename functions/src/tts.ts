import { logger } from "./logger";
import * as deepgram from "./deepgram";
import * as cartesia from "./cartesia";

/**
 * Unified TTS adapter. Prefers Deepgram (so per-agent voiceProfile is honored).
 * Falls back to Cartesia when Deepgram is not configured OR errors during
 * synthesis. Returns an MP3 buffer suitable for Attendee's /output_audio
 * endpoint.
 */
export async function synth(text: string, voiceModel?: string): Promise<Buffer> {
  const preferDeepgram = deepgram.deepgramConfigured();

  if (preferDeepgram) {
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

  if (cartesia.cartesiaConfigured()) {
    logger.info("Deepgram not configured — using Cartesia for TTS");
    return cartesia.tts(text);
  }

  throw new Error(
    "No TTS provider configured. Set DEEPGRAM_API_KEY and/or CARTESIA_API_KEY.",
  );
}
