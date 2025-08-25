import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const { type, role, level, techstack, amount, userid } = await request.json();

    if (!userid || !role || !level || !type || !amount || !techstack) {
      return Response.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const amountInt = Math.max(1, Math.min(50, Number(amount) || 0));

    const { text: raw } = await generateText({
      model: google("gemini-2.0-flash-001"),
      temperature: 0.95,
      topP: 0.95,
      prompt: `Prepare ${amountInt} interview questions.
        Context:
        - Role: ${role}
        - Level: ${level}
        - Tech stack: ${techstack}
        - Focus: ${type} (balance behavioral/technical accordingly)
        Requirements:
        - Produce exactly ${amountInt} distinct questions.
        - Ensure variety across topics and difficulty; avoid repeating similar phrasing across sessions.
        - No preambles or numbering, no extra commentary.
        - Avoid characters that might break TTS like "/" or "*".
        Output strictly as a JSON array of strings, e.g. ["Question 1", "Question 2", ...].
        `,
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Try to salvage JSON array from the response
      const match = raw.match(/\[[\s\S]*\]/);
      parsed = match ? JSON.parse(match[0]) : [];
    }

    const arr = Array.isArray(parsed) ? parsed : [];
    const cleaned = Array.from(new Set(
      arr
        .filter((q) => typeof q === "string")
        .map((q: string) => q.trim())
        .filter((q: string) => q.length > 0 && q.length <= 240)
    ));
    const finalQuestions = cleaned.slice(0, amountInt);
    if (finalQuestions.length === 0) {
      return Response.json({ success: false, error: "Failed to generate questions" }, { status: 502 });
    }

    const interview = {
      role: role as string,
      type: type as string,
      level: level as string,
      techstack: String(techstack).split(",").map((t) => t.trim()).filter(Boolean),
      questions: finalQuestions,
      userId: userid as string,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("interviews").add(interview);

    return Response.json({ success: true, id: docRef.id }, { status: 200 });
  } catch (error) {
    console.error("/api/generate-interview error:", error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ success: true, data: "ok" }, { status: 200 });
}
