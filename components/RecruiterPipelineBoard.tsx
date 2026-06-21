"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setSessionReviewStatus } from "@/lib/actions/sessions.action";
import {
  getSessionStatusBadgeClass,
  getSessionStatusMeta,
} from "@/lib/session-status";

type ReviewStatus = "new" | "reviewed" | "shortlisted" | "rejected";

type Props = {
  sessions: InterviewSession[];
};

const REVIEW_STATUSES: ReviewStatus[] = [
  "new",
  "reviewed",
  "shortlisted",
  "rejected",
];

const REVIEW_LABELS: Record<ReviewStatus, string> = {
  new: "New",
  reviewed: "Reviewed",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
};

export default function RecruiterPipelineBoard({ sessions }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<ReviewStatus | "all">("all");

  const sessionsWithDefaults = useMemo(
    () =>
      sessions.map((session) => ({
        ...session,
        reviewStatus: session.reviewStatus ?? "new",
      })),
    [sessions]
  );

  const filtered = useMemo(() => {
    if (filter === "all") return sessionsWithDefaults;
    return sessionsWithDefaults.filter((s) => s.reviewStatus === filter);
  }, [filter, sessionsWithDefaults]);

  const counts = useMemo(() => {
    const map: Record<ReviewStatus, number> = {
      new: 0,
      reviewed: 0,
      shortlisted: 0,
      rejected: 0,
    };
    for (const session of sessionsWithDefaults) {
      map[session.reviewStatus] += 1;
    }
    return map;
  }, [sessionsWithDefaults]);

  const updateStatus = (sessionId: string, reviewStatus: ReviewStatus) => {
    startTransition(async () => {
      const res = await setSessionReviewStatus(sessionId, reviewStatus);
      if (!res.success) {
        toast.error(res.message ?? "Failed to update status");
        return;
      }
      toast.success(`Marked as ${REVIEW_LABELS[reviewStatus]}`);
      router.refresh();
    });
  };

  return (
    <section className="flex flex-col gap-4 mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2>Hiring Pipeline</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "secondary"}
            onClick={() => setFilter("all")}
          >
            All ({sessionsWithDefaults.length})
          </Button>
          {REVIEW_STATUSES.map((status) => (
            <Button
              key={status}
              size="sm"
              variant={filter === status ? "default" : "secondary"}
              onClick={() => setFilter(status)}
            >
              {REVIEW_LABELS[status]} ({counts[status]})
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-white/70">No sessions in this view.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((session) => {
            const statusMeta = getSessionStatusMeta(session.status);
            const statusBadgeClass = getSessionStatusBadgeClass(session.status);
            const nextHref =
              session.status === "ended"
                ? `/recruiter/sessions/${session.id}/feedback`
                : `/recruiter/sessions/${session.id}/live`;

            return (
              <div
                key={session.id}
                className="glass-card p-4 rounded-xl border border-white/10 bg-white/[0.06]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{session.candidateName}</p>
                    <p className="text-xs text-white/60 truncate">
                      {session.candidateEmail}
                    </p>
                    <p className="text-xs text-white/45 mt-1">
                      {new Date(session.scheduledAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded shrink-0 ${statusBadgeClass}`}
                  >
                    {statusMeta.label}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {REVIEW_STATUSES.map((status) => (
                    <Button
                      key={`${session.id}-${status}`}
                      size="sm"
                      variant={
                        session.reviewStatus === status ? "default" : "secondary"
                      }
                      onClick={() => updateStatus(session.id, status)}
                      disabled={isPending}
                    >
                      {REVIEW_LABELS[status]}
                    </Button>
                  ))}
                </div>

                <div className="mt-3">
                  <Button asChild className="btn-primary w-full">
                    <Link href={nextHref} prefetch>
                      Open {session.status === "ended" ? "feedback" : "live session"}
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
