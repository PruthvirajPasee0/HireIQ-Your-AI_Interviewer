import { getCurrentUser } from "@/lib/actions/auth.action";
import { db } from "@/firebase/admin";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ready: false, error: "Unauthorized" }, { status: 401 });
  }

  const interviewDoc = await db.collection("interviews").doc(params.id).get();
  if (!interviewDoc.exists) {
    return Response.json({ ready: false, error: "Interview not found" }, { status: 404 });
  }

  const interview = interviewDoc.data() as Interview;
  if (interview.userId !== user.id) {
    return Response.json({ ready: false, error: "Forbidden" }, { status: 403 });
  }

  const feedbackSnap = await db
    .collection("feedback")
    .where("interviewId", "==", params.id)
    .where("userId", "==", user.id)
    .limit(1)
    .get();

  return Response.json({ ready: !feedbackSnap.empty }, { status: 200 });
}
