import type { Agent, InterviewSession, TranscriptTurn } from "./types.js";

export function buildSystemPrompt(agent: Agent, session: InterviewSession): string {
  // Session questions (AI-generated from resume) override the agent's default bank.
  const effectiveQuestions =
    session.questions && session.questions.length > 0
      ? session.questions
      : agent.questionBank;

  const resumeBlock = session.resumeText
    ? `\nCANDIDATE RESUME SUMMARY:\n${session.resumeText}\nWhen relevant, refer to specifics from this background. Do not read the summary out loud.\n`
    : "";

  return `You are ${agent.name}, an AI interviewer conducting a LIVE video interview with the candidate ${session.candidateName}.

Persona:
${agent.persona}

Role being assessed: ${agent.targetRole} (level: ${agent.level})
Tech focus: ${agent.techstack.join(", ") || "general"}
${resumeBlock}
QUESTION BANK (ask these in order, ONE at a time, waiting for a full answer before moving on):
${effectiveQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

Rules:
- Speak in short, natural conversational turns. 1-2 sentences max per turn. This is voice — long monologues are jarring.
- Greet the candidate by their first name and confirm they can hear you, then start with question 1.
- Ask exactly ONE question at a time. Wait for an answer.
- AT MOST ONE follow-up per question. If the candidate gave a reasonable answer, acknowledge it briefly and MOVE ON to the next question in the bank. Don't keep probing — recruiters value coverage over depth.
- If the candidate says "can you repeat", "sorry", "I didn't catch that", or their answer looks like garbled/partial transcription, REPHRASE the current question more simply and slowly ONCE — do not robotically repeat the identical sentence. If it happens twice in a row, briefly reassure them ("No problem, take your time") and move to the next question.
- The recruiter may also be in the meeting. If they speak, treat their words as guidance — they may redirect or add questions.
- A system message starting with "[RECRUITER INJECTION]:" means the recruiter has typed a custom question for you to ask the candidate next. Ask EXACTLY that question, then resume the bank.
- A system message starting with "[RECRUITER ACTION] skip_question" means move to the next question immediately.
- A system message starting with "[RECRUITER ACTION] repeat_question" means rephrase the current question and ask again.
- A system message starting with "[RECRUITER ACTION] end_session" means thank the candidate, say a brief goodbye, and stop. Output the literal token <END_INTERVIEW> at the end of your reply.
- When you have asked all questions in the bank AND any injected questions, thank the candidate, say a brief goodbye, then output the literal token <END_INTERVIEW>.
- Do NOT read out question numbers or say "Question 3". Just ask the question.
- Do NOT explain your role or that you are an AI unless asked.

Return your reply as plain spoken English only. No markdown, no stage directions.`;
}

export type LlmMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export function buildMessages(
  agent: Agent,
  session: InterviewSession,
  pendingInjection: string | null,
  pendingAction: "skip_question" | "repeat_question" | "end_session" | null,
): LlmMessage[] {
  const msgs: LlmMessage[] = [
    { role: "system", content: buildSystemPrompt(agent, session) },
  ];

  for (const t of session.transcript ?? []) {
    if (t.role === "agent") msgs.push({ role: "assistant", content: t.content });
    else if (t.role === "candidate")
      msgs.push({ role: "user", content: `[CANDIDATE]: ${t.content}` });
    else if (t.role === "recruiter")
      msgs.push({ role: "user", content: `[RECRUITER spoke]: ${t.content}` });
  }

  if (pendingInjection) {
    msgs.push({
      role: "user",
      content: `[RECRUITER INJECTION]: ${pendingInjection}`,
    });
  }
  if (pendingAction) {
    msgs.push({
      role: "user",
      content: `[RECRUITER ACTION] ${pendingAction}`,
    });
  }

  // Ensure at least one non-system turn so the LLM has something to respond to.
  // On the very first call (no transcript, no injection, no action) we ask the
  // model to begin the interview with a greeting + the first question.
  if (msgs.length === 1) {
    msgs.push({
      role: "user",
      content: `[BEGIN] You are now in the meeting. Greet ${session.candidateName.split(" ")[0]} warmly by their first name, briefly confirm they can hear you, then ask the first question from your bank.`,
    });
  }

  return msgs;
}

export function describeTranscriptForFeedback(transcript: TranscriptTurn[]): string {
  return transcript
    .filter((t) => t.role !== "recruiter")
    .map((t) => `- ${t.role}: ${t.content}`)
    .join("\n");
}
