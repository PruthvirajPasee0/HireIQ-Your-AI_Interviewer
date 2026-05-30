"use server";

import { randomUUID } from "crypto";
import { db } from "@/firebase/admin";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getAgentById } from "@/lib/actions/agents.action";
import { signInviteToken } from "@/lib/invite-token";
import { sendCandidateInvite, emailConfigured } from "@/lib/email/brevo";

const SESSIONS = "interviewSessions";

function assertRecruiter(user: User | null): asserts user is User {
  if (!user) throw new Error("Not authenticated");
  if (user.role !== "recruiter") throw new Error("Recruiter role required");
}

export async function createInterviewSession(
  params: CreateInterviewSessionParams
): Promise<
  | {
      success: true;
      sessionId: string;
      inviteToken: string;
      emailSent: boolean;
    }
  | { success: false; message: string }
> {
  const user = await getCurrentUser();
  assertRecruiter(user);
  if (params.recruiterId !== user.id)
    return { success: false, message: "Recruiter mismatch" };

  const agent = await getAgentById(params.agentId);
  if (!agent) return { success: false, message: "Agent not found" };
  if (agent.ownerRecruiterId !== user.id)
    return { success: false, message: "Forbidden" };

  if (!params.meetLink.trim().startsWith("https://meet.google.com/"))
    return { success: false, message: "Must be a meet.google.com link" };

  const ref = db.collection(SESSIONS).doc();
  const session: Omit<InterviewSession, "id"> = {
    agentId: params.agentId,
    recruiterId: user.id,
    candidateName: params.candidateName.trim(),
    candidateEmail: params.candidateEmail.trim(),
    meetLink: params.meetLink.trim(),
    scheduledAt: params.scheduledAt,
    status: "scheduled",
    currentQuestionIndex: 0,
    customInjections: [],
    controlActions: [],
    transcript: [],
    createdAt: new Date().toISOString(),
  };
  if (params.questions && params.questions.length > 0) {
    session.questions = params.questions.map((q) => q.trim()).filter(Boolean);
  }
  if (params.resumeText) session.resumeText = params.resumeText;
  if (params.resumeFileName) session.resumeFileName = params.resumeFileName;
  if (params.botProvider) session.botProvider = params.botProvider;

  await ref.set(session);

  const inviteToken = signInviteToken({
    sessionId: ref.id,
    candidateEmail: session.candidateEmail,
    exp: Math.floor(Date.parse(session.scheduledAt) / 1000) + 60 * 60 * 24, // valid 24h after scheduled
  });

  // Best-effort send the invite email if Resend is configured. Doesn't
  // block session creation if the send fails — recruiter can still copy
  // the link manually from the form.
  let emailSent = false;
  if (emailConfigured()) {
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.NEXT_PUBLIC_BASE_URL ??
      "http://localhost:3000";
    const inviteUrl = `${appUrl.replace(/\/$/, "")}/join/${inviteToken}`;
    const result = await sendCandidateInvite({
      to: session.candidateEmail,
      candidateName: session.candidateName,
      agentName: agent.name,
      scheduledAt: session.scheduledAt,
      meetLink: session.meetLink,
      inviteUrl,
    });
    emailSent = result.sent;
    if (!result.sent) {
      console.warn("Invite email send failed:", result.reason);
    }
  }

  return { success: true, sessionId: ref.id, inviteToken, emailSent } as const;
}

export async function getSessionsByRecruiter(): Promise<InterviewSession[]> {
  const user = await getCurrentUser();
  if (!user || user.role !== "recruiter") return [];

  const snap = await db
    .collection(SESSIONS)
    .where("recruiterId", "==", user.id)
    .get();

  const sessions = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as InterviewSession[];
  sessions.sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
  return sessions;
}

export async function getSessionById(id: string): Promise<InterviewSession | null> {
  const doc = await db.collection(SESSIONS).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as InterviewSession;
}

