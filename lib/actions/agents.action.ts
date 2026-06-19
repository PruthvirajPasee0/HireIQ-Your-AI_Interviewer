"use server";

import { db } from "@/firebase/admin";
import { getCurrentUser } from "@/lib/actions/auth.action";

const AGENTS = "agents";

function assertRecruiter(user: User | null): asserts user is User {
  if (!user) throw new Error("Not authenticated");
  if (user.role !== "recruiter") throw new Error("Recruiter role required");
}

/** Clean + clamp a rubric coming from the client. */
function sanitizeRubric(rubric?: RubricItem[]): RubricItem[] {
  if (!Array.isArray(rubric)) return [];
  return rubric
    .map((r) => ({
      skill: String(r?.skill ?? "").trim(),
      weight: Math.max(1, Math.min(5, Math.round(Number(r?.weight) || 3))),
      mustHave: Boolean(r?.mustHave),
    }))
    .filter((r) => r.skill.length > 0)
    .slice(0, 20);
}

export async function createAgent(params: CreateAgentParams) {
  const user = await getCurrentUser();
  assertRecruiter(user);
  if (params.ownerRecruiterId !== user.id) {
    return { success: false, message: "Owner mismatch" } as const;
  }

  const ref = db.collection(AGENTS).doc();
  const agent: Omit<Agent, "id"> = {
    ownerRecruiterId: user.id,
    name: params.name.trim(),
    persona: params.persona.trim(),
    voiceProfile: params.voiceProfile,
    questionBank: params.questionBank
      .map((q) => q.trim())
      .filter((q) => q.length > 0),
    targetRole: params.targetRole.trim(),
    level: params.level.trim(),
    techstack: params.techstack.map((t) => t.trim()).filter(Boolean),
    jobDescription: (params.jobDescription ?? "").trim(),
    rubric: sanitizeRubric(params.rubric),
    createdAt: new Date().toISOString(),
  };

  if (!agent.name) return { success: false, message: "Name required" } as const;
  if (agent.questionBank.length === 0)
    return { success: false, message: "Add at least one question" } as const;

  await ref.set(agent);
  return { success: true, agentId: ref.id } as const;
}

export async function getAgentsByRecruiter(): Promise<Agent[]> {
  const user = await getCurrentUser();
  if (!user || user.role !== "recruiter") return [];

  const snap = await db
    .collection(AGENTS)
    .where("ownerRecruiterId", "==", user.id)
    .get();

  const agents = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Agent[];
  agents.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return agents;
}

export async function getAgentById(id: string): Promise<Agent | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const doc = await db.collection(AGENTS).doc(id).get();
  if (!doc.exists) return null;

  const data = doc.data() as Omit<Agent, "id">;
  if (data.ownerRecruiterId !== user.id) return null;
  return { id: doc.id, ...data };
}

export async function updateAgent(params: UpdateAgentParams) {
  const user = await getCurrentUser();
  assertRecruiter(user);

  const ref = db.collection(AGENTS).doc(params.id);
  const existing = await ref.get();
  if (!existing.exists)
    return { success: false, message: "Agent not found" } as const;

  const data = existing.data() as Omit<Agent, "id">;
  if (data.ownerRecruiterId !== user.id)
    return { success: false, message: "Forbidden" } as const;

  const update: Partial<Agent> = {};
  if (params.name !== undefined) update.name = params.name.trim();
  if (params.persona !== undefined) update.persona = params.persona.trim();
  if (params.voiceProfile !== undefined) update.voiceProfile = params.voiceProfile;
  if (params.questionBank !== undefined)
    update.questionBank = params.questionBank
      .map((q) => q.trim())
      .filter(Boolean);
  if (params.targetRole !== undefined) update.targetRole = params.targetRole.trim();
  if (params.level !== undefined) update.level = params.level.trim();
  if (params.techstack !== undefined)
    update.techstack = params.techstack.map((t) => t.trim()).filter(Boolean);
  if (params.jobDescription !== undefined)
    update.jobDescription = params.jobDescription.trim();
  if (params.rubric !== undefined) update.rubric = sanitizeRubric(params.rubric);

  await ref.set(update, { merge: true });
  return { success: true } as const;
}

export async function deleteAgent(id: string) {
  const user = await getCurrentUser();
  assertRecruiter(user);

  const ref = db.collection(AGENTS).doc(id);
  const existing = await ref.get();
  if (!existing.exists)
    return { success: false, message: "Agent not found" } as const;
  const data = existing.data() as Omit<Agent, "id">;
  if (data.ownerRecruiterId !== user.id)
    return { success: false, message: "Forbidden" } as const;

  await ref.delete();
  return { success: true } as const;
}
