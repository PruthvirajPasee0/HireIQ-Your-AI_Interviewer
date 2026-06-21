import { FieldValue } from "firebase-admin/firestore";
import { db } from "./firestore";
import { logger } from "./logger";
import { defaultProvider, resolveForHandle } from "./provider";
import type {
  BotHandle,
  BotProvider,
  NormalizedTranscriptEntry,
} from "./provider-types";
import { synth } from "./tts";
import { generateAgentReply, generateFeedback } from "./gemini";
import { buildMessages, describeTranscriptForFeedback } from "./prompts";
import type {
  Agent,
  ControlAction,
  CustomInjection,
  InterviewSession,
  TranscriptTurn,
} from "./types";

// Tuned for responsiveness. Each turn is gated by:
//   POLL_INTERVAL_MS (how often we hit Attendee's transcript endpoint)
//   + CANDIDATE_TURN_SILENCE_MS (how long the candidate must be quiet before
//     we consider their turn complete and reply).
// Lower = snappier. Too low = we cut the candidate off mid-thought.
const POLL_INTERVAL_MS = 1000;
const CANDIDATE_TURN_SILENCE_MS = 1500;
const END_TOKEN = "<END_INTERVIEW>";

export class SessionRunner {
  private readonly sessionId: string;
  private session!: InterviewSession;
  private agent!: Agent;
  private provider: BotProvider = defaultProvider;
  private handle: BotHandle | null = null;
  private botName = "AI Interviewer";
  private stop = false;

  /** ms timestamp of last transcript entry we've processed */
  private lastSeenTimestampMs = -1;
  /**
   * Pending non-bot utterance being accumulated, with the speaker name so we
   * can label the transcript correctly when we flush. We treat ALL non-bot
   * speech as something the AI should reply to — name-matching to decide
   * "candidate vs recruiter" was too brittle (Google Meet display names rarely
   * match the scheduled candidate name exactly).
   */
  private pendingChunks: { ts: number; text: string; speaker: string }[] = [];
  /** When the last new non-bot transcript chunk arrived */
  private lastChunkAt: number | null = null;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  async run(): Promise<void> {
    try {
      await this.load();
      await this.dispatchBot();
      await this.waitForBotJoined();
      await this.markStatus("in_progress");
      await this.speakAgentTurn(null, null); // greeting + Q1
      await this.mainLoop();
    } catch (err) {
      logger.error({ err, sessionId: this.sessionId }, "session run failed");
      await this.markStatus("failed", String(err));
      if (this.handle) {
        try {
          await this.provider.leaveBot(this.handle);
        } catch {}
      }
    }
  }

  private async load() {
    const snap = await db.collection("interviewSessions").doc(this.sessionId).get();
    if (!snap.exists) throw new Error("session not found");
    this.session = { id: snap.id, ...(snap.data() as Omit<InterviewSession, "id">) };
    const agentSnap = await db.collection("agents").doc(this.session.agentId).get();
    if (!agentSnap.exists) throw new Error("agent not found");
    this.agent = { id: agentSnap.id, ...(agentSnap.data() as Omit<Agent, "id">) };
    this.botName = `${this.agent.name} (AI)`;

    // If the session explicitly chose a provider, honour that (lets a single
    // worker process serve both Attendee and Vexa sessions). Otherwise fall
    // back to the env-default chosen at boot.
    if (this.session.botProvider) {
      this.provider = resolveForHandle({
        provider: this.session.botProvider,
        attendeeBotId: this.session.attendeeBotId,
        attendeeEndpoint: this.session.attendeeEndpoint,
        vexaNativeMeetingId: this.session.vexaNativeMeetingId,
        vexaNumericId: this.session.vexaNumericId,
      });
    }
  }

  private async refreshSession() {
    const snap = await db.collection("interviewSessions").doc(this.sessionId).get();
    if (snap.exists) {
      this.session = { id: snap.id, ...(snap.data() as Omit<InterviewSession, "id">) };
    }
  }

  private async dispatchBot() {
    logger.info(
      { sessionId: this.sessionId, meet: this.session.meetLink, provider: this.provider.name },
      "creating bot",
    );
    const handle = await this.provider.createBot(this.session.meetLink, this.botName);
    this.handle = handle;
    const update: Record<string, unknown> = { botProvider: handle.provider };
    if (handle.attendeeBotId) update.attendeeBotId = handle.attendeeBotId;
    if (handle.attendeeEndpoint) update.attendeeEndpoint = handle.attendeeEndpoint;
    if (handle.vexaNativeMeetingId) update.vexaNativeMeetingId = handle.vexaNativeMeetingId;
    if (handle.vexaNumericId !== undefined) update.vexaNumericId = handle.vexaNumericId;
    await db.collection("interviewSessions").doc(this.sessionId).update(update);
  }

