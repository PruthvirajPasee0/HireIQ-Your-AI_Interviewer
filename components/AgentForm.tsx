"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Volume2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createAgent, updateAgent, deleteAgent } from "@/lib/actions/agents.action";
import { AGENT_TEMPLATES, type AgentTemplate } from "@/lib/agent-templates";

// Confirmed aura-2 voices (some aura-1 voices like perseus/stella don't have
// an aura-2 version yet — they 404 on /v1/speak).
const VOICE_OPTIONS: { id: DeepgramVoice; label: string }[] = [
  { id: "aura-2-odysseus-en", label: "Odysseus (male, warm)" },
  { id: "aura-2-zeus-en", label: "Zeus (male, deep)" },
  { id: "aura-2-orion-en", label: "Orion (male, neutral)" },
  { id: "aura-2-thalia-en", label: "Thalia (female, bright)" },
  { id: "aura-2-andromeda-en", label: "Andromeda (female, calm)" },
  { id: "aura-2-helena-en", label: "Helena (female, professional)" },
  { id: "aura-2-asteria-en", label: "Asteria (female, conversational)" },
  { id: "aura-2-luna-en", label: "Luna (female, soft)" },
];

const inputCls =
  "input w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200";

const labelCls = "label text-white font-medium tracking-wide block mb-2";

type Props = {
  mode: "create" | "edit";
  recruiterId: string;
  agent?: Agent;
};

