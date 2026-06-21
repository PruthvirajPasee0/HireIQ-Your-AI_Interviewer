import { notFound } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { verifyInviteToken } from "@/lib/invite-token";
import { getSessionById } from "@/lib/actions/sessions.action";
import { db } from "@/firebase/admin";
import LocalTime from "@/components/LocalTime";

async function getAgentMinimal(agentId: string) {
  const doc = await db.collection("agents").doc(agentId).get();
  if (!doc.exists) return null;
  const data = doc.data() as Omit<Agent, "id">;
  return { name: data.name, targetRole: data.targetRole };
}

export default async function CandidateJoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const payload = verifyInviteToken(token);
  if (!payload) notFound();

  const session = await getSessionById(payload.sessionId);
  if (!session) notFound();
  if (session.candidateEmail.toLowerCase() !== payload.candidateEmail.toLowerCase())
    notFound();

  const agent = await getAgentMinimal(session.agentId);

  const scheduled = new Date(session.scheduledAt);
  const now = new Date();
  const minutesUntil = Math.round((scheduled.getTime() - now.getTime()) / 60000);
  const isLive =
    session.status === "in_progress" ||
    session.status === "bot_joined" ||
    session.status === "bot_dispatching";
  const isEnded = session.status === "ended" || session.status === "failed";

  return (
    <div className="dashboard-bg min-h-screen flex items-center justify-center px-4">
      <div className="glass-card max-w-xl w-full p-8 rounded-2xl border border-white/10 backdrop-blur-2xl bg-white/[0.06]">
        <div className="flex items-center gap-2 mb-6">
          <Image src="/logo.svg" alt="logo" height={28} width={32} />
          <h2 className="text-primary-100">Hireiq.ai</h2>
        </div>

        <h1 className="text-2xl font-bold">
          Hi {session.candidateName.split(" ")[0]} —
        </h1>
        <p className="text-white/80 mt-2">
          You&apos;ve been invited to an interview
          {agent ? ` for ${agent.targetRole}` : ""}.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
          <div className="glass-card p-4 rounded-xl border border-white/10 bg-white/[0.04]">
            <p className="text-xs text-white/50">Scheduled</p>
            <p className="font-medium mt-1">
              <LocalTime iso={session.scheduledAt} />
            </p>
          </div>
          <div className="glass-card p-4 rounded-xl border border-white/10 bg-white/[0.04]">
            <p className="text-xs text-white/50">Interviewer</p>
            <p className="font-medium mt-1">
              {agent ? agent.name : "AI Interviewer"}
            </p>
          </div>
        </div>

        {isEnded ? (
          <p className="mt-6 text-white/70">
            This interview session has ended. Thank you for your time.
          </p>
        ) : (
          <>
            <div className="mt-6">
              <Button asChild className="btn-primary w-full">
                <a href={session.meetLink} target="_blank" rel="noreferrer">
                  Open Google Meet
                </a>
              </Button>
            </div>
            <p className="text-xs text-white/50 mt-3">
              {isLive
                ? "The interviewer is in the meeting now."
                : minutesUntil > 0
                ? `The interview starts in ~${minutesUntil} min. You can open Meet now and wait.`
                : "Your interview is scheduled — open Meet to join."}
            </p>
            <ul className="text-xs text-white/60 mt-6 space-y-1 list-disc pl-5">
              <li>Allow camera and microphone access when prompted.</li>
              <li>Use Chrome or Edge for the best experience.</li>
              <li>
                Your interviewer is an AI agent. A human recruiter may also join.
              </li>
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