  private async waitForBotJoined() {
    if (!this.handle) throw new Error("no bot handle");
    for (let i = 0; i < 60; i++) {
      if (await this.provider.isBotEnded(this.handle)) {
        throw new Error("bot ended before joining");
      }
      const joined = await this.provider.isBotJoined(this.handle);
      logger.info({ joined, attempt: i, provider: this.provider.name }, "join check");
      if (joined) {
        await this.markStatus("bot_joined");
        return;
      }
      await sleep(2000);
    }
    throw new Error("timeout waiting for bot to join");
  }

  private async mainLoop() {
    while (!this.stop) {
      await this.heartbeat();
      await this.refreshSession();

      // End condition: status flipped externally
      if (this.session.status === "ended" || this.session.status === "failed") {
        logger.info("session ended externally");
        await this.finishUp();
        return;
      }

      // Pending control actions take priority
      const pendingAction = (this.session.controlActions ?? []).find((a) => !a.consumed);
      if (pendingAction) {
        await this.markActionConsumed(pendingAction.id);
        const reply = await this.speakAgentTurn(null, pendingAction.type);
        if (pendingAction.type === "end_session" || reply.includes(END_TOKEN)) {
          await this.finishUp();
          return;
        }
        continue;
      }

      // Pending recruiter injections next
      const pendingInjection = (this.session.customInjections ?? []).find((i) => !i.consumed);
      if (pendingInjection) {
        await this.markInjectionConsumed(pendingInjection.id);
        await this.speakAgentTurn(pendingInjection.text, null);
        continue;
      }

      // Otherwise pull new transcript chunks (any non-bot speaker)
      await this.pollTranscript();
      const haveTurn = this.turnComplete();
      if (haveTurn) {
        const flushed = this.flushTurn();
        if (flushed.text.length > 0) {
          await this.appendTranscript({
            role: flushed.role,
            content: flushed.text,
            ts: new Date().toISOString(),
          });
          const reply = await this.speakAgentTurn(null, null);
          if (reply.includes(END_TOKEN)) {
            await this.finishUp();
            return;
          }
        }
      }

      await sleep(POLL_INTERVAL_MS);
    }
  }

  private async pollTranscript() {
    if (!this.handle) return;
    let entries: NormalizedTranscriptEntry[] = [];
    try {
      entries = await this.provider.getTranscript(this.handle);
    } catch (err) {
      logger.warn({ err }, "transcript poll failed");
      return;
    }
    const newOnes = entries
      .filter((e) => e.timestampMs > this.lastSeenTimestampMs)
      .sort((a, b) => a.timestampMs - b.timestampMs);

    for (const e of newOnes) {
      this.lastSeenTimestampMs = Math.max(this.lastSeenTimestampMs, e.timestampMs);
      if (!e.text) continue;
      // Skip our own bot's speech
      if (e.speakerName === this.botName) continue;

      // EVERY non-bot utterance is a turn the AI should respond to. We used
      // to short-circuit recruiter speech (just log to transcript, never
      // trigger a reply) — that broke the conversation flow whenever the
      // Meet display name didn't match the scheduled candidate name.
      this.pendingChunks.push({
        ts: e.timestampMs,
        text: e.text,
        speaker: e.speakerName,
      });
      this.lastChunkAt = Date.now();
    }
  }

  private turnComplete(): boolean {
    if (this.pendingChunks.length === 0) return false;
    if (this.lastChunkAt === null) return false;
    return Date.now() - this.lastChunkAt > CANDIDATE_TURN_SILENCE_MS;
  }

  /**
   * Flush all pending chunks as a single turn. Picks the most-frequent
   * speaker for role labeling. Falls back to "candidate" — when in doubt,
   * the turn is part of the interview flow.
   */
  private flushTurn(): { text: string; role: TranscriptTurn["role"] } {
    const text = this.pendingChunks.map((c) => c.text).join(" ").trim();
    // Pick the dominant speaker among chunks
    const counts = new Map<string, number>();
    for (const c of this.pendingChunks) {
      counts.set(c.speaker, (counts.get(c.speaker) ?? 0) + 1);
    }
    let dominantSpeaker = "";
    let max = -1;
    for (const [speaker, count] of counts) {
      if (count > max) {
        max = count;
        dominantSpeaker = speaker;
      }
    }
    this.pendingChunks = [];
    this.lastChunkAt = null;
    return { text, role: this.classifySpeaker(dominantSpeaker) };
  }