export async function getSessionForRecruiter(
  id: string
): Promise<InterviewSession | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "recruiter") return null;
  const s = await getSessionById(id);
  if (!s || s.recruiterId !== user.id) return null;
  return s;
}

export async function appendCustomInjection(sessionId: string, text: string) {
  const user = await getCurrentUser();
  assertRecruiter(user);

  const ref = db.collection(SESSIONS).doc(sessionId);
  const doc = await ref.get();
  if (!doc.exists) return { success: false, message: "Session not found" } as const;
  const data = doc.data() as InterviewSession;
  if (data.recruiterId !== user.id)
    return { success: false, message: "Forbidden" } as const;
  if (data.status === "ended" || data.status === "failed")
    return { success: false, message: "Session has ended" } as const;

  const injection: CustomInjection = {
    id: randomUUID(),
    text: text.trim(),
    injectedAt: new Date().toISOString(),
    consumed: false,
  };
  if (!injection.text)
    return { success: false, message: "Empty injection" } as const;

  await ref.update({
    customInjections: [...(data.customInjections ?? []), injection],
  });
  return { success: true } as const;
}

export async function appendControlAction(
  sessionId: string,
  type: ControlAction["type"]
) {
  const user = await getCurrentUser();
  assertRecruiter(user);

  const ref = db.collection(SESSIONS).doc(sessionId);
  const doc = await ref.get();
  if (!doc.exists) return { success: false, message: "Session not found" } as const;
  const data = doc.data() as InterviewSession;
  if (data.recruiterId !== user.id)
    return { success: false, message: "Forbidden" } as const;

  const action: ControlAction = {
    id: randomUUID(),
    type,
    issuedAt: new Date().toISOString(),
    consumed: false,
  };

  const update: Partial<InterviewSession> = {
    controlActions: [...(data.controlActions ?? []), action],
  };
  if (type === "end_session") update.status = "ended";

  await ref.update(update);
  return { success: true } as const;
}

export async function getFeedbackById(feedbackId: string): Promise<Feedback | null> {
  const doc = await db.collection("feedback").doc(feedbackId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Feedback;
}

export async function deleteInterviewSession(sessionId: string) {
  const user = await getCurrentUser();
  assertRecruiter(user);

  const ref = db.collection(SESSIONS).doc(sessionId);
  const doc = await ref.get();
  if (!doc.exists)
    return { success: false, message: "Session not found" } as const;

  const data = doc.data() as InterviewSession;
  if (data.recruiterId !== user.id)
    return { success: false, message: "Forbidden" } as const;
  if (data.status !== "ended" && data.status !== "failed")
    return {
      success: false,
      message:
        "Only ended or failed sessions can be deleted. End the session first.",
    } as const;

  // Cascade delete the feedback doc if there is one.
  if (data.feedbackId) {
    try {
      await db.collection("feedback").doc(data.feedbackId).delete();
    } catch (err) {
      console.warn("feedback delete failed", err);
    }
  }

  await ref.delete();
  return { success: true } as const;
}

export async function dispatchSessionNow(sessionId: string) {
  const user = await getCurrentUser();
  assertRecruiter(user);

  const ref = db.collection(SESSIONS).doc(sessionId);
  const doc = await ref.get();
  if (!doc.exists) return { success: false, message: "Session not found" } as const;
  const data = doc.data() as InterviewSession;
  if (data.recruiterId !== user.id)
    return { success: false, message: "Forbidden" } as const;

  const retryable = data.status === "scheduled" || data.status === "failed";
  if (!retryable)
    return { success: false, message: `Cannot dispatch in status: ${data.status}` } as const;

  const update: Record<string, unknown> = {
    status: "bot_dispatching",
    failureReason: null,
  };
  // If retrying after failure, clear residual state so the worker starts fresh.
  if (data.status === "failed") {
    update.attendeeBotId = null;
    update.currentQuestionIndex = 0;
    update.transcript = [];
    update.customInjections = [];
    update.controlActions = [];
    update.endedAt = null;
  }

  await ref.update(update);
  return { success: true } as const;
}
