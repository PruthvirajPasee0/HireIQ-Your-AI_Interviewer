import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { feedbackSchema } from "@/constants";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const { interviewId, transcript, feedbackId } = await request.json();

    const user = await getCurrentUser();
    if (!user) {
      return Response.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    const rateLimit = await enforceRateLimit({
      namespace: "create-feedback",
      key: user.id,
      limit: 40,
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

    if (!interviewId || !Array.isArray(transcript)) {
      return Response.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const interviewDoc = await db.collection("interviews").doc(interviewId).get();
    if (!interviewDoc.exists) {
      return Response.json(
        { success: false, error: "Interview not found" },
        { status: 404 }
      );
    }

    const interview = interviewDoc.data() as Interview;
    if (interview.userId !== user.id) {
      return Response.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    if (feedbackId) {
      const existingFeedbackDoc = await db.collection("feedback").doc(feedbackId).get();
      if (existingFeedbackDoc.exists) {
        const existingFeedback = existingFeedbackDoc.data() as Partial<Feedback>;
        if (
          existingFeedback.userId !== user.id ||
          existingFeedback.interviewId !== interviewId
        ) {
          return Response.json(
            { success: false, error: "Feedback ownership mismatch" },
            { status: 403 }
          );
        }
      }
    }

    const formattedTranscript = (
      transcript as Array<{ role: string; content: string }>
    )
      .map((s) => `- ${s.role}: ${s.content}\n`)
      .join("");

    const { object } = await generateObject({
      model: google("gemini-2.5-flash-lite", { structuredOutputs: true }),
      schema: feedbackSchema,
      prompt: `
        You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
        Transcript:
        ${formattedTranscript}

        Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
        - Communication Skills: Clarity, articulation, structured responses.
        - Technical Knowledge: Understanding of key concepts for the role.
        - Problem Solving: Ability to analyze problems and propose solutions.
        - Cultural Fit: Alignment with company values and job role.
        - Confidence and Clarity: Confidence in responses, engagement, and clarity.
      `,
      system:
        "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
    });

    const feedback = {
      interviewId,
      userId: user.id,
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

    return Response.json(
      { success: true, feedbackId: ref.id },
      { status: 200 }
    );
  } catch (error) {
    console.error("/api/create-feedback error:", error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
