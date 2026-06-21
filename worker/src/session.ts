import { FieldValue } from "firebase-admin/firestore";
import { db } from "./firestore.js";
import { logger } from "./logger.js";
import { defaultProvider, resolveForHandle } from "./provider.js";
import type {
  BotHandle,
  BotProvider,
  NormalizedTranscriptEntry,
} from "./provider-types.js";
import { synth } from "./tts.js";
import { generateAgentReply, generateFeedback } from "./gemini.js";
import { buildMessages, describeTranscriptForFeedback } from "./prompts.js";
import type {
  Agent,
  ControlAction,
  CustomInjection,
  InterviewSession,
  TranscriptTurn,
} from "./types.js";

// Turn-taking. Each turn is gated by:
//   POLL_INTERVAL_MS (how often we hit Attendee's transcript endpoint)
//   + a silence threshold (how long the candidate must be quiet before we
//     consider their turn complete and reply).
// Real candidates are nervous: they pause to think, use fillers ("um", "uh"),
// and trail off mid-sentence. Replying too eagerly feels like an interruption,
// so we wait, and we wait EVEN LONGER when their last words signal they're not
// actually done (a filler or a dangling conjunction/preposition).
const POLL_INTERVAL_MS = 1000;

// ── Acoustic turn-taking + transcript-coverage (the right way) ────────────
// Attendee gives us TWO things on the same (epoch-ms) clock:
//   • speech_start / speech_stop — near-realtime acoustic VAD (~0.9s lag).
//   • transcript chunks — laggy text (2–4.5s) but each tagged with
//     timestamp_ms + duration_ms (when the speech actually happened).
// We commit a turn when the candidate has acoustically STOPPED *and* the
// transcript text has CAUGHT UP to that stop point (latest chunk end ≥ stop
// time). That means we have their FULL answer — no cutoff, no partial, no late
// fragment left to cause drift — and we respond the instant it's complete
// (adapts to the real lag instead of guessing a fixed wait).
//
// Brief beat after speech_stop so a quick resume (speech_start) can cancel.
const FINALIZE_AFTER_SPEECH_STOP_MS = 600;
// Transcript chunk end can land slightly before the speech_stop timestamp.
const COVERAGE_GRACE_MS = 400;
// Fallback when chunks lack duration_ms (poll path): commit once text has
// stopped arriving for this long after speech_stop.
const TRANSCRIPT_SETTLE_MS = 1200;
// Even in fallback mode, require a short post-stop catch-up window so we don't
// commit immediately on stale transcript gaps.
const MIN_TRANSCRIPT_CATCHUP_AFTER_STOP_MS = 2200;
// Hard cap so a missing chunk / clock issue can never hang the interview.
const MAX_WAIT_AFTER_STOP_MS = 8000;
// Safety: if flagged "speaking" but no candidate activity for this long, assume
// a speech_stop was dropped and treat them as stopped.
const STALE_SPEAKING_MS = 8000;

// ── Text-silence fallback (only when NO acoustic signal is available) ─────
// Baseline silence before we treat a turn as done. Transcription lags real
// speech by several seconds AND arrives in bursts, so too short a window cuts
// off long answers / fires before the full answer has been delivered. 3.5s
// balances responsiveness against giving the STT pipeline time to catch up.
const CANDIDATE_TURN_SILENCE_MS = 3500;
// They trailed off mid-thought ("...built it using", "um", "and") — clearly not
// finished, so wait noticeably longer before stepping in.
const MID_THOUGHT_SILENCE_MS = 6000;
// A short, natural beat before the agent speaks so it doesn't snap back the
// instant they stop. Kept small so it doesn't add much latency.
const PRE_SPEAK_PAUSE_MS = 500;
// Safety cap: if all we have is filler and they've gone quiet this long,
// they're stuck — flush so the agent can gently encourage them rather than
// sit in dead air forever.
const STUCK_SILENCE_MS = 12000;
// No-response handling: ONLY when the candidate has said NOTHING at all since
// the agent last spoke. Thresholds are generous because transcription lags
// several seconds behind real speech (esp. on the poll-only path) — nudging
// too early talks over a candidate who is mid-answer. A nudge is suppressed
// entirely the moment any candidate speech is seen (see maybeNudgeOnSilence).
const NO_RESPONSE_FIRST_MS = 22000;
const NO_RESPONSE_SECOND_MS = 42000;
// If the candidate produces NO speech at all for this long, assume they never
// showed up (or left) and end the interview so the bot leaves the call.
const ABANDON_SILENCE_MS = 5 * 60 * 1000;
const END_TOKEN = "<END_INTERVIEW>";
const RECORDING_RETENTION_MS = 2 * 24 * 60 * 60 * 1000;

