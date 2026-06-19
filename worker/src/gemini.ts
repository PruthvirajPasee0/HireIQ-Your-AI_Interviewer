import { google } from "@ai-sdk/google";
import { mistral } from "@ai-sdk/mistral";
import { generateText, generateObject, type LanguageModel } from "ai";
import { z } from "zod";
import type { LlmMessage } from "./prompts.js";

/**
 * LLM provider selection. Defaults to Mistral (much higher free-tier rate
 * limits: ~50 req/min vs Gemini free's ~15 req/min, no tight daily cap), with
 * Gemini available as a fallback by setting LLM_PROVIDER=google.
 *
 *   LLM_PROVIDER       = mistral | google   (default: mistral)
 *   MISTRAL_MODEL      = mistral-small-latest (default)
 *   GEMINI_TEXT_MODEL  = gemini-2.5-flash-lite (default, used when provider=google)
 */
const PROVIDER = (process.env.LLM_PROVIDER ?? "mistral").toLowerCase();
const MISTRAL_MODEL = process.env.MISTRAL_MODEL ?? "mistral-small-latest";
const GEMINI_MODEL = process.env.GEMINI_TEXT_MODEL ?? "gemini-2.5-flash-lite";

function textModel(): LanguageModel {
  return PROVIDER === "google" ? google(GEMINI_MODEL) : mistral(MISTRAL_MODEL);
}

function structuredModel(): LanguageModel {
  return PROVIDER === "google"
    ? google(GEMINI_MODEL, { structuredOutputs: true })
    : mistral(MISTRAL_MODEL);
}

export async function generateAgentReply(messages: LlmMessage[]): Promise<string> {
  const system = messages.find((m) => m.role === "system")?.content ?? "";
  const turns = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: m.content,
    }));

  const { text } = await generateText({
    model: textModel(),
    system,
    messages: turns,
    temperature: 0.6,
  });

  return text.trim();
}

const feedbackSchema = z.object({
  totalScore: z.number().min(0).max(100),
  categoryScores: z.array(
    z.object({
      name: z.enum([
        "Communication Skills",
        "Technical Knowledge",
        "Problem Solving",
        "Cultural Fit",
        "Confidence and Clarity",
      ]),
      score: z.number().min(0).max(100),
      comment: z.string(),
    }),
  ).length(5),
  strengths: z.array(z.string()),
  areasForImprovement: z.array(z.string()),
  finalAssessment: z.string(),
  // JD-driven assessment. skillScores is per rubric skill (or derived skills if
  // no rubric). jobFitScore is the weighted "fit for THIS job" headline.
  skillScores: z
    .array(
      z.object({
        skill: z.string(),
        score: z.number().min(0).max(100),
        evidence: z.string(),
        mustHave: z.boolean(),
      }),
    )
    .default([]),
  jobFitScore: z.number().min(0).max(100),
  recommendation: z.enum(["strong_fit", "fit", "borderline", "not_a_fit"]),
});

export type Feedback = z.infer<typeof feedbackSchema>;

export interface FeedbackContext {
  role: string;
  level: string;
  techstack: string[];
  questions: string[];
  jobDescription?: string;
  rubric?: { skill: string; weight: number; mustHave: boolean }[];
}

export async function generateFeedback(
  transcriptText: string,
  ctx: FeedbackContext,
): Promise<Feedback> {
  const focus = ctx.techstack.length ? ctx.techstack.join(", ") : "general";
  const questionsBlock = ctx.questions.length
    ? ctx.questions.map((q, i) => `${i + 1}. ${q}`).join("\n")
    : "(not recorded)";

  const jdBlock = ctx.jobDescription?.trim()
    ? `\nJOB DESCRIPTION (assess fit against THIS):\n${ctx.jobDescription.trim()}\n`
    : "";
  const rubric = (ctx.rubric ?? []).filter((r) => r.skill?.trim());
  const rubricBlock = rubric.length
    ? `\nSCORING RUBRIC — score the candidate on EXACTLY these skills (skillScores), carrying over weight and mustHave for each:\n${rubric
        .map(
          (r) =>
            `- ${r.skill} (weight ${r.weight}/5${r.mustHave ? ", MUST-HAVE" : ""})`,
        )
        .join("\n")}`
    : `\nSCORING RUBRIC: none provided — derive 4-6 key skills for this role from the job description / role and score those (set mustHave=false unless clearly essential).`;

  const { object } = await generateObject({
    model: structuredModel(),
    schema: feedbackSchema,
    system:
      "You are a fair, rigorous senior interviewer producing a calibrated, evidence-based assessment. Output structured JSON only.",
    prompt: `Assess this candidate for the role of ${ctx.role} (level: ${ctx.level}; focus areas: ${focus}).
${jdBlock}
CALIBRATE TO THE LEVEL. Judge against what is reasonable to expect from a ${ctx.level} ${ctx.role} — not an absolute world expert. A strong, level-appropriate answer should score highly even if it lacks the depth you'd expect from someone more senior. Conversely, hold a senior candidate to a higher bar.

Questions that were asked:
${questionsBlock}
${rubricBlock}

JOB-FIT ASSESSMENT (the most important output):
- skillScores: score each rubric skill 0-100, grounded ONLY in transcript evidence. For each, set the "evidence" field to the specific thing the candidate said (or "Not demonstrated" if absent), and carry over mustHave.
- jobFitScore (0-100): the candidate's overall fit FOR THIS JOB, weighted by each skill's weight (higher-weight skills count more). This is the headline number.
- recommendation: "strong_fit" | "fit" | "borderline" | "not_a_fit". A gap on any MUST-HAVE skill caps the recommendation at "borderline" at best, no matter how strong the rest is.

Score 0-100 in each category, INTERPRETING each for THIS specific role:
- Communication Skills: clarity, structure, and articulation of answers.
- Technical Knowledge: command of the domain knowledge that actually matters for a ${ctx.role}. For engineering roles this is technical depth in ${focus}; for non-engineering roles (e.g. product, data, design) interpret it as the relevant FUNCTIONAL expertise (product sense, analytical rigor, etc.), NOT generic coding.
- Problem Solving: how well they reason through problems, weigh trade-offs, and justify decisions.
- Cultural Fit: collaboration, ownership, and professionalism evident in their answers. Judge ONLY from what they actually said — do NOT invent or assume specific company values.
- Confidence and Clarity: composure, engagement, and clarity of delivery.

RULES (important for accuracy):
- Be strictly EVIDENCE-BASED. Every score and comment must be grounded in what the candidate ACTUALLY said in the transcript; reference specifics in the comments.
- If a topic wasn't covered, or the candidate said very little, do NOT fabricate competence — score conservatively and state plainly that the evidence was limited.
- This is a SPOKEN interview transcribed automatically, so it contains transcription errors, fragments, fillers ("um", "uh"), and run-together words. Judge the candidate's INTENT and substance — do NOT penalize garbled words, mis-transcriptions, or speech disfluencies.
- totalScore = overall suitability for a ${ctx.level} ${ctx.role}, weighted toward what matters MOST for that role (not a flat average).
- strengths and areasForImprovement must be concrete and specific to THIS candidate's answers.

Transcript:
${transcriptText}`,
  });
  return object;
}
