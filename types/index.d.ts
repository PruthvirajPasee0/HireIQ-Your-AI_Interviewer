interface Feedback {
  id: string;
  interviewId: string;
  totalScore: number;
  categoryScores: Array<{
    name: string;
    score: number;
    comment: string;
  }>;
  strengths: string[];
  areasForImprovement: string[];
  finalAssessment: string;
  createdAt: string;
}

interface Interview {
  id: string;
  role: string;
  level: string;
  questions: string[];
  techstack: string[];
  createdAt: string;
  userId: string;
  type: string;
  finalized: boolean;
}

interface CreateFeedbackParams {
  interviewId: string;
  userId: string;
  transcript: { role: string; content: string }[];
  feedbackId?: string;
}

interface User {
  name: string;
  email: string;
  profileURL?: string;
  id: string;
  role?: "recruiter" | "candidate";
}

// Deepgram aura-2 voice models — keep the full model id so it can be passed
// directly to the Deepgram /v1/speak endpoint by the worker.
type DeepgramVoice =
  | "aura-2-odysseus-en"
  | "aura-2-thalia-en"
  | "aura-2-andromeda-en"
  | "aura-2-helena-en"
  | "aura-2-asteria-en"
  | "aura-2-luna-en"
  | "aura-2-orion-en"
  | "aura-2-zeus-en";

interface Agent {
  id: string;
  ownerRecruiterId: string;
  name: string;
  persona: string;
  voiceProfile: DeepgramVoice;
  questionBank: string[];
  targetRole: string;
  level: string;
  techstack: string[];
  createdAt: string;
}

interface CustomInjection {
  id: string;
  text: string;
  injectedAt: string;
  consumed: boolean;
}

interface ControlAction {
  id: string;
  type: "skip_question" | "end_session" | "repeat_question";
  issuedAt: string;
  consumed: boolean;
}

interface TranscriptTurn {
  role: "agent" | "candidate" | "recruiter";
  content: string;
  ts: string;
}

type InterviewSessionStatus =
  | "scheduled"
  | "bot_dispatching"
  | "bot_joined"
  | "in_progress"
  | "ended"
  | "failed";

interface InterviewSession {
  id: string;
  agentId: string;
  recruiterId: string;
  candidateName: string;
  candidateEmail: string;
  meetLink: string;
  scheduledAt: string;
  status: InterviewSessionStatus;
  botProvider?: "attendee" | "vexa";
  attendeeBotId?: string;
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
   * Per-session question bank. If non-empty, the worker uses these instead
   * of the agent's reusable questionBank. Populated by AI question generation
   * from the candidate's resume.
   */
  questions?: string[];
  /** Candidate's resume text (extracted by Gemini from the uploaded PDF). */
  resumeText?: string;
  resumeFileName?: string;
  createdAt: string;
  endedAt?: string;
}

interface CreateAgentParams {
  ownerRecruiterId: string;
  name: string;
  persona: string;
  voiceProfile: DeepgramVoice;
  questionBank: string[];
  targetRole: string;
  level: string;
  techstack: string[];
}

interface UpdateAgentParams extends Partial<CreateAgentParams> {
  id: string;
}

interface CreateInterviewSessionParams {
  agentId: string;
  recruiterId: string;
  candidateName: string;
  candidateEmail: string;
  meetLink: string;
  scheduledAt: string;
  questions?: string[];
  resumeText?: string;
  resumeFileName?: string;
  botProvider?: "attendee" | "vexa";
}

interface InterviewCardProps {
  interviewId?: string;
  userId?: string;
  role: string;
  type: string;
  techstack: string[];
  createdAt?: string;
}

interface AgentProps {
  userName: string;
  userId?: string;
  interviewId?: string;
  feedbackId?: string;
  type: "generate" | "interview";
  questions?: string[];
}

interface RouteParams {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}

interface GetFeedbackByInterviewIdParams {
  interviewId: string;
  userId: string;
}

interface GetLatestInterviewsParams {
  userId: string;
  limit?: number;
}

interface SignInParams {
  email: string;
  idToken: string;
  /**
   * Only used when the Firestore user doc DOES NOT EXIST yet (e.g. first
   * Google sign-in). Lets the auth screen propagate the role chosen on the
   * Candidate/Recruiter toggle. Ignored for existing users — their stored
   * role is the source of truth.
   */
  role?: "recruiter" | "candidate";
}

interface SignUpParams {
  uid: string;
  name: string;
  email: string;
  password: string;
  role?: "recruiter" | "candidate";
}

type FormType = "sign-in" | "sign-up";

interface InterviewFormProps {
  interviewId: string;
  role: string;
  level: string;
  type: string;
  techstack: string[];
  amount: number;
}

interface TechIconProps {
  techStack: string[];
  className?: string;
}
