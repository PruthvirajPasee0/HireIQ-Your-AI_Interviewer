# AI Interviewer Worker

Long-running Node service that drives live interview sessions. Sits between Attendee.dev (Google Meet bot) and the existing Deepgram + Gemini Flash pipeline.

## What it does

Watches Firestore `interviewSessions` collection for any session whose `status === "bot_dispatching"`. When one shows up it:

1. Creates an Attendee bot in the candidate's Google Meet via `POST /api/v1/bots`.
2. Polls the bot until it's joined the meeting.
3. Sets status to `in_progress`.
4. Generates the agent's next turn via Gemini Flash Lite (using `Agent.persona` + `questionBank`).
5. Synthesizes the reply with Deepgram aura-2 TTS, sends it to the bot via `POST /api/v1/bots/<id>/output_audio` (base64 MP3) — the bot speaks it in the Meet.
6. Polls Attendee's transcript endpoint every 2.5s. Anything spoken by the candidate is accumulated until 2.5s of silence, then handed to Gemini for the next agent turn. Anyone else (the recruiter) gets logged as a `recruiter` turn.
7. Watches the session doc for new `customInjections` and `controlActions` (written by the recruiter control panel). Recruiter typed questions get injected as the next agent question; skip / repeat / end actions are obeyed.
8. When the agent emits `<END_INTERVIEW>` or the recruiter clicks End, the worker calls `POST /api/v1/bots/<id>/leave`, generates a feedback doc via Gemini structured output (same schema as the legacy async flow), and writes it to `feedback`.

The transcript array in Firestore is updated turn-by-turn — the recruiter Live panel polls the session doc every 2s and renders the transcript live.

## Run locally

```bash
cd worker
cp .env.example .env
# Fill in Firebase service account, Attendee, Deepgram, Gemini keys
npm install
npm run dev
```

Then in another terminal, run the Next.js app (`npm run dev` in the repo root). Sign up as a recruiter at `/sign-up?role=recruiter`, create an agent, schedule a session against a real `meet.google.com/...` link, open the candidate invite link in another browser, click "Open Google Meet", then in the recruiter Live panel click **Dispatch AI bot now**.

The worker log will show the bot creation, state transitions, and each agent turn. The bot should join the Meet within ~15 seconds and start speaking.

## Architecture notes

- **No WebSockets.** Attendee gives us everything we need over REST. The transcript endpoint returns partial transcripts during the call.
- **Why Gemini Flash Lite text, not Gemini Live?** Per project preference: reuse the existing transcription + LLM pipeline. STT is handled by Attendee (which uses Deepgram under the hood for Meet transcription, configured in the Attendee project settings).
- **Speaker classification** is fuzzy: anything not matching the bot name and matching the candidate's first name is "candidate"; everything else is "recruiter". If your Meet displays the candidate with a different name, expand the matcher in `session.ts` (`isCandidate`).
- **Concurrency**: one Node process can run many sessions in parallel (each `SessionRunner` is async). At scale you can horizontally scale by sharding on `sessionId`, or move from Firestore-watch to a queue.

## Deploying

The worker is a single Node process. Drop it on Fly.io, Railway, Render, or a small VPS. The Dockerfile and fly.toml are not included in this scaffold — add them when you're ready to deploy. Locally `npm run dev` is enough for end-to-end testing.

## Env vars

See `.env.example`. The Firebase service account must be the same one the Next.js app uses, or at minimum have read+write access to `interviewSessions`, `agents`, and `feedback` collections.
