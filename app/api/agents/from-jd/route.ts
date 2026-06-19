import { NextRequest } from "next/server";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { getCurrentUser } from "@/lib/actions/auth.action";

export const runtime = "nodejs";
export const maxDuration = 60;

const LEVELS = ["Intern", "Junior", "Mid", "Senior", "Staff", "Principal"] as const;

const FromJdSchema = z.object({
  name: z
    .string()
    .describe("A short agent name for this interview, e.g. 'Senior Backend Screen'."),
  targetRole: z.string().describe("The job title, e.g. 'Backend Engineer'."),
  level: z.enum(LEVELS).describe("Seniority implied by the JD."),
  techstack: z
    .array(z.string())
    .describe("Key technologies / tools mentioned in the JD."),
  questionBank: z
    .array(z.string())
    .describe(
      "8-10 interview questions that probe the JD's required skills. Each is one self-contained spoken question, under 30 words.",
    ),
  rubric: z
    .array(
      z.object({
        skill: z
          .string()
          .describe("A specific competency to assess, e.g. 'End-to-end payroll processing'."),
        weight: z
          .number()
          .min(1)
          .max(5)
          .describe("Importance 1-5 — how central this skill is to the role."),
        mustHave: z
          .boolean()
          .describe("True if the JD treats this as a hard requirement."),
      }),
    )
    .describe("5-8 distinct skills the candidate should be scored on for this job."),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "recruiter")
      return Response.json({ error: "Recruiter only" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const jobDescription = String(body?.jobDescription ?? "").trim();
    if (jobDescription.length < 30)
      return Response.json(
        { error: "Paste a fuller job description (at least a few lines)." },
        { status: 400 },
      );

    const { object } = await generateObject({
      model: google(process.env.GEMINI_TEXT_MODEL ?? "gemini-2.5-flash-lite", {
        structuredOutputs: true,
      }),
      schema: FromJdSchema,
      prompt: `You are setting up a structured screening interview from a job description.

Read the JOB DESCRIPTION below and produce:
- name: a short label for this interview.
- targetRole + level: inferred from the JD.
- techstack: the key tools/technologies named (for a non-technical role, the key tools/systems, e.g. HRMS names).
- questionBank: 8-10 questions that directly probe the role's required skills and responsibilities. One self-contained spoken sentence each, under 30 words, natural to ask aloud. Start with 1 warm-up, then skill-specific questions, then 1-2 behavioral.
- rubric: 5-8 DISTINCT skills/competencies to score the candidate on — drawn from the JD's actual requirements (not generic). Mark the hard requirements as mustHave:true and set weight 1-5 by importance.

JOB DESCRIPTION:
${jobDescription}`,
      temperature: 0.4,
    });

    return Response.json({ success: true, ...object });
  } catch (err) {
    console.error("/api/agents/from-jd error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 },
    );
  }
}
