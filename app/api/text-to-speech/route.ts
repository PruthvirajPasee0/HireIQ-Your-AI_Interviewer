export async function POST(request: Request) {
  try {
    const { text, voice: bodyVoice, format = "mp3" } = await request.json();
    if (!text) {
      return Response.json({ success: false, error: "Missing text" }, { status: 400 });
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
  } catch (e: any) {
    console.error("/api/text-to-speech error:", e);
    return Response.json({ success: false, error: String(e) }, { status: 500 });
  }
}
