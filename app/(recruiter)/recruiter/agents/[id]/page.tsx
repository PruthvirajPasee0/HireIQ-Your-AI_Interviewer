import { notFound } from "next/navigation";
import { requireRecruiter } from "@/lib/auth/role";
import { getAgentById } from "@/lib/actions/agents.action";
import AgentForm from "@/components/AgentForm";

export default async function EditAgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRecruiter();
  const { id } = await params;
  const agent = await getAgentById(id);
  if (!agent) notFound();

  return (
    <>
      <section className="hero-banner">
        <h2>Edit Agent</h2>
        <p className="text-white/70">{agent.name}</p>
      </section>
      <AgentForm mode="edit" recruiterId={user.id} agent={agent} />
    </>
  );
}