// Pure disfluencies — never meaningful content on their own.
const FILLERS = new Set([
  "um", "uh", "umm", "uhh", "uhm", "er", "erm", "hmm", "hm", "mm", "mhm",
  "ah", "eh", "like", "well",
]);

// If the candidate's LAST word is one of these, they're almost certainly
// mid-sentence (dangling conjunction / preposition / article / auxiliary /
// filler). Generous on purpose — the only cost of a false positive is waiting
// a couple extra seconds, which is exactly what we want here.
const TRAILING_INCOMPLETE = new Set([
  ...FILLERS,
  "and", "or", "but", "so", "because", "if", "then", "that", "which", "who",
  "the", "a", "an", "of", "in", "on", "at", "to", "for", "with", "using",
  "from", "by", "about", "into", "is", "was", "were", "are", "am", "be",
  "my", "your", "his", "her", "its", "our", "their", "i", "we", "you", "it",
]);

export class SessionRunner {
  /**
   * Registry of live runners keyed by Attendee bot id. Lets the realtime
   * transcript webhook (worker HTTP server) route an incoming utterance to
   * the right in-progress session without polling.
   */
  private static readonly byBotId = new Map<string, SessionRunner>();

  /**
   * Called by the webhook receiver in index.ts on each Attendee
   * `transcript.update` event. Returns true if a live session consumed it.
   */
  static routeUtterance(
    botId: string,
    speakerName: string,
    text: string,
    timestampMs: number,
    durationMs = 0,
  ): boolean {
    const runner = SessionRunner.byBotId.get(botId);
    if (!runner) return false;
    runner.ingestUtterance(speakerName, text, timestampMs, durationMs);
    return true;
  }

  /**
   * Called by the webhook receiver on each Attendee
   * `participant_events.speech_start_stop` event. Returns true if a live
   * session consumed it.
   */
  static routeSpeechEvent(
    botId: string,
    eventType: "speech_start" | "speech_stop",
    speakerName: string,
    timestampMs: number,
  ): boolean {
    const runner = SessionRunner.byBotId.get(botId);
    if (!runner) return false;
    runner.ingestSpeechEvent(eventType, speakerName, timestampMs);
    return true;
  }

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
  /**
   * When we started waiting for the candidate to respond (set at the end of
   * every agent turn). Used to detect total silence and nudge. null = not
   * currently waiting for a response.
   */
  private awaitingSince: number | null = null;
  /** How many times we've nudged on the CURRENT silence (resets when they speak) */
  private noResponsePrompts = 0;
  /**
   * Last time the candidate actually spoke (any non-bot chunk). null until they
   * speak for the first time. Drives BOTH the no-response nudge guard ("have
   * they spoken since the agent's last turn?") and abandonment detection. Only
   * set on real speech — never by the agent — so it reflects the candidate only.
   */
  private lastCandidateActivityAt: number | null = null;
  /** Wall-clock when the interview loop went live; abandonment baseline. */
  private interviewStartedAt = 0;

  // ── Acoustic VAD state (Attendee speech_start_stop) ──
  /** True while the candidate is acoustically speaking right now. */
  private speaking = false;
  /** Date.now() of the last speech_stop; null while speaking / before first. */
  private lastSpeechStopAt: number | null = null;
  /** Meeting timestamp_ms of the last speech_stop (compared to transcript ts). */
  private lastSpeechStopTsMs = 0;
  /**
   * Meeting-clock END time (timestamp_ms + duration_ms) of the latest transcript
   * chunk. When this reaches the speech_stop timestamp, the text has caught up
   * to where the candidate stopped — i.e. we have their full answer.
   */
  private latestChunkEndMs = 0;
  /** Once true, we trust acoustic events for turn-taking over text-silence. */
  private haveSpeechSignal = false;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  /**
   * Buffer one finalized utterance (from the realtime webhook OR the polling
   * fallback). Both paths dedup on lastSeenTimestampMs so an utterance is
   * never processed twice regardless of which arrives first. Synchronous +
   * cheap so it's safe to call from the HTTP handler.
   */
  ingestUtterance(
    speakerName: string,
    text: string,
    timestampMs: number,
    durationMs = 0,
  ): void {
    const clean = (text ?? "").trim();
    if (!clean) return;
    if (timestampMs <= this.lastSeenTimestampMs) return; // already seen
    this.lastSeenTimestampMs = Math.max(this.lastSeenTimestampMs, timestampMs);
    if (speakerName === this.botName) return; // skip our own TTS
    this.pendingChunks.push({ ts: timestampMs, text: clean, speaker: speakerName });
    this.lastChunkAt = Date.now();
    // Track how far the transcript has covered, in meeting-clock time.
    this.latestChunkEndMs = Math.max(
      this.latestChunkEndMs,
      timestampMs + (durationMs > 0 ? durationMs : 0),
    );
    // Candidate is responding — cancel any pending no-response nudges and reset
    // the abandonment clock.
    this.noResponsePrompts = 0;
    this.lastCandidateActivityAt = Date.now();
  }

