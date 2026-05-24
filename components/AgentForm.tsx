"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createAgent, updateAgent, deleteAgent } from "@/lib/actions/agents.action";

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
        <select
          className={inputCls}
          value={voiceProfile}
          onChange={(e) => setVoiceProfile(e.target.value as DeepgramVoice)}
        >
          {VOICE_OPTIONS.map((v) => (
            <option key={v.id} value={v.id} className="bg-zinc-900">
              {v.label}
            </option>
          ))}
        </select>
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
