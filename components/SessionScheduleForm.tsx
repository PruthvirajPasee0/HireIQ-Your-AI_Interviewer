"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createInterviewSession } from "@/lib/actions/sessions.action";

const inputCls =
  "input w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-transparent transition-all duration-200";
const labelCls = "label text-white font-medium tracking-wide block mb-2";

type AgentOption = Pick<Agent, "id" | "name" | "targetRole" | "level">;

type Props = {
  recruiterId: string;
  agents: AgentOption[];
};

function defaultLocalDatetime(): string {
  const d = new Date(Date.now() + 5 * 60 * 1000);
  const tz = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tz * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export default function SessionScheduleForm({ recruiterId, agents }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isGenerating, setIsGenerating] = useState(false);
  // Guard against duplicate submits before React flushes isPending — a real
  // double-click otherwise races past the disabled attribute.
  const submittingRef = useRef(false);

  const [agentId, setAgentId] = useState(agents[0]?.id ?? "");
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [meetLink, setMeetLink] = useState("");
  const [scheduledAtLocal, setScheduledAtLocal] = useState(defaultLocalDatetime());

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [questionCount, setQuestionCount] = useState(8);
  const [resumeSummary, setResumeSummary] = useState<string | null>(null);
  const [questionsText, setQuestionsText] = useState("");

  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!agentId) {
      toast.error("Select an agent first");
      return;
    }
    if (!resumeFile) {
      toast.error("Upload a PDF resume first");
      return;
    }
    if (!candidateName.trim()) {
      toast.error("Add the candidate's name");
      return;
    }
    setIsGenerating(true);
    try {
      const fd = new FormData();
      fd.set("resume", resumeFile);
      fd.set("agentId", agentId);
      fd.set("candidateName", candidateName);
      fd.set("count", String(questionCount));

      const res = await fetch("/api/sessions/generate-questions", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error ?? "Generation failed");
        return;
      }
      setResumeSummary(data.resumeSummary ?? null);
      setQuestionsText((data.questions as string[]).join("\n"));
      toast.success(`Generated ${data.questions.length} questions`);
    } catch (err) {
      toast.error(String(err));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    // Already submitting or already done → ignore extra clicks
    if (submittingRef.current || inviteUrl) return;
    if (!agentId) {
      toast.error("Select an agent");
      return;
    }
    if (!candidateName.trim() || !candidateEmail.trim()) {
      toast.error("Candidate name and email required");
      return;
    }
    if (!meetLink.trim().startsWith("https://meet.google.com/")) {
      toast.error("Paste a valid https://meet.google.com/ link");
      return;
    }
    const questions = questionsText
      .split("\n")
      .map((q) => q.trim())
      .filter(Boolean);

    const scheduledAt = new Date(scheduledAtLocal).toISOString();

    submittingRef.current = true;
    startTransition(async () => {
      try {
        const res = await createInterviewSession({
          agentId,
          recruiterId,
          candidateName,
          candidateEmail,
          meetLink,
          scheduledAt,
          questions: questions.length > 0 ? questions : undefined,
          resumeText: resumeSummary ?? undefined,
          resumeFileName: resumeFile?.name,
        });
        if (!res.success) {
          toast.error(res.message);
          submittingRef.current = false;
          return;
        }
        const url = `${window.location.origin}/join/${res.inviteToken}`;
        setInviteUrl(url);
        toast.success(
          res.emailSent
            ? "Interview scheduled — invite emailed to candidate"
            : "Interview scheduled",
        );
        router.refresh();
      } catch (err) {
        toast.error(String(err));
        submittingRef.current = false;
      }
    });
  };

  if (agents.length === 0) {
    return (
      <div className="glass-card p-6 rounded-xl border border-white/10 bg-white/[0.06]">
        <p>You need to create an AI Interviewer Agent first.</p>
        <Button asChild className="btn-primary mt-4">
          <Link href="/recruiter/agents/new" prefetch>
            Create Agent
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSchedule} className="flex flex-col gap-5 max-w-2xl">
      <div>
        <label className={labelCls}>Pick AI agent</label>
        <select
          className={inputCls}
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
        >
          {agents.map((a) => (
            <option key={a.id} value={a.id} className="bg-zinc-900">
              {a.name} — {a.targetRole} ({a.level})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Candidate name</label>
          <input
            className={inputCls}
            value={candidateName}
            onChange={(e) => setCandidateName(e.target.value)}
            placeholder="Jane Doe"
          />
        </div>
        <div>
          <label className={labelCls}>Candidate email</label>
          <input
            className={inputCls}
            type="email"
            value={candidateEmail}
            onChange={(e) => setCandidateEmail(e.target.value)}
            placeholder="jane@example.com"
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Google Meet link</label>
        <input
          className={inputCls}
          value={meetLink}
          onChange={(e) => setMeetLink(e.target.value)}
          placeholder="https://meet.google.com/abc-defg-hij"
        />
        <p className="text-xs text-white/50 mt-1">
          Create a Meet in Google Calendar, then paste the link here.
        </p>
      </div>

      <div>
        <label className={labelCls}>Scheduled time</label>
        <input
          className={inputCls}
          type="datetime-local"
          value={scheduledAtLocal}
          onChange={(e) => setScheduledAtLocal(e.target.value)}
        />
        <p className="text-xs text-white/50 mt-1">
          The AI bot is dispatched automatically ~30s before this time. You
          can also start it manually from the Live panel.
        </p>
      </div>

      {/* Resume + AI question generation block */}
      <div className="glass-card p-4 rounded-xl border border-white/10 bg-white/[0.04]">
        <p className="text-sm font-medium mb-1">
          Tailor questions to the candidate&apos;s resume
        </p>
        <p className="text-xs text-white/60 mb-3">
          Upload the candidate&apos;s PDF resume — Gemini will read it and generate
          questions that reference their actual projects, skills, and experience.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
          <div>
            <label className={labelCls}>Resume (PDF)</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-white file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
            />
            {resumeFile && (
              <p className="text-xs text-white/50 mt-1">
                {resumeFile.name} · {(resumeFile.size / 1024).toFixed(0)} KB
              </p>
            )}
          </div>
          <div>
            <label className={labelCls}># of questions</label>
            <input
              className={`${inputCls} w-24`}
              type="number"
              min={1}
              max={20}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value) || 1)}
            />
          </div>
        </div>

        <Button
          type="button"
          className="btn-primary w-full mt-3"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating
            ? "Reading resume + generating..."
            : "Generate questions from resume"}
        </Button>

        {resumeSummary && (
          <div className="mt-3 p-3 rounded-lg bg-white/[0.04] border border-white/10">
            <p className="text-xs text-white/50 mb-1">Resume summary</p>
            <p className="text-sm text-white/85">{resumeSummary}</p>
          </div>
        )}

        {questionsText && (
          <div className="mt-3">
            <label className={labelCls}>
              Generated questions (edit before scheduling — one per line)
            </label>
            <textarea
              className={`${inputCls} min-h-[220px] font-mono text-sm`}
              value={questionsText}
              onChange={(e) => setQuestionsText(e.target.value)}
            />
            <p className="text-xs text-white/50 mt-1">
              These override the agent&apos;s default question bank for this
              session only.
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          type="submit"
          className="btn-primary"
          disabled={isPending || !!inviteUrl}
        >
          {isPending
            ? "Scheduling..."
            : inviteUrl
            ? "Scheduled ✓"
            : "Schedule interview"}
        </Button>
        {inviteUrl && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              router.push("/recruiter");
              router.refresh();
            }}
          >
            Back to dashboard
          </Button>
        )}
      </div>

      {inviteUrl && (
        <div className="glass-card mt-4 p-4 rounded-xl border border-white/10 bg-white/[0.06]">
          <p className="text-sm font-medium mb-2">Candidate invite link</p>
          <div className="flex items-center gap-2">
            <input className={inputCls} value={inviteUrl} readOnly />
            <Button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(inviteUrl);
                toast.success("Copied");
              }}
            >
              Copy
            </Button>
          </div>
          <p className="text-xs text-white/50 mt-2">
            Send this link to the candidate. They&apos;ll see the meeting time and a
            button to open the Google Meet.
          </p>
        </div>
      )}
    </form>
  );
}
