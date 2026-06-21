export type InterviewSessionStatus =
  | "scheduled"
  | "bot_dispatching"
  | "bot_joined"
  | "in_progress"
  | "ended"
  | "failed";

export interface CustomInjection {
  id: string;
  text: string;
  injectedAt: string;
  consumed: boolean;
}

export interface ControlAction {
  id: string;
  type: "skip_question" | "end_session" | "repeat_question";
  issuedAt: string;
  consumed: boolean;
}

export interface TranscriptTurn {
  role: "agent" | "candidate" | "recruiter";
  content: string;
  ts: string;
}

export interface InterviewSession {
  id: string;
  agentId: string;
  recruiterId: string;
  candidateName: string;
  candidateEmail: string;
  meetLink: string;
  scheduledAt: string;
  status: InterviewSessionStatus;
  /** Which provider was used to launch the bot. Set when worker dispatches. */
  botProvider?: "attendee" | "vexa";
  attendeeBotId?: string;
  /** "cloud" = app.attendee.dev, "selfhost" = local Docker (set by fallback). */
  attendeeEndpoint?: "cloud" | "selfhost";
  vexaNativeMeetingId?: string;
  vexaNumericId?: number;
  workerHeartbeatAt?: string;
  currentQuestionIndex: number;
  customInjections: CustomInjection[];
  controlActions: ControlAction[];
  transcript: TranscriptTurn[];
  feedbackId?: string;
  failureReason?: string;
  /**
   * Interview recording lifecycle:
   * - pending: still processing / not captured yet
   * - available: downloadable now
   * - expired: auto-removed after retention window
   * - unavailable: provider did not supply recording
   */
  recordingStatus?: "pending" | "available" | "expired" | "unavailable";
  recordingDownloadUrl?: string;
  recordingCapturedAt?: string;
  recordingAvailableUntil?: string;
  recordingLiked?: boolean;
  reviewStatus?: "new" | "reviewed" | "shortlisted" | "rejected";
  reviewedAt?: string;
  /** Per-session questions (set by AI from candidate resume). Overrides agent.questionBank. */
  questions?: string[];
  /** AI-generated 1-2 sentence summary of the candidate's resume. */
  resumeText?: string;
  resumeFileName?: string;
  createdAt: string;
  endedAt?: string;
}

export interface Agent {
  id: string;
  ownerRecruiterId: string;
  name: string;
  persona: string;
  voiceProfile: string;
  questionBank: string[];
  targetRole: string;
  level: string;
  techstack: string[];
  createdAt: string;
}

export interface AttendeeBot {
  id: string;
  meeting_url: string;
  state: string;
  transcription_state: string;
}

export interface AttendeeTranscriptEntry {
  speaker_name: string;
  speaker_uuid: string;
  speaker_user_uuid?: string | null;
  speaker_is_host?: boolean;
  timestamp_ms: number;
  duration_ms: number;
  /**
   * Attendee returns this as a JSON object (Deepgram-style):
   *   { transcript: "the text", words?: [...], ... }
   * NOT a bare string, despite what some docs imply.
   */
  transcription: { transcript?: string } & Record<string, unknown>;
}