  /**
   * Role label for transcript display only — does NOT gate whether the AI
   * replies. Heuristic: if the speaker's name fuzzy-matches the candidate's
   * name we labeled in Firestore, label "candidate". Otherwise "recruiter".
   */
  private classifySpeaker(speakerName: string): TranscriptTurn["role"] {
    if (!speakerName) return "candidate";
    const name = speakerName.toLowerCase();
    const candidateFirst = this.session.candidateName.toLowerCase().split(" ")[0];
    if (candidateFirst && name.includes(candidateFirst)) return "candidate";
    const candidateLast = this.session.candidateName
      .toLowerCase()
      .split(" ")
      .slice(-1)[0];
    if (candidateLast && candidateLast !== candidateFirst && name.includes(candidateLast))
      return "candidate";
    // If nothing matched, fall back to candidate — better to over-tag than
    // misroute conversation flow.
    return "candidate";
  }

  private async speakAgentTurn(
    pendingInjection: string | null,
    pendingAction: ControlAction["type"] | null,
  ): Promise<string> {
    const msgs = buildMessages(this.agent, this.session, pendingInjection, pendingAction);
    const reply = await generateAgentReply(msgs);
    const cleanReply = reply.replace(END_TOKEN, "").trim();

    if (cleanReply.length > 0) {
      logger.info({ reply: cleanReply.slice(0, 120) }, "agent turn");
      const audio = await synth(cleanReply, this.agent.voiceProfile);
      if (this.handle) {
        await this.provider.outputAudio(this.handle, audio);
      }
      await this.appendTranscript({
        role: "agent",
        content: cleanReply,
        ts: new Date().toISOString(),
      });
    }

    return reply;
  }

  private async appendTranscript(turn: TranscriptTurn) {
    await db
      .collection("interviewSessions")
      .doc(this.sessionId)
      .update({
        transcript: FieldValue.arrayUnion(turn),
      });
    this.session.transcript = [...(this.session.transcript ?? []), turn];
  }

  private async markActionConsumed(actionId: string) {
    const current: ControlAction[] = this.session.controlActions ?? [];
    const updated = current.map((a) =>
      a.id === actionId ? { ...a, consumed: true } : a,
    );
    await db
      .collection("interviewSessions")
      .doc(this.sessionId)
      .update({ controlActions: updated });
    this.session.controlActions = updated;
  }

  private async markInjectionConsumed(injectionId: string) {
    const current: CustomInjection[] = this.session.customInjections ?? [];
    const updated = current.map((i) =>
      i.id === injectionId ? { ...i, consumed: true } : i,
    );
    await db
      .collection("interviewSessions")
      .doc(this.sessionId)
      .update({ customInjections: updated });
    this.session.customInjections = updated;
  }

  private async markStatus(
    status: InterviewSession["status"],
    failureReason?: string,
  ) {
    const update: Partial<InterviewSession> = { status };
    if (failureReason) update.failureReason = failureReason;
    await db
      .collection("interviewSessions")
      .doc(this.sessionId)
      .update(update as Record<string, unknown>);
    this.session.status = status;
  }

  private async heartbeat() {
    await db
      .collection("interviewSessions")
      .doc(this.sessionId)
      .update({ workerHeartbeatAt: new Date().toISOString() });
  }

  private async finishUp() {
    this.stop = true;
    if (this.handle) {
      try {
        await this.provider.leaveBot(this.handle);
      } catch (err) {
        logger.warn({ err }, "leave bot failed");
      }
    }
    await this.generateAndSaveFeedback();
    await db
      .collection("interviewSessions")
      .doc(this.sessionId)
      .update({
        status: "ended",
        endedAt: new Date().toISOString(),
      });
  }

  private async generateAndSaveFeedback() {
    const transcriptText = describeTranscriptForFeedback(this.session.transcript ?? []);
    if (!transcriptText.trim()) {
      logger.warn("no transcript to feedback");
      return;
    }
    try {
      const fb = await generateFeedback(transcriptText);
      const ref = db.collection("feedback").doc();
      await ref.set({
        interviewId: this.sessionId, // reuse interviewId as sessionId
        userId: this.session.recruiterId,
        totalScore: fb.totalScore,
        categoryScores: fb.categoryScores,
        strengths: fb.strengths,
        areasForImprovement: fb.areasForImprovement,
        finalAssessment: fb.finalAssessment,
        createdAt: new Date().toISOString(),
      });
      await db
        .collection("interviewSessions")
        .doc(this.sessionId)
        .update({ feedbackId: ref.id });
      logger.info({ feedbackId: ref.id }, "feedback saved");
    } catch (err) {
      logger.error({ err }, "feedback generation failed");
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
