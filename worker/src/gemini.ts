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
});

export type Feedback = z.infer<typeof feedbackSchema>;

export async function generateFeedback(transcriptText: string): Promise<Feedback> {
  const { object } = await generateObject({
    model: structuredModel(),
    schema: feedbackSchema,
    prompt: `You are an AI interviewer analyzing a live mock interview transcript. Be thorough. Don't be lenient.
Score the candidate from 0-100 in each category:
- Communication Skills: Clarity, articulation, structured responses.
- Technical Knowledge: Understanding of key concepts for the role.
- Problem Solving: Ability to analyze problems and propose solutions.
- Cultural Fit: Alignment with company values and job role.
- Confidence and Clarity: Confidence in responses, engagement, and clarity.

Transcript:
${transcriptText}`,
    system:
      "You are a professional interviewer analyzing a live mock interview. Output structured JSON only.",
  });
  return object;
}
