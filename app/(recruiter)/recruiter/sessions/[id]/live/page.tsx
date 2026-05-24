import { notFound } from "next/navigation";
import { requireRecruiter } from "@/lib/auth/role";
import { getSessionForRecruiter } from "@/lib/actions/sessions.action";
import { getAgentById } from "@/lib/actions/agents.action";
import LiveControlPanel from "@/components/LiveControlPanel";

export default async function LiveSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRecruiter();
  const { id } = await params;
  const session = await getSessionForRecruiter(id);
  if (!session) notFound();
  const agent = await getAgentById(session.agentId);

  return (
    <>
      <section className="hero-banner">
        <h2>Live Interview</h2>
        <p className="text-white/70">
          Watch the transcript and steer the conversation. Speak directly in the
          Meet to interrupt the AI at any time.
        </p>
      </section>
      <LiveControlPanel
        initial={session}
        agentName={agent?.name ?? "AI Interviewer"}
      />
    </>
  );
}
