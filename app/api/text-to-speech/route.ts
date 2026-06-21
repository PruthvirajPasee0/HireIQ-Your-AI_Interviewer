import { getCurrentUser } from "@/lib/actions/auth.action";
import { enforceRateLimit } from "@/lib/rate-limit";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    const rateLimit = await enforceRateLimit({
      namespace: "text-to-speech",
      key: user.id,
      limit: 400,
      windowMs: 60 * 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return Response.json(
        { success: false, error: "Rate limit exceeded. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        }
      );
    }

    const { text, voice: bodyVoice, format = "mp3" } = await request.json();
    if (!text) {
      return Response.json({ success: false, error: "Missing text" }, { status: 400 });
    }
    if (String(text).length > 1000) {
      return Response.json(
        { success: false, error: "Text too long" },
        { status: 400 }
      );
    }

    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      return Response.json({ success: false, error: "Missing DEEPGRAM_API_KEY" }, { status: 500 });
    }

    const voiceModel = bodyVoice || process.env.DEEPGRAM_TTS_VOICE || "aura-2-odysseus-en";

    const url = `https://api.deepgram.com/v1/speak?model=${encodeURIComponent(voiceModel)}&encoding=${encodeURIComponent(format)}`;

    const dgRes = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!dgRes.ok) {
      const errTxt = await dgRes.text();
      return Response.json({ success: false, error: errTxt }, { status: 502 });
    }

    const arrayBuf = await dgRes.arrayBuffer();
    return new Response(Buffer.from(arrayBuf), {
      status: 200,
      headers: {
        "Content-Type": format === "mp3" ? "audio/mpeg" : "audio/wav",
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    console.error("/api/text-to-speech error:", error);
    return Response.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
