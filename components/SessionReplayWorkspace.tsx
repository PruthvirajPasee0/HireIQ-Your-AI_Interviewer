"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CategoryScore = {
  name: string;
  score: number;
  comment: string;
};

type TranscriptRole = "agent" | "candidate" | "recruiter";

type TranscriptEntry = {
  role: TranscriptRole;
  content: string;
  ts: string;
};

type Props = {
  transcript: TranscriptEntry[];
  categoryScores: CategoryScore[];
  recordingStatus?: InterviewSession["recordingStatus"];
  recordingDownloadUrl?: string;
};

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "have",
  "has",
  "was",
  "were",
  "are",
  "you",
  "your",
  "they",
  "them",
  "their",
  "into",
  "about",
  "very",
  "well",
  "good",
  "more",
  "less",
  "than",
]);

function tokenize(input: string) {
  return input
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

export default function SessionReplayWorkspace({
  transcript,
  categoryScores,
  recordingStatus,
  recordingDownloadUrl,
}: Props) {
  const transcriptRefs = useRef<Array<HTMLDivElement | null>>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [activeTurn, setActiveTurn] = useState<number | null>(null);

  const turnTimes = useMemo(() => {
    if (transcript.length === 0) return [] as number[];
    const firstTs = Date.parse(transcript[0].ts);
    return transcript.map((turn) => {
      const currentTs = Date.parse(turn.ts);
      if (!Number.isFinite(firstTs) || !Number.isFinite(currentTs)) return 0;
      return Math.max(0, Math.floor((currentTs - firstTs) / 1000));
    });
  }, [transcript]);

  const evidenceTurnByCategory = useMemo(() => {
    if (transcript.length === 0) return {} as Record<string, number>;

    const transcriptTokens = transcript.map((turn) =>
      new Set(tokenize(turn.content))
    );

    const mapping: Record<string, number> = {};

    for (const category of categoryScores) {
      const categoryTokens = tokenize(`${category.name} ${category.comment}`);
      let bestIndex = 0;
      let bestScore = -1;

      transcriptTokens.forEach((tokenSet, idx) => {
        let overlap = 0;
        for (const token of categoryTokens) {
          if (tokenSet.has(token)) overlap += 1;
        }

        // Small tie-breaker: prefer candidate turns as evidence.
        const roleBonus = transcript[idx].role === "candidate" ? 0.25 : 0;
        const totalScore = overlap + roleBonus;

        if (totalScore > bestScore) {
          bestScore = totalScore;
          bestIndex = idx;
        }
      });

      mapping[category.name] = bestIndex;
    }

    return mapping;
  }, [categoryScores, transcript]);

  const jumpToTurn = (index: number) => {
    const bounded = Math.max(0, Math.min(index, transcript.length - 1));
    const targetEl = transcriptRefs.current[bounded];
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    const player = videoRef.current;
    const targetSecond = turnTimes[bounded] ?? 0;
    if (
      player &&
      Number.isFinite(targetSecond) &&
      player.readyState >= 1 &&
      !Number.isNaN(player.duration)
    ) {
      player.currentTime = Math.max(0, Math.min(targetSecond, player.duration));
    }

    setActiveTurn(bounded);
  };

  const canReplay = recordingStatus === "available" && !!recordingDownloadUrl;

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-3">Replay Workspace</h3>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-white/55 mb-2">Recording</p>
          {canReplay ? (
            <video
              ref={videoRef}
              controls
              className="w-full rounded-lg border border-white/10 bg-black/40"
              src={recordingDownloadUrl}
              preload="metadata"
            />
          ) : (
            <p className="text-sm text-white/60">
              Recording is not available yet. Transcript replay still works.
            </p>
          )}

          {categoryScores.length > 0 && transcript.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-white/55 mb-2">
                Score to evidence links
              </p>
              <div className="flex flex-wrap gap-2">
                {categoryScores.map((category) => (
                  <Button
                    key={category.name}
                    size="sm"
                    variant="secondary"
                    className="h-8"
                    onClick={() =>
                      jumpToTurn(evidenceTurnByCategory[category.name] ?? 0)
                    }
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-white/55 mb-2">Transcript timeline</p>
          {transcript.length === 0 ? (
            <p className="text-sm text-white/60">No transcript recorded.</p>
          ) : (
            <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1">
              {transcript.map((turn, idx) => (
                <div
                  key={`${turn.ts}-${idx}`}
                  ref={(el) => {
                    transcriptRefs.current[idx] = el;
                  }}
                  className={cn(
                    "rounded-lg border px-3 py-2 transition-colors",
                    activeTurn === idx
                      ? "border-primary-200/70 bg-primary-200/10"
                      : "border-white/10 bg-white/[0.02]"
                  )}
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-white/50">
                    <span className="uppercase tracking-wide">{turn.role}</span>
                    <button
                      type="button"
                      className="text-primary-100 hover:text-primary-200"
                      onClick={() => jumpToTurn(idx)}
                    >
                      {turnTimes[idx] != null ? `@ ${turnTimes[idx]}s` : "Jump"}
                    </button>
                  </div>
                  <p
                    className={cn(
                      "mt-1 text-sm",
                      turn.role === "agent"
                        ? "text-indigo-200"
                        : turn.role === "recruiter"
                        ? "text-amber-200"
                        : "text-white"
                    )}
                  >
                    {turn.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
