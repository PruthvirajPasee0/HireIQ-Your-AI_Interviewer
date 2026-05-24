import { google } from "@ai-sdk/google";
import { generateText, generateObject } from "ai";
import { z } from "zod";
import type { LlmMessage } from "./prompts.js";

const MODEL_ID = process.env.GEMINI_TEXT_MODEL ?? "gemini-2.5-flash-lite";

export async function generateAgentReply(messages: LlmMessage[]): Promise<string> {
  const system = messages.find((m) => m.role === "system")?.content ?? "";
  const turns = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: m.content,
    }));

  const { text } = await generateText({
    model: google(MODEL_ID),
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
    model: google(MODEL_ID, { structuredOutputs: true }),
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
