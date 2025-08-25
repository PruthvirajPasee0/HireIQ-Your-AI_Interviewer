import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { feedbackSchema } from "@/constants";

export async function POST(request: Request) {
  try {
    const { interviewId, userId, transcript, feedbackId } = await request.json();

    if (!interviewId || !userId || !Array.isArray(transcript)) {
      return Response.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const formattedTranscript = (transcript as Array<{ role: string; content: string }>)
      .map((s) => `- ${s.role}: ${s.content}\n`)
      .join("");

    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001", { structuredOutputs: false }),
      schema: feedbackSchema,
      prompt: `
        You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
        Transcript:
        ${formattedTranscript}

        Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
        - Communication Skills: Clarity, articulation, structured responses.
        - Technical Knowledge: Understanding of key concepts for the role.
        - Problem-Solving: Ability to analyze problems and propose solutions.
        - Cultural & Role Fit: Alignment with company values and job role.
        - Confidence & Clarity: Confidence in responses, engagement, and clarity.
      `,
      system: "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
    });

    const feedback = {
      interviewId,
      userId,
      totalScore: object.totalScore,
      categoryScores: object.categoryScores,
      strengths: object.strengths,
      areasForImprovement: object.areasForImprovement,
      finalAssessment: object.finalAssessment,
      createdAt: new Date().toISOString(),
    };

    const ref = feedbackId
      ? db.collection("feedback").doc(feedbackId)
      : db.collection("feedback").doc();

    await ref.set(feedback);

    return Response.json({ success: true, feedbackId: ref.id }, { status: 200 });
  } catch (error) {
    console.error("/api/create-feedback error:", error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}