  /**
   * Acoustic voice-activity event from Attendee. This is our PRIMARY turn-taking
   * signal — it reflects when the candidate actually starts/stops talking, with
   * near-zero lag, unlike transcript text which arrives seconds late. Cheap +
   * synchronous; safe to call from the HTTP handler.
   */
  ingestSpeechEvent(
    eventType: "speech_start" | "speech_stop",
    speakerName: string,
    timestampMs: number,
  ): void {
    if (speakerName && speakerName === this.botName) return; // ignore the bot
    this.haveSpeechSignal = true;
    this.lastCandidateActivityAt = Date.now();
    if (eventType === "speech_start") {
      // Candidate is talking now — never let a turn commit or a nudge fire.
      this.speaking = true;
      this.lastSpeechStopAt = null;
      this.noResponsePrompts = 0;
    } else {
      // Candidate stopped — start the finalize timer.
      this.speaking = false;
      this.lastSpeechStopAt = Date.now();
      this.lastSpeechStopTsMs = timestampMs;
    }
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
      if (this.handle?.attendeeBotId) {
        SessionRunner.byBotId.delete(this.handle.attendeeBotId);
      }
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

    // Register so the realtime transcript webhook can route to this runner.
    if (handle.attendeeBotId) {
      SessionRunner.byBotId.set(handle.attendeeBotId, this);
    }
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
    this.interviewStartedAt = Date.now();
    while (!this.stop) {
      await this.heartbeat();
      await this.refreshSession();

      // End condition: status flipped externally
      if (this.session.status === "ended" || this.session.status === "failed") {
        logger.info("session ended externally");
        await this.finishUp();
        return;
      }

      // Abandonment: candidate never spoke (or left) for too long — leave.
      // Baseline off interview start until they first speak (so we DON'T treat
      // the pre-speech window as "candidate activity" — that would suppress the
      // no-response nudge guard which keys off lastCandidateActivityAt).
      const lastActivity = this.lastCandidateActivityAt ?? this.interviewStartedAt;
      if (Date.now() - lastActivity > ABANDON_SILENCE_MS) {
        logger.info(
          { sessionId: this.sessionId },
          "candidate absent for 5 min — leaving interview",
        );
        await this.markStatus("ended", "candidate absent (5 min of silence)");
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
      } else if (this.pendingChunks.length === 0) {
        // Candidate hasn't said anything at all — consider a gentle nudge.
        await this.maybeNudgeOnSilence();
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

    // Funnel through the same ingest path as the realtime webhook — shared
    // dedup on lastSeenTimestampMs means an utterance delivered by BOTH the
    // webhook and this poll is only ever buffered once.
    for (const e of newOnes) {
      this.ingestUtterance(
        e.speakerName,
        e.text,
        e.timestampMs,
        e.durationMs ?? 0,
      );
    }
  }

  private turnComplete(): boolean {
    if (this.pendingChunks.length === 0) return false;

    // ── Preferred: acoustic stop + transcript caught up to the stop point ──
    if (this.haveSpeechSignal) {
      if (this.speaking) {
        // Normally wait — but if a speech_stop was dropped, don't hang forever.
        if (Date.now() - (this.lastCandidateActivityAt ?? 0) <= STALE_SPEAKING_MS) {
          return false; // still talking — never interrupt
        }
        this.speaking = false;
        this.lastSpeechStopAt = Date.now();
        this.lastSpeechStopTsMs = this.latestChunkEndMs;
      }
      if (this.lastSpeechStopAt === null) return false; // no stop seen yet

      const sinceStop = Date.now() - this.lastSpeechStopAt;
      // Brief beat so a quick resume (speech_start) can cancel the commit.
      if (sinceStop < FINALIZE_AFTER_SPEECH_STOP_MS) return false;

      // PRIMARY: the transcript text has caught up to where they stopped — we
      // now hold their FULL answer (no partial, no late fragment outstanding).
      if (this.latestChunkEndMs >= this.lastSpeechStopTsMs - COVERAGE_GRACE_MS) {
        return true;
      }
      // FALLBACK (e.g. chunk had no duration_ms): commit once the transcript
      // has stopped arriving for a beat.
      const sinceLastChunk = this.lastChunkAt ? Date.now() - this.lastChunkAt : 0;
      if (
        sinceStop >= MIN_TRANSCRIPT_CATCHUP_AFTER_STOP_MS &&
        sinceLastChunk >= TRANSCRIPT_SETTLE_MS
      ) {
        return true;
      }
      // Hard cap so a missing chunk / clock issue can never hang the interview.
      return sinceStop > MAX_WAIT_AFTER_STOP_MS;
    }

    // ── Fallback: no acoustic signal — infer from text-arrival silence ──
    if (this.lastChunkAt === null) return false;
    const silence = Date.now() - this.lastChunkAt;

    const combined = this.pendingChunks.map((c) => c.text).join(" ");
    const words = combined
      .toLowerCase()
      .split(/\s+/)
      .map((w) => w.replace(/[^a-z']/g, ""))
      .filter((w) => w.length > 0);

    // Only filler so far ("um", "uh", "like") — the candidate is thinking, not
    // finished. Hold off until they've clearly stalled, then flush so the
    // agent can gently encourage rather than sit silent forever.
    const meaningful = words.filter((w) => !FILLERS.has(w));
    if (meaningful.length === 0) {
      return silence > STUCK_SILENCE_MS;
    }

    // Trailing word signals a dangling, mid-sentence thought — wait longer.
    const lastWord = words[words.length - 1];
    const threshold = TRAILING_INCOMPLETE.has(lastWord)
      ? MID_THOUGHT_SILENCE_MS
      : CANDIDATE_TURN_SILENCE_MS;
    return silence > threshold;
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
    // Turn consumed — clear the acoustic finalize marker so a new turn only
    // commits after the NEXT speech_start/speech_stop cycle.
    this.lastSpeechStopAt = null;
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
    liveNote: string | null = null,
  ): Promise<string> {
    const msgs = buildMessages(
      this.agent,
      this.session,
      pendingInjection,
      pendingAction,
      liveNote,
    );
    const reply = await generateAgentReply(msgs);
    const cleanReply = reply.replace(END_TOKEN, "").trim();

    if (cleanReply.length > 0) {
      logger.info({ reply: cleanReply.slice(0, 120) }, "agent turn");
      // Natural beat before speaking — don't pounce the instant they stop.
      await sleep(PRE_SPEAK_PAUSE_MS);
      // If candidate resumes while we're about to speak, yield this turn.
      const allowBargeInYield = !pendingInjection && !pendingAction;
      if (
        allowBargeInYield &&
        (this.speaking || this.pendingChunks.length > 0)
      ) {
        logger.info(
          { sessionId: this.sessionId },
          "candidate resumed during pre-speak pause; yielding bot reply",
        );
        return "";
      }
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

    // Start (or restart) the clock for waiting on the candidate's response.
    this.awaitingSince = Date.now();
    return reply;
  }

  /**
   * Called when the candidate has produced NO speech at all. Gently re-engages
   * after a stretch of total silence so the interview doesn't stall in dead
   * air. Escalates once (check-in -> offer to move on), then stops nudging and
   * waits — the candidate may simply need more time.
   */
  private async maybeNudgeOnSilence(): Promise<void> {
    if (this.awaitingSince === null) return;
    // Candidate is acoustically speaking right now — never nudge over them.
    if (this.speaking) return;

    // CRITICAL guard: if the candidate has spoken AT ALL since the agent's last
    // turn, they're engaged — never nudge. Transcription lags several seconds
    // behind real speech, so `pendingChunks` is often momentarily empty while
    // the candidate is mid-answer; without this guard the bot talks over them
    // ("take your time...") and the conversation derails. A nudge is only for
    // genuine, total silence after the agent spoke.
    if (
      this.lastCandidateActivityAt !== null &&
      this.lastCandidateActivityAt >= this.awaitingSince
    ) {
      return;
    }

    const silent = Date.now() - this.awaitingSince;

    if (this.noResponsePrompts === 0 && silent > NO_RESPONSE_FIRST_MS) {
      this.noResponsePrompts = 1;
      await this.speakAgentTurn(
        null,
        null,
        '[NO RESPONSE] The candidate has been silent for a while. Give ONE brief, gentle presence check — e.g. ask if they are still there / can hear you. Do NOT re-ask or rephrase the interview question (their answer may still be coming through). Do NOT use the phrase "take your time". One short sentence.',
      );
    } else if (this.noResponsePrompts === 1 && silent > NO_RESPONSE_SECOND_MS) {
      this.noResponsePrompts = 2;
      await this.speakAgentTurn(
        null,
        null,
        '[NO RESPONSE] Still silent after a check-in. Briefly ask whether they would like to continue with this question or move on to the next one. Do NOT use the phrase "take your time". One short sentence.',
      );
    } else if (this.noResponsePrompts >= 2 && silent > NO_RESPONSE_SECOND_MS) {
      // Stop nudging — wait quietly. Resumes if they speak (resets counter).
      this.awaitingSince = null;
    }
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

  /**
   * Lightweight shutdown for process termination (SIGTERM on deploy). Stops the
   * loop and asks the bot to leave the call so it doesn't linger — but does NOT
   * generate feedback or flip status (the session may resume on the next
   * instance). Best-effort.
   */
  async leaveQuietly(): Promise<void> {
    this.stop = true;
    if (this.handle?.attendeeBotId) {
      SessionRunner.byBotId.delete(this.handle.attendeeBotId);
    }
    if (this.handle) {
      try {
        await this.provider.leaveBot(this.handle);
      } catch {
        /* best effort */
      }
    }
  }

  private async finishUp() {
    this.stop = true;
    if (this.handle?.attendeeBotId) {
      SessionRunner.byBotId.delete(this.handle.attendeeBotId);
    }
    if (this.handle) {
      try {
        await this.provider.leaveBot(this.handle);
      } catch (err) {
        logger.warn({ err }, "leave bot failed");
      }
    }
    await this.generateAndSaveFeedback();
    const endedAt = new Date().toISOString();
    const recordingAvailableUntil = new Date(
      Date.parse(endedAt) + RECORDING_RETENTION_MS
    ).toISOString();
    await db
      .collection("interviewSessions")
      .doc(this.sessionId)
      .update({
        status: "ended",
        endedAt,
        recordingStatus: "pending",
        recordingAvailableUntil,
        recordingLiked: false,
      });
    this.session.status = "ended";
    this.session.endedAt = endedAt;
    this.session.recordingStatus = "pending";
    this.session.recordingAvailableUntil = recordingAvailableUntil;
    this.session.recordingLiked = false;

    await this.tryAttachRecordingDownloadUrl();
  }

  private async tryAttachRecordingDownloadUrl() {
    if (!this.handle) return;

    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        const url = await this.provider.getRecordingDownloadUrl(this.handle);
        if (url) {
          const capturedAt = new Date().toISOString();
          await db
            .collection("interviewSessions")
            .doc(this.sessionId)
            .update({
              recordingStatus: "available",
              recordingDownloadUrl: url,
              recordingCapturedAt: capturedAt,
            });
          this.session.recordingStatus = "available";
          this.session.recordingDownloadUrl = url;
          this.session.recordingCapturedAt = capturedAt;
          return;
        }
      } catch (err) {
        logger.warn(
          { err, sessionId: this.sessionId, attempt },
          "recording url lookup failed during finish",
        );
      }
      await sleep(5000);
    }

    logger.info(
      { sessionId: this.sessionId },
      "recording url not ready yet; keeping status pending for maintenance retry",
    );
  }

  private async generateAndSaveFeedback() {
    const transcriptText = describeTranscriptForFeedback(this.session.transcript ?? []);
    if (!transcriptText.trim()) {
      logger.warn("no transcript to feedback");
      return;
    }
    try {
      const effectiveQuestions =
        this.session.questions && this.session.questions.length > 0
          ? this.session.questions
          : (this.agent.questionBank ?? []);
      const fb = await generateFeedback(transcriptText, {
        role: this.agent.targetRole,
        level: this.agent.level,
        techstack: this.agent.techstack ?? [],
        questions: effectiveQuestions,
        jobDescription: this.agent.jobDescription,
        rubric: this.agent.rubric,
      });
      const ref = db.collection("feedback").doc();
      await ref.set({
        interviewId: this.sessionId, // reuse interviewId as sessionId
        userId: this.session.recruiterId,
        totalScore: fb.totalScore,
        categoryScores: fb.categoryScores,
        strengths: fb.strengths,
        areasForImprovement: fb.areasForImprovement,
        finalAssessment: fb.finalAssessment,
        skillScores: fb.skillScores ?? [],
        jobFitScore: fb.jobFitScore,
        recommendation: fb.recommendation,
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
