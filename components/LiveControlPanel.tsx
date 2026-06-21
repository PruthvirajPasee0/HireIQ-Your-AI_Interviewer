"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  appendCustomInjection,
  appendControlAction,
  dispatchSessionNow,
  getSessionForRecruiter,
} from "@/lib/actions/sessions.action";
import {
  getSessionStatusBadgeClass,
  getSessionStatusMeta,
} from "@/lib/session-status";

const inputCls =
  "input w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-transparent transition-all duration-200";

type Props = {
  initial: InterviewSession;
  agentName: string;
};

export default function LiveControlPanel({ initial, agentName }: Props) {
  const router = useRouter();
  const [session, setSession] = useState<InterviewSession>(initial);
  const [customQ, setCustomQ] = useState("");
  const [isPending, startTransition] = useTransition();
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let stop = false;
    const tick = async () => {
      try {
        const fresh = await getSessionForRecruiter(initial.id);
        if (!stop && fresh) setSession(fresh);
      } catch {}
    };
    const interval = setInterval(tick, 2000);
    return () => {
      stop = true;
      clearInterval(interval);
    };
  }, [initial.id]);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [session.transcript?.length]);

  const handleInject = () => {
    if (!customQ.trim()) return;
    startTransition(async () => {
      const res = await appendCustomInjection(session.id, customQ);
      if (!res.success) {
        toast.error(res.message ?? "Failed");
        return;
      }
      toast.success("Question queued");
      setCustomQ("");
    });
  };

  const handleControl = (type: ControlAction["type"]) => {
    startTransition(async () => {
      const res = await appendControlAction(session.id, type);
      if (!res.success) {
        toast.error(res.message ?? "Failed");
        return;
      }
      toast.success(
        type === "skip_question"
          ? "Skip queued"
          : type === "repeat_question"
          ? "Repeat queued"
          : "Session ended"
      );
      if (type === "end_session") {
        router.push(`/recruiter/sessions/${session.id}/feedback`);
        router.refresh();
      }
    });
  };

  const handleDispatch = () => {
    startTransition(async () => {
      const res = await dispatchSessionNow(session.id);
      if (!res.success) {
        toast.error(res.message ?? "Failed");
        return;
      }
      toast.success("Bot dispatching to Meet...");
    });
  };

  const isActive =
    session.status === "in_progress" || session.status === "bot_joined";
  const isEnded = session.status === "ended" || session.status === "failed";
  const statusMeta = getSessionStatusMeta(session.status);
  const statusBadgeClass = getSessionStatusBadgeClass(session.status);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 flex flex-col gap-4">
        <section className="glass-card p-4 rounded-xl border border-white/10 bg-white/[0.06]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/50">Candidate</p>
              <p className="font-medium">
                {session.candidateName}{" "}
                <span className="text-white/50 text-sm">
                  ({session.candidateEmail})
                </span>
              </p>
            </div>
            <span className={`text-xs px-2 py-1 rounded ${statusBadgeClass}`}>
              {statusMeta.label}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 text-xs text-white/60">
            <span>Agent: {agentName}</span>
            <span>
              Q {session.currentQuestionIndex + 1} of bank
            </span>
            <span>{statusMeta.description}</span>
            <span>
              Recording:{" "}
              {session.recordingStatus === "available"
                ? "available"
                : session.recordingStatus === "expired"
                ? "expired"
                : session.recordingStatus === "unavailable"
                ? "unavailable"
                : "processing"}
            </span>
            <a
              href={session.meetLink}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-300 hover:text-indigo-200"
            >
              Open Meet ↗
            </a>
          </div>
        </section>

        <section className="glass-card p-4 rounded-xl border border-white/10 bg-white/[0.06] flex-1">
          <p className="text-xs text-white/50 mb-2">Live transcript</p>
          <div
            ref={transcriptRef}
            className="h-[420px] overflow-y-auto pr-2 space-y-3 text-sm"
          >
            {(session.transcript?.length ?? 0) === 0 ? (
              <p className="text-white/40 italic">
                Waiting for the interview to start...
              </p>
            ) : (
              session.transcript.map((t, i) => (
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
              ))
            )}
          </div>
        </section>
      </div>

      <aside className="flex flex-col gap-4">
        <section className="glass-card p-4 rounded-xl border border-white/10 bg-white/[0.06]">
          <p className="text-sm font-medium mb-3">Controls</p>
          {(session.status === "scheduled" || session.status === "failed") && (
            <Button
              className="btn-primary w-full"
              onClick={handleDispatch}
              disabled={isPending}
            >
              {session.status === "failed"
                ? "Retry — dispatch AI bot again"
                : "Dispatch AI bot now"}
            </Button>
          )}
          {session.status === "failed" && session.failureReason && (
            <p className="text-xs text-red-300 mt-2 break-words">
              Last failure: {session.failureReason.slice(0, 180)}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Button
              variant="secondary"
              onClick={() => handleControl("skip_question")}
              disabled={isPending || !isActive}
            >
              Skip question
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleControl("repeat_question")}
              disabled={isPending || !isActive}
            >
              Repeat
            </Button>
          </div>
          <Button
            variant="destructive"
            className="w-full mt-2"
            onClick={() => handleControl("end_session")}
            disabled={isPending || isEnded}
          >
            End interview
          </Button>
        </section>

        <section className="glass-card p-4 rounded-xl border border-white/10 bg-white/[0.06]">
          <p className="text-sm font-medium mb-2">Ask custom question</p>
          <p className="text-xs text-white/50 mb-2">
            The AI will ask this next, then resume the question bank.
          </p>
          <textarea
            className={`${inputCls} min-h-[80px] text-sm`}
            value={customQ}
            onChange={(e) => setCustomQ(e.target.value)}
            placeholder="e.g. What's your strongest technical achievement?"
            disabled={!isActive}
          />
          <Button
            className="btn-primary w-full mt-2"
            onClick={handleInject}
            disabled={isPending || !isActive || !customQ.trim()}
          >
            Queue question
          </Button>
        </section>

        {(session.customInjections?.length ?? 0) > 0 && (
          <section className="glass-card p-4 rounded-xl border border-white/10 bg-white/[0.06]">
            <p className="text-sm font-medium mb-2">Queued questions</p>
            <ul className="text-xs space-y-2">
              {session.customInjections.map((inj) => (
                <li
                  key={inj.id}
                  className="flex items-start gap-2 text-white/70"
                >
                  <span
                    className={
                      inj.consumed
                        ? "text-green-400"
                        : "text-amber-300 animate-pulse"
                    }
                  >
                    {inj.consumed ? "✓" : "•"}
                  </span>
                  <span className={inj.consumed ? "line-through" : ""}>
                    {inj.text}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </aside>
    </div>
  );
}
