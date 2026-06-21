import { getCurrentUser } from "@/lib/actions/auth.action";
import { db } from "@/firebase/admin";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "recruiter") {
    return Response.json({ ready: false, error: "Unauthorized" }, { status: 401 });
  }

  const sessionDoc = await db.collection("interviewSessions").doc(params.id).get();
  if (!sessionDoc.exists) {
    return Response.json({ ready: false, error: "Session not found" }, { status: 404 });
  }

  const session = { id: sessionDoc.id, ...sessionDoc.data() } as InterviewSession;
  if (session.recruiterId !== user.id) {
    return Response.json({ ready: false, error: "Forbidden" }, { status: 403 });
  }

  if (!session.feedbackId) {
    return Response.json({ ready: false, status: session.status }, { status: 200 });
  }

  const feedbackDoc = await db.collection("feedback").doc(session.feedbackId).get();
  return Response.json(
    { ready: feedbackDoc.exists, status: session.status },
    { status: 200 }
  );
}
