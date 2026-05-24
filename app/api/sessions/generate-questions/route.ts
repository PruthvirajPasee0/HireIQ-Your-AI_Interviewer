import { NextRequest } from "next/server";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getAgentById } from "@/lib/actions/agents.action";

export const runtime = "nodejs";
// PDFs can take a few seconds for Gemini to process.
export const maxDuration = 60;

const QuestionsSchema = z.object({
  resumeSummary: z.string().describe(
    "A 1-2 sentence summary of the candidate's background, used for context.",
  ),
  questions: z
    .array(z.string())
    .describe(
      "Interview questions tailored to the candidate's resume + the target role. Each is one self-contained question, asked aloud.",
    ),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "recruiter")
      return Response.json({ error: "Recruiter only" }, { status: 403 });

    const form = await req.formData();
    const file = form.get("resume");
    const agentId = String(form.get("agentId") ?? "");
    const candidateName = String(form.get("candidateName") ?? "");
    const countRaw = Number(form.get("count") ?? 5);
    const count = Math.max(1, Math.min(20, Number.isFinite(countRaw) ? countRaw : 5));

    if (!(file instanceof File))
      return Response.json({ error: "Missing resume file" }, { status: 400 });
    if (!agentId)
      return Response.json({ error: "Missing agentId" }, { status: 400 });

    const agent = await getAgentById(agentId);
    if (!agent)
      return Response.json({ error: "Agent not found" }, { status: 404 });

    if (file.size > 8 * 1024 * 1024)
      return Response.json({ error: "Resume must be under 8 MB" }, { status: 400 });
    if (file.type && file.type !== "application/pdf")
      return Response.json({ error: "Only PDF resumes are supported" }, { status: 400 });

    const pdfBytes = new Uint8Array(await file.arrayBuffer());

    const { object } = await generateObject({
      model: google(process.env.GEMINI_TEXT_MODEL ?? "gemini-2.5-flash-lite", {
        structuredOutputs: true,
      }),
      schema: QuestionsSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are designing a live voice interview for ${
                candidateName || "the candidate"
              }.

ROLE BEING ASSESSED: ${agent.targetRole} (level: ${agent.level})
TECH FOCUS: ${agent.techstack.join(", ") || "general"}
INTERVIEWER PERSONA: ${agent.persona}

The candidate's resume is attached as a PDF. Read it.

Generate EXACTLY ${count} interview questions tailored to:
1. The specific projects, companies, and skills on the resume (call them out by name when relevant).
2. The target role and level above.
3. A mix: 1-2 warm-up/background questions, then technical depth questions on specific things on the resume, then 1-2 behavioral/situational questions.

Each question must be:
- One self-contained sentence, no multi-part questions.
- Natural to ask out loud.
- Concise — under 30 words.
- NOT generic ("tell me about yourself" is fine for warm-up #1, but most questions must reference resume specifics).

Also produce a 1-2 sentence resumeSummary the interviewer can use as context.`,
            },
            {
              type: "file",
              data: pdfBytes,
              mimeType: "application/pdf",
            },
          ],
        },
      ],
      temperature: 0.4,
    });

    return Response.json({
      success: true,
      questions: object.questions,
      resumeSummary: object.resumeSummary,
    });
  } catch (err) {
    console.error("/api/sessions/generate-questions error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 },
    );
  }
}
