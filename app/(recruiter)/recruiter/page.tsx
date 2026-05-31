import Link from "next/link";
import { Button } from "@/components/ui/button";
import { requireRecruiter } from "@/lib/auth/role";
import { getAgentsByRecruiter } from "@/lib/actions/agents.action";
import { getSessionsByRecruiter } from "@/lib/actions/sessions.action";
import DeleteSessionButton from "@/components/DeleteSessionButton";
import LocalTime from "@/components/LocalTime";

export default async function RecruiterDashboard() {
  const user = await requireRecruiter();
  const [agents, sessions] = await Promise.all([
    getAgentsByRecruiter(),
    getSessionsByRecruiter(),
  ]);

  return (
    <>
      <section className="hero-banner">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
          <div>
            <h2 className="text-2xl font-bold">
              Welcome back, {user.name || "Recruiter"}
            </h2>
            <p className="text-white/70">
              Manage your AI interviewer agents and live interview sessions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild className="btn-primary">
              <Link href="/recruiter/agents/new" prefetch>
                + New Agent
              </Link>
            </Button>
            <Button asChild className="btn-primary" variant="secondary">
              <Link href="/recruiter/sessions/new" prefetch>
                Schedule Interview
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 mt-4">
        <h2>Your AI Interviewer Agents</h2>
        {agents.length === 0 ? (
          <p className="text-white/70">
            No agents yet. Create one to define a reusable interviewer persona
            and question bank.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((a) => (
              <Link
                key={a.id}
                href={`/recruiter/agents/${a.id}`}
                className="glass-card p-5 rounded-2xl border border-white/10 backdrop-blur-2xl bg-white/[0.06] hover:bg-white/[0.1] transition"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{a.name}</h3>
                  <span className="text-xs text-white/60">{a.level}</span>
                </div>
                <p className="text-sm text-white/70 mt-1">{a.targetRole}</p>
                <p className="text-xs text-white/50 mt-3">
                  {a.questionBank.length} questions · voice: {a.voiceProfile}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4 mt-8">
        <h2>Interview Sessions</h2>
        {sessions.length === 0 ? (
          <p className="text-white/70">No sessions scheduled yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((s) => {
              const isFinished = s.status === "ended" || s.status === "failed";
              return (
                <div
                  key={s.id}
                  className="relative glass-card p-4 rounded-xl border border-white/10 bg-white/[0.06] hover:bg-white/[0.1] transition"
                >
                  <Link
                    href={
                      s.status === "ended"
                        ? `/recruiter/sessions/${s.id}/feedback`
                        : `/recruiter/sessions/${s.id}/live`
                    }
                    className="block"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{s.candidateName}</p>
                        <p className="text-xs text-white/60 truncate">
                          {s.candidateEmail}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-white/10 shrink-0">
                        {s.status}
                      </span>
                    </div>
                    <p className="text-xs text-white/50 mt-2">
                      <LocalTime iso={s.scheduledAt} />
                    </p>
                  </Link>
                  {isFinished && (
                    <div className="mt-2 flex justify-end">
                      <DeleteSessionButton
                        sessionId={s.id}
                        candidateName={s.candidateName}
                        variant="icon"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