export default function AgentForm({ mode, recruiterId, agent }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(agent?.name ?? "");
  const [targetRole, setTargetRole] = useState(agent?.targetRole ?? "");
  const [level, setLevel] = useState(agent?.level ?? "Mid");
  const [persona, setPersona] = useState(
    agent?.persona ??
      "You are a friendly but rigorous senior engineer conducting a screen. Probe gently when answers are shallow. Keep your tone warm."
  );
  const [voiceProfile, setVoiceProfile] = useState<DeepgramVoice>(
    agent?.voiceProfile ?? "aura-2-odysseus-en"
  );
  const [techstackText, setTechstackText] = useState(
    (agent?.techstack ?? []).join(", ")
  );
  const [questionsText, setQuestionsText] = useState(
    (agent?.questionBank ?? []).join("\n")
  );
  const [jobDescription, setJobDescription] = useState(
    agent?.jobDescription ?? ""
  );
  const [rubric, setRubric] = useState<RubricItem[]>(agent?.rubric ?? []);
  const [generatingJd, setGeneratingJd] = useState(false);

  const generateFromJd = async () => {
    if (jobDescription.trim().length < 30) {
      toast.error("Paste a fuller job description first");
      return;
    }
    setGeneratingJd(true);
    try {
      const res = await fetch("/api/agents/from-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed");
      if (data.name && !name.trim()) setName(data.name);
      if (data.targetRole) setTargetRole(data.targetRole);
      if (data.level) setLevel(data.level);
      if (Array.isArray(data.techstack))
        setTechstackText(data.techstack.join(", "));
      if (Array.isArray(data.questionBank) && data.questionBank.length)
        setQuestionsText(data.questionBank.join("\n"));
      if (Array.isArray(data.rubric))
        setRubric(
          data.rubric.map((r: RubricItem) => ({
            skill: String(r.skill ?? ""),
            weight: Number(r.weight) || 3,
            mustHave: Boolean(r.mustHave),
          })),
        );
      toast.success("Generated role, questions & rubric from the JD — review & tweak");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setGeneratingJd(false);
    }
  };

  const updateRubric = (i: number, patch: Partial<RubricItem>) =>
    setRubric((r) => r.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const addRubricRow = () =>
    setRubric((r) => [...r, { skill: "", weight: 3, mustHave: false }]);
  const removeRubricRow = (i: number) =>
    setRubric((r) => r.filter((_, idx) => idx !== i));

  // Voice preview
  const [previewingVoice, setPreviewingVoice] = useState<DeepgramVoice | null>(
    null,
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const previewVoice = async (voice: DeepgramVoice) => {
    if (previewingVoice) return;
    setPreviewingVoice(voice);
    try {
      const res = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `Hi, I'm your AI interviewer. Let's get started — tell me about yourself.`,
          voice,
        }),
      });
      if (!res.ok) throw new Error(`TTS failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setPreviewingVoice(null);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setPreviewingVoice(null);
        URL.revokeObjectURL(url);
        toast.error("Could not play preview");
      };
      await audio.play();
    } catch (err) {
      toast.error(String(err));
      setPreviewingVoice(null);
    }
  };

  const applyTemplate = (t: AgentTemplate) => {
    setName(t.name);
    setTargetRole(t.targetRole);
    setLevel(t.level);
    setPersona(t.persona);
    setVoiceProfile(t.voiceProfile);
    setTechstackText(t.techstack.join(", "));
    setQuestionsText(t.questionBank.join("\n"));
    toast.success(`Loaded "${t.name}" template — tweak and save`);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const questionBank = questionsText
      .split("\n")
      .map((q) => q.trim())
      .filter(Boolean);
    const techstack = techstackText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (!name.trim()) {
      toast.error("Agent name is required");
      return;
    }
    if (questionBank.length === 0) {
      toast.error("Add at least one question");
      return;
    }

    const cleanRubric = rubric
      .map((r) => ({
        skill: r.skill.trim(),
        weight: Math.max(1, Math.min(5, Math.round(r.weight) || 3)),
        mustHave: !!r.mustHave,
      }))
      .filter((r) => r.skill.length > 0);

    startTransition(async () => {
      try {
        if (mode === "create") {
          const res = await createAgent({
            ownerRecruiterId: recruiterId,
            name,
            persona,
            voiceProfile,
            questionBank,
            targetRole,
            level,
            techstack,
            jobDescription,
            rubric: cleanRubric,
          });
          if (!res.success) {
            toast.error(res.message ?? "Failed");
            return;
          }
          toast.success("Agent created");
          router.push(`/recruiter/agents/${res.agentId}`);
          router.refresh();
        } else if (agent) {
          const res = await updateAgent({
            id: agent.id,
            name,
            persona,
            voiceProfile,
            questionBank,
            targetRole,
            level,
            techstack,
            jobDescription,
            rubric: cleanRubric,
          });
          if (!res.success) {
            toast.error(res.message ?? "Failed");
            return;
          }
          toast.success("Agent updated");
          router.refresh();
        }
      } catch (err) {
        toast.error(String(err));
      }
    });
  };

  const onDelete = () => {
    if (!agent) return;
    if (!confirm(`Delete agent "${agent.name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const res = await deleteAgent(agent.id);
      if (!res.success) {
        toast.error(res.message ?? "Failed");
        return;
      }
      toast.success("Agent deleted");
      router.push("/recruiter");
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5 max-w-3xl">
      {mode === "create" && (
        <div className="glass-card p-4 rounded-xl border border-white/10 bg-white/[0.04]">
          <p className="text-sm font-medium mb-1">Start from a template</p>
          <p className="text-xs text-white/60 mb-3">
            Clone a ready-made agent and tweak — saves you writing a question
            bank from scratch.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {AGENT_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTemplate(t)}
                className="text-left rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/30 transition p-3 cursor-pointer"
              >
                <p className="text-sm font-medium text-white">{t.name}</p>
                <p className="text-xs text-white/55 mt-0.5">{t.summary}</p>
                <p className="text-[10px] text-white/40 mt-1">
                  {t.questionBank.length} questions · {t.level} · voice{" "}
                  {t.voiceProfile.replace("aura-2-", "").replace("-en", "")}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="glass-card p-4 rounded-xl border border-indigo-400/20 bg-indigo-500/[0.06]">
        <label className={labelCls}>Job description</label>
        <p className="text-xs text-white/60 mb-2">
          Paste the JD and we&apos;ll auto-fill the role, generate the question
          bank, and build a skills rubric the candidate is scored against.
        </p>
        <textarea
          className={`${inputCls} min-h-[140px]`}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the full job description here…"
        />
        <button
          type="button"
          onClick={generateFromJd}
          disabled={generatingJd}
          className="mt-3 h-11 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-2 disabled:opacity-50 transition"
        >
          {generatingJd ? "Generating…" : "Generate from JD"}
        </button>
      </div>

      <div>
        <label className={labelCls}>Agent name</label>
        <input
          className={inputCls}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Senior FE Engineer Screen"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Target role</label>
          <input
            className={inputCls}
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="Frontend Engineer"
          />
        </div>
        <div>
          <label className={labelCls}>Level</label>
          <select
            className={inputCls}
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          >
            {["Intern", "Junior", "Mid", "Senior", "Staff", "Principal"].map(
              (l) => (
                <option key={l} value={l} className="bg-zinc-900">
                  {l}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Tech stack (comma separated)</label>
        <input
          className={inputCls}
          value={techstackText}
          onChange={(e) => setTechstackText(e.target.value)}
          placeholder="React, TypeScript, Node.js"
        />
      </div>

      <div>
        <label className={labelCls}>Voice profile</label>
        <div className="flex gap-2">
          <select
            className={`${inputCls} flex-1`}
            value={voiceProfile}
            onChange={(e) => setVoiceProfile(e.target.value as DeepgramVoice)}
          >
            {VOICE_OPTIONS.map((v) => (
              <option key={v.id} value={v.id} className="bg-zinc-900">
                {v.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => previewVoice(voiceProfile)}
            disabled={previewingVoice !== null}
            title="Preview voice"
            className="shrink-0 h-12 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-2 disabled:opacity-50 transition"
          >
            {previewingVoice === voiceProfile ? (
              <>
                <Volume2 className="size-4 animate-pulse" /> Playing…
              </>
            ) : (
              <>
                <Play className="size-4" /> Preview
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-white/50 mt-1">
          Click Preview to hear the chosen voice say a sample line.
        </p>
      </div>

      <div>
        <label className={labelCls}>Persona / system prompt</label>
        <textarea
          className={`${inputCls} min-h-[120px]`}
          value={persona}
          onChange={(e) => setPersona(e.target.value)}
        />
      </div>

      <div>
        <label className={labelCls}>
          Question bank (one question per line, asked in order)
        </label>
        <textarea
          className={`${inputCls} min-h-[220px] font-mono text-sm`}
          value={questionsText}
          onChange={(e) => setQuestionsText(e.target.value)}
          placeholder={"Tell me about yourself.\nWalk me through a hard bug you fixed.\nWhy do you want this role?"}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={`${labelCls} mb-0`}>
            Skills rubric (what the candidate is scored on)
          </label>
          <button
            type="button"
            onClick={addRubricRow}
            className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition"
          >
            + Add skill
          </button>
        </div>
        <p className="text-xs text-white/55 mb-3">
          Each skill is scored 0–100 from the candidate&apos;s answers. Weight
          (1–5) sets its importance in the overall job-fit score; must-have gaps
          cap the recommendation.
        </p>
        {rubric.length === 0 ? (
          <p className="text-sm text-white/40 italic">
            No rubric yet — paste a JD above and click “Generate from JD”, or add
            skills manually.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {rubric.map((r, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2"
              >
                <input
                  className={`${inputCls} flex-1 py-2`}
                  value={r.skill}
                  onChange={(e) => updateRubric(i, { skill: e.target.value })}
                  placeholder="e.g. End-to-end payroll processing"
                />
                <select
                  className={`${inputCls} w-20 py-2`}
                  value={r.weight}
                  onChange={(e) =>
                    updateRubric(i, { weight: Number(e.target.value) })
                  }
                  title="Importance (1–5)"
                >
                  {[1, 2, 3, 4, 5].map((w) => (
                    <option key={w} value={w} className="bg-zinc-900">
                      ×{w}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1 text-xs text-white/70 whitespace-nowrap px-1">
                  <input
                    type="checkbox"
                    checked={r.mustHave}
                    onChange={(e) =>
                      updateRubric(i, { mustHave: e.target.checked })
                    }
                  />
                  must-have
                </label>
                <button
                  type="button"
                  onClick={() => removeRubricRow(i)}
                  className="text-white/40 hover:text-red-400 px-2 text-lg leading-none"
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-3">
          <Button type="submit" className="btn-primary" disabled={isPending}>
            {isPending ? "Saving..." : mode === "create" ? "Create agent" : "Save changes"}
          </Button>
        </div>
        {mode === "edit" && agent && (
          <button
            type="button"
            onClick={onDelete}
            className="text-sm text-red-400 hover:text-red-300"
            disabled={isPending}
          >
            Delete agent
          </button>
        )}
      </div>
    </form>
  );
}
