"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setSessionRecordingLiked } from "@/lib/actions/sessions.action";

type Props = {
  sessionId: string;
  recordingStatus?: InterviewSession["recordingStatus"];
  recordingDownloadUrl?: string;
  recordingAvailableUntil?: string;
  recordingLiked?: boolean;
};

export default function SessionRecordingControls({
  sessionId,
  recordingStatus,
  recordingDownloadUrl,
  recordingAvailableUntil,
  recordingLiked = false,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [liked, setLiked] = useState(recordingLiked);
  const isExpired = useMemo(() => {
    if (!recordingAvailableUntil) return false;
    return Date.parse(recordingAvailableUntil) <= Date.now();
  }, [recordingAvailableUntil]);

  const canDownload =
    recordingStatus === "available" &&
    !!recordingDownloadUrl &&
    !isExpired;

  const toggleLiked = () => {
    const next = !liked;
    startTransition(async () => {
      const res = await setSessionRecordingLiked(sessionId, next);
      if (!res.success) {
        toast.error(res.message ?? "Failed to update recording preference");
        return;
      }
      setLiked(next);
      toast.success(next ? "Recording saved" : "Recording unsaved");
    });
  };

  return (
    <div className="glass-card p-4 rounded-xl border border-white/10 bg-white/[0.06]">
      <h3 className="text-sm font-medium">Interview Recording</h3>

      {canDownload ? (
        <>
          <p className="text-xs text-white/60 mt-2">
            Recording available until{" "}
            {recordingAvailableUntil
              ? new Date(recordingAvailableUntil).toLocaleString()
              : "expiry window ends"}.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild className="btn-primary">
              <a href={recordingDownloadUrl} target="_blank" rel="noreferrer">
                Download recording
              </a>
            </Button>
            <Button
              className="btn-secondary"
              onClick={toggleLiked}
              disabled={isPending}
            >
              {liked ? "Saved by recruiter" : "Save recording"}
            </Button>
          </div>
        </>
      ) : recordingStatus === "pending" ? (
        <p className="text-xs text-white/60 mt-2">
          Recording is still processing. Refresh in a minute.
        </p>
      ) : recordingStatus === "expired" || isExpired ? (
        <p className="text-xs text-white/60 mt-2">
          Recording expired after 2 days and was removed automatically.
        </p>
      ) : (
        <p className="text-xs text-white/60 mt-2">
          Recording is unavailable for this session.
        </p>
      )}
    </div>
  );
}
