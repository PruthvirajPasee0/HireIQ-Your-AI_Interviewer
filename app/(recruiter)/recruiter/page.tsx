import Link from "next/link";
import { Activity, BellRing, Bot, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireRecruiter } from "@/lib/auth/role";
import { getAgentsByRecruiter } from "@/lib/actions/agents.action";
import { getSessionsByRecruiter } from "@/lib/actions/sessions.action";
import DeleteSessionButton from "@/components/DeleteSessionButton";
import LocalTime from "@/components/LocalTime";
import RecruiterPipelineBoard from "@/components/RecruiterPipelineBoard";
import {
  getSessionStatusBadgeClass,
  getSessionStatusMeta,
} from "@/lib/session-status";

export default async function RecruiterDashboard() {
  const user = await requireRecruiter();
  const [agents, sessions] = await Promise.all([
    getAgentsByRecruiter(user.id),
    getSessionsByRecruiter(user.id),
  ]);
  const activeSessionsCount = sessions.filter(
    (session) => session.status === "scheduled" || session.status === "running"
  ).length;
  const feedbackReadyCount = sessions.filter(
    (session) =>
      session.status === "ended" &&
      !!session.feedbackId &&
      (session.reviewStatus ?? "new") === "new"
  ).length;
  const shortlistedCount = sessions.filter(
    (session) => session.reviewStatus === "shortlisted"
  ).length;
  const now = Date.now();
  const notifications = sessions
    .flatMap((session) => {
      const reviewStatus = session.reviewStatus ?? "new";
      const items: Array<{
        id: string;
        message: string;
        href: string;
        actionLabel: string;
      }> = [];

      if (session.status === "ended" && session.feedbackId && reviewStatus === "new") {
        items.push({
          id: `${session.id}-feedback-ready`,
          message: `Feedback ready for ${session.candidateName}.`,
          href: `/recruiter/sessions/${session.id}/feedback`,
          actionLabel: "Review now",
        });
      }

      if (
        session.recordingStatus === "available" &&
        !session.recordingLiked &&
        session.recordingAvailableUntil
      ) {
        const expiryMs = Date.parse(session.recordingAvailableUntil);
        if (Number.isFinite(expiryMs) && expiryMs > now && expiryMs - now <= 86400000) {
          items.push({
            id: `${session.id}-recording-expiring`,
            message: `Recording for ${session.candidateName} expires within 24h.`,
            href: `/recruiter/sessions/${session.id}/feedback`,
            actionLabel: "Save recording",
          });
        }
      }

      return items;
    })
    .slice(0, 8);

  return (
    <>
      <section className="hero-banner">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
          <div>
            <h2 className="text-2xl font-bold">
              Welcome back, {user.name || "Recruiter"}
            </h2>
            <p className="text-white/70">
              Manage interviewer agents, interview sessions, and hiring decisions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild className="btn-primary">
              <Link href="/recruiter/agents/new" prefetch>
                + New Agent
              </Link>
            </Button>
            <Button asChild className="btn-secondary">
              <Link href="/recruiter/sessions/new" prefetch>
                Schedule Interview
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-5">
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <Bot size={16} />
          </div>
          <p className="dashboard-stat-label">Active agents</p>
          <p className="dashboard-stat-value">{agents.length}</p>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <Activity size={16} />
          </div>
          <p className="dashboard-stat-label">Live / scheduled</p>
          <p className="dashboard-stat-value">{activeSessionsCount}</p>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <ClipboardCheck size={16} />
          </div>
          <p className="dashboard-stat-label">Feedback to review</p>
          <p className="dashboard-stat-value">{feedbackReadyCount}</p>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <BellRing size={16} />
          </div>
          <p className="dashboard-stat-label">Shortlisted</p>
          <p className="dashboard-stat-value">{shortlistedCount}</p>
        </div>
      </section>

      {notifications.length > 0 && (
        <section className="mt-6">
          <div className="glass-card p-4 rounded-xl border border-white/10 bg-white/[0.06]">
            <h3 className="font-semibold">Notifications</h3>
            <div className="mt-3 space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/20 p-3"
                >
                  <p className="text-sm text-white/80">{notification.message}</p>
                  <Button asChild className="btn-secondary h-8 px-3">
                    <Link href={notification.href} prefetch>
                      {notification.actionLabel}
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4 mt-4">
        <div className="flex items-center justify-between gap-2">
          <h2>Your AI Interviewer Agents</h2>
          <span className="text-xs rounded-full border border-white/15 px-3 py-1 text-white/70">
            {agents.length} total
          </span>
        </div>
        {agents.length === 0 ? (
          <div className="glass-card rounded-xl border border-white/10 bg-white/[0.06] p-6">
            <p className="text-white/80">
              No agents yet. Create one to define a reusable interviewer persona
              and question bank.
            </p>
            <Button asChild className="btn-primary mt-4">
              <Link href="/recruiter/agents/new" prefetch>
                Create first agent
              </Link>
            </Button>
          </div>
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
        <div className="flex items-center justify-between gap-2">
          <h2>Interview Sessions</h2>
          <span className="text-xs rounded-full border border-white/15 px-3 py-1 text-white/70">
            {sessions.length} total
          </span>
        </div>
        {sessions.length === 0 ? (
          <div className="glass-card rounded-xl border border-white/10 bg-white/[0.06] p-6">
            <p className="text-white/80">No sessions scheduled yet.</p>
            <p className="text-sm text-white/60 mt-1">
              Schedule an interview and send the candidate join link to get started.
            </p>
            <Button asChild className="btn-primary mt-4">
              <Link href="/recruiter/sessions/new" prefetch>
                Schedule interview
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((s) => {
              const isFinished = s.status === "ended" || s.status === "failed";
              const statusMeta = getSessionStatusMeta(s.status);
              const statusBadgeClass = getSessionStatusBadgeClass(s.status);
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
                      <span
                        className={`text-xs px-2 py-1 rounded shrink-0 ${statusBadgeClass}`}
                      >
                        {statusMeta.label}
                      </span>
                    </div>
                    <p className="text-xs text-white/50 mt-2">
                      <LocalTime iso={s.scheduledAt} />
                    </p>
                    <p className="text-xs text-white/60 mt-1">
                      {statusMeta.description}
                    </p>
                  </Link>
                  {s.status === "failed" && (
                    <div className="mt-3">
                      <Button asChild className="btn-primary w-full">
                        <Link href={`/recruiter/sessions/${s.id}/live`} prefetch>
                          Open live controls to retry
                        </Link>
                      </Button>
                    </div>
                  )}
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

      <RecruiterPipelineBoard sessions={sessions} />
    </>
  );
}
