import { notFound } from "next/navigation";
import Link from "next/link";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { requireRecruiter } from "@/lib/auth/role";
import {
  getSessionForRecruiter,
  getFeedbackById,
} from "@/lib/actions/sessions.action";
import DeleteSessionButton from "@/components/DeleteSessionButton";
import DownloadPdfButton from "@/components/DownloadPdfButton";

const RECOMMENDATION: Record<string, { label: string; cls: string }> = {
  strong_fit: { label: "Strong fit", cls: "bg-green-500/20 text-green-300" },
  fit: { label: "Fit", cls: "bg-emerald-500/15 text-emerald-300" },
  borderline: { label: "Borderline", cls: "bg-yellow-500/15 text-yellow-300" },
  not_a_fit: { label: "Not a fit", cls: "bg-red-500/15 text-red-300" },
};

function barColor(pct: number) {
  return pct >= 75 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500";
}

export default async function SessionFeedbackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRecruiter();
  const { id } = await params;
  const session = await getSessionForRecruiter(id);
  if (!session) notFound();

  const feedback = session.feedbackId
    ? await getFeedbackById(session.feedbackId)
    : null;

  const score = feedback?.totalScore ?? 0;

  return (
    <section className="feedback-print flex flex-col gap-6 print:bg-white print:text-black">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-semibold">{session.candidateName}</h1>
          <p className="text-white/60">{session.candidateEmail}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="secondary">
            <Link href="/recruiter">Back to dashboard</Link>
          </Button>
          {feedback && <DownloadPdfButton />}
          {(session.status === "ended" || session.status === "failed") && (
            <DeleteSessionButton
              sessionId={session.id}
              candidateName={session.candidateName}
              variant="button"
              redirectTo="/recruiter"
            />
          )}
        </div>
      </div>

      {/* Print-only header */}
      <div className="hidden print:block print:mb-6">
        <h1 className="text-2xl font-bold">
          Interview Feedback — {session.candidateName}
        </h1>
        <p className="text-sm text-gray-600">
          {session.candidateEmail} ·{" "}
          {feedback?.createdAt
            ? dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A")
            : ""}
        </p>
      </div>

      {!feedback ? (
        <div className="glass-card p-6 rounded-xl border border-white/10 bg-white/[0.06]">
          <p className="font-medium">
            {session.status === "ended"
              ? "Generating feedback..."
              : "Feedback will appear here once the interview ends."}
          </p>
          <p className="text-sm text-white/60 mt-1">
            Status: {session.status}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="glass-card p-6 flex flex-col items-center justify-center gap-2">
              <p className="text-5xl font-bold text-indigo-300">{score}</p>
              <p className="text-xs text-white/60">out of 100</p>
            </div>
            <div className="lg:col-span-2 glass-card p-6">
              <h3 className="text-lg font-semibold mb-2">Summary</h3>
              <p className="leading-7 text-white/80">
                {feedback.finalAssessment}
              </p>
              <p className="text-xs text-white/40 mt-3">
                Generated {dayjs(feedback.createdAt).format("MMM D, h:mm A")}
              </p>
            </div>
          </div>

          {(feedback.jobFitScore != null ||
            (feedback.skillScores?.length ?? 0) > 0) && (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h3 className="text-lg font-semibold">Job Fit</h3>
                <div className="flex items-center gap-3">
                  {feedback.recommendation &&
                    RECOMMENDATION[feedback.recommendation] && (
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          RECOMMENDATION[feedback.recommendation].cls
                        }`}
                      >
                        {RECOMMENDATION[feedback.recommendation].label}
                      </span>
                    )}
                  {feedback.jobFitScore != null && (
                    <span className="text-2xl font-bold text-indigo-300">
                      {feedback.jobFitScore}
                      <span className="text-sm text-white/50">/100</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-4">
                {feedback.skillScores?.map((s, i) => {
                  const pct = Math.max(0, Math.min(100, s.score));
                  return (
                    <div key={i} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium flex items-center gap-2">
                          {s.skill}
                          {s.mustHave && (
                            <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                              must-have
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-white/60">{s.score}/100</p>
                      </div>
                      <div className="h-2 w-full rounded-full bg-white/10">
                        <div
                          className={`h-2 rounded-full ${barColor(pct)}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {s.evidence && (
                        <p className="text-sm text-white/55">{s.evidence}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
            <div className="flex flex-col gap-4">
              {feedback.categoryScores?.map((c, i) => {
                const pct = Math.max(0, Math.min(100, c.score));
                return (
                  <div key={i} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{c.name}</p>
                      <p className="text-sm text-white/60">{c.score}/100</p>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/10">
                      <div
                        className={`h-2 rounded-full ${
                          pct >= 75
                            ? "bg-green-500"
                            : pct >= 50
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-sm text-white/60">{c.comment}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-3">Strengths</h3>
              <div className="flex flex-wrap gap-2">
                {feedback.strengths?.map((s, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-green-500/15 text-green-300 text-sm"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-3">Areas for Improvement</h3>
              <div className="flex flex-wrap gap-2">
                {feedback.areasForImprovement?.map((s, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-red-500/15 text-red-300 text-sm"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-3">Transcript</h3>
        {(session.transcript?.length ?? 0) === 0 ? (
          <p className="text-white/50 text-sm italic">No transcript recorded.</p>
        ) : (
          <div className="flex flex-col gap-3 text-sm max-h-[480px] overflow-y-auto">
            {session.transcript.map((t, i) => (
              <div key={i} className="flex flex-col">
                <span className="text-xs text-white/40">
                  {t.role} · {new Date(t.ts).toLocaleTimeString()}
                </span>
                <p
                  className={
                    t.role === "agent"
                      ? "text-indigo-200"
                      : t.role === "recruiter"
                      ? "text-amber-200"
                      : "text-white"
                  }
                >
                  {t.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
