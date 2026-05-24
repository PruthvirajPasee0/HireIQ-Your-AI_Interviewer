import { requireRecruiter } from "@/lib/auth/role";
import AgentForm from "@/components/AgentForm";

export default async function NewAgentPage() {
  const user = await requireRecruiter();
  return (
    <>
      <section className="hero-banner">
        <h2>Create AI Interviewer Agent</h2>
        <p className="text-white/70">
          A reusable persona + question bank. You can attach this agent to any
          number of interview sessions.
        </p>
      </section>
      <AgentForm mode="create" recruiterId={user.id} />
    </>
  );
}
