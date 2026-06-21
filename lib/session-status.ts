const SESSION_STATUS_META: Record<
  InterviewSessionStatus,
  {
    label: string;
    description: string;
    tone: "neutral" | "info" | "success" | "danger";
  }
> = {
  scheduled: {
    label: "Scheduled",
    description: "Waiting for the dispatch window.",
    tone: "neutral",
  },
  bot_dispatching: {
    label: "Dispatching bot",
    description: "Connecting the AI interviewer to Google Meet.",
    tone: "info",
  },
  bot_joined: {
    label: "Bot joined",
    description: "Bot is in the call and preparing to start.",
    tone: "info",
  },
  in_progress: {
    label: "Interview live",
    description: "Interview is currently running.",
    tone: "success",
  },
  ended: {
    label: "Interview ended",
    description: "Session finished successfully.",
    tone: "success",
  },
  failed: {
    label: "Dispatch failed",
    description: "Bot failed to join. Retry dispatch from live controls.",
    tone: "danger",
  },
};

export function getSessionStatusMeta(status: InterviewSessionStatus) {
  return SESSION_STATUS_META[status];
}

export function getSessionStatusBadgeClass(status: InterviewSessionStatus) {
  const tone = getSessionStatusMeta(status).tone;

  if (tone === "success") {
    return "bg-green-500/20 text-green-300 border border-green-500/30";
  }

  if (tone === "danger") {
    return "bg-red-500/20 text-red-300 border border-red-500/30";
  }

  if (tone === "info") {
    return "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30";
  }

  return "bg-white/10 text-white/85 border border-white/15";
}
