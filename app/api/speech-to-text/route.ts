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
      namespace: "speech-to-text",
      key: user.id,
      limit: 300,
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

    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      return Response.json({ success: false, error: "Missing DEEPGRAM_API_KEY" }, { status: 500 });
    }

    const contentType = request.headers.get("content-type") || "audio/webm";
    const audioBuf = await request.arrayBuffer();

    const url = `https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language=en`;

    const dgRes = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": contentType,
      },
      body: Buffer.from(audioBuf),
    });

    if (!dgRes.ok) {
      const errTxt = await dgRes.text();
      return Response.json({ success: false, error: errTxt }, { status: 502 });
    }

    const data = await dgRes.json();
    // Try common Deepgram transcript paths
    const transcript =
      data?.results?.channels?.[0]?.alternatives?.[0]?.transcript ||
      data?.results?.channels?.[0]?.alternatives?.[0]?.paragraphs?.transcript ||
      data?.results?.alternatives?.[0]?.transcript ||
      "";

    return Response.json({ success: true, transcript }, { status: 200 });
  } catch (error: unknown) {
    console.error("/api/speech-to-text error:", error);
    return Response.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
