import { requireRecruiter } from "@/lib/auth/role";
import { getAgentsByRecruiter } from "@/lib/actions/agents.action";
import SessionScheduleForm from "@/components/SessionScheduleForm";

export default async function NewSessionPage() {
  const user = await requireRecruiter();
  const agents = await getAgentsByRecruiter();
  const options = agents.map((a) => ({
    id: a.id,
    name: a.name,
    targetRole: a.targetRole,
    level: a.level,
  }));

  return (
    <>
      <section className="hero-banner">
        <h2>Schedule an Interview</h2>
        <p className="text-white/70">
          Pick one of your agents and a Google Meet link. We&apos;ll generate an
          invite link to send to the candidate.
        </p>
      </section>
      <SessionScheduleForm recruiterId={user.id} agents={options} />
    </>
  );
}
