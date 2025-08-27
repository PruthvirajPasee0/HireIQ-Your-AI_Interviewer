"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";

import { cn } from "@/lib/utils";

interface RunnerProps {
  userName: string;
  userId?: string;
  interviewId: string;
  questions: string[];
}

type SavedMessage = { role: "user" | "assistant"; content: string };

export default function InterviewRunner({
  userName,
  userId,
  interviewId,
  questions,
}: RunnerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [displayAssistantText, setDisplayAssistantText] = useState<
    string | null
  >(null);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  // Prevent duplicate speaks in React Strict Mode and track asked base questions
  const askedSetRef = useRef<Set<number>>(new Set());
  // Track greeting/farewell and UI start state
  const greetedRef = useRef<boolean>(false);
  const farewellRef = useRef<boolean>(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Prefetch feedback route early to make final redirect instant
  useEffect(() => {
    if (interviewId) {
      router.prefetch(`/interview/${interviewId}/feedback`);
    }
  }, [interviewId, router]);

  useEffect(() => {
    // Pre-ask permission to avoid UX hiccups
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        stream.getTracks().forEach((t) => t.stop());
      })
      .catch(() => {
        toast.error("Microphone permission is required.");
      });
  }, []);

  // Ask the first question and subsequent ones automatically via index change

  const speak = async (text: string, opts?: { record?: boolean }) => {
    try {
      // Indicate we are preparing TTS audio
      setIsProcessing(true);
      const res = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voice:
            process.env.NEXT_PUBLIC_DEEPGRAM_TTS_VOICE || "aura-2-odysseus-en",
        }),
      });
      if (!res.ok) throw new Error("TTS failed");
      const arrayBuf = await res.arrayBuffer();
      const blob = new Blob([arrayBuf], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);

      await new Promise<void>((resolve, reject) => {
        const audio = new Audio(url);
        // Slightly slower playback for a calmer, more natural feel (configurable)
        const envRate = Number(process.env.NEXT_PUBLIC_TTS_PLAYBACK_RATE);
        const desired = isNaN(envRate) ? 1.05 : envRate; // slight speed up by default for snappier feel
        // clamp to sane range (allow modest speed-up)
        audio.playbackRate = Math.max(0.7, Math.min(1.25, desired));
        // As soon as audio can play, show the assistant text and mark speaking
        audio.oncanplaythrough = () => {
          setDisplayAssistantText(text);
          setIsProcessing(false);
          setIsSpeaking(true);
        };
        // Append the assistant message when playback actually starts (unless suppressed)
        audio.onplay = () => {
          if (opts?.record === false) return;
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: text },
          ]);
        };
        audio.onended = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error("Audio play failed"));
        };
        audio.play();
      });
    } catch (e: any) {
      toast.error(e?.message || "Failed to play audio");
    } finally {
      setIsSpeaking(false);
      // Hide assistant text after speech completes or on error
      setDisplayAssistantText(null);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunksRef.current = [];
      mr.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) audioChunksRef.current.push(ev.data);
      };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
      // Hide assistant text while user is speaking
      setDisplayAssistantText(null);
      setIsProcessing(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to start recording");
    }
  };

  const stopRecording = async () => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    await new Promise<void>((resolve) => {
      const handler = () => {
        mr.removeEventListener("stop", handler);
        resolve();
      };
      mr.addEventListener("stop", handler);
      mr.stop();
    });
    setRecording(false);
    // Ensure tracks are stopped to release mic
    const stream: MediaStream | undefined = (mr as any).stream;
    stream?.getTracks().forEach((t) => t.stop());

    setIsProcessing(true);
    const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
    const res = await fetch("/api/speech-to-text", {
      method: "POST",
      headers: { "Content-Type": "audio/webm" },
      body: blob,
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      toast.error(data.error || "Transcription failed");
      setIsProcessing(false);
      return;
    }

    const transcript: string = data.transcript || "";
    const allMessages: SavedMessage[] = [
      ...messages,
      { role: "user", content: transcript },
    ];
    setMessages(allMessages);

    // Decide next step based on the user's answer (conversational flow)
    await decideNextStep(transcript, allMessages);
  };

  // End the interview immediately; if recording, stop & transcribe current answer first
  const endInterviewNow = async () => {
    try {
      const mr = mediaRecorderRef.current;
      if (recording && mr) {
        await new Promise<void>((resolve) => {
          const handler = () => {
            mr.removeEventListener("stop", handler);
            resolve();
          };
          mr.addEventListener("stop", handler);
          mr.stop();
        });
        setRecording(false);
        const stream: MediaStream | undefined = (mr as any).stream;
        stream?.getTracks().forEach((t) => t.stop());

        // Transcribe the just-recorded audio and include it in transcript
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const res = await fetch("/api/speech-to-text", {
          method: "POST",
          headers: { "Content-Type": "audio/webm" },
          body: blob,
        });
        const data = await res.json();
        if (res.ok && data.success) {
          const transcript: string = data.transcript || "";
          await finalizeInterview([
            ...messages,
            { role: "user", content: transcript },
          ]);
          return;
        }
        // If STT fails, still finalize with prior messages
        await finalizeInterview(messages);
        return;
      }
      // Not recording: finalize immediately
      await finalizeInterview(messages);
    } catch (e: any) {
      await finalizeInterview(messages);
    }
  };

  const askCurrentQuestion = async () => {
    // Enforce total question budget (assistant messages count)
    const askedSoFar = messages.filter((m) => m.role === "assistant").length;
    const remainingBudget = questions.length - askedSoFar;
    if (remainingBudget <= 0) {
      await finalizeInterview(messages);
      return;
    }
    const q = questions[currentIndex];
    if (!q) {
      await finalizeInterview(messages);
      return;
    }
    // Mark this base question as asked to keep progress accurate and avoid duplicate prompts
    if (!askedSetRef.current.has(currentIndex)) {
      askedSetRef.current.add(currentIndex);
    }
    // We are now starting if not already
    setHasStarted(true);
    await speak(q);
    // Automatically start recording after the question has been asked
    if (!recording) await startRecording();
  };

  // Whenever the current question index advances, ask the next question automatically
  useEffect(() => {
    // First question is triggered by the greeting effect to avoid double-speaking
    if (currentIndex === 0) return;
    if (!isSpeaking && !recording && questions[currentIndex]) {
      // Guard against duplicate effect runs (e.g., Strict Mode)
      if (askedSetRef.current.has(currentIndex)) return;
      askedSetRef.current.add(currentIndex);
      askCurrentQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  // Initial greeting before the first question (top-level hook)
  useEffect(() => {
    // Guard against double-mount in React Strict Mode by persisting a flag per interview
    const greetKey = `greeted_${interviewId}`;
    if (typeof window !== "undefined") {
      const already = sessionStorage.getItem(greetKey);
      if (already) return;
      sessionStorage.setItem(greetKey, "1");
    }
    if (greetedRef.current) return;
    greetedRef.current = true;
    const intro = `Hi ${userName}, welcome to your mock interview. Let's begin.`;
    (async () => {
      // Show transcript area and display the greeting text while playing
      setHasStarted(true);
      await speak(intro, { record: false });
      // Start with the first base question
      await askCurrentQuestion();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Decide next question or follow-up based on transcript and conversation state
  const decideNextStep = async (
    latestTranscript: string,
    allMsgs: SavedMessage[]
  ) => {
    try {
      const baseNext = questions[currentIndex + 1] || null;
      // Compute remaining total question budget (including follow-ups)
      const askedSoFar = allMsgs.filter((m) => m.role === "assistant").length;
      const remainingBudget = Math.max(0, questions.length - askedSoFar);
      if (remainingBudget <= 0) {
        await finalizeInterview(allMsgs);
        return;
      }
      setIsProcessing(true);
      const res = await fetch("/api/next-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: allMsgs,
          baseQuestion: baseNext,
          // Treat remainingCount as overall remaining budget on the server
          remainingCount: remainingBudget,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success)
        throw new Error(data?.error || "next-question failed");

      // type: 'followup' | 'base' | 'end'
      if (data.type === "followup" && data.question) {
        // Ask a short contextual follow-up without advancing index
        // Ensure we still have budget before speaking
        const askedNow = (
          messages.concat({
            role: "user",
            content: latestTranscript,
          }) as SavedMessage[]
        ).filter((m) => m.role === "assistant").length;
        const remNow = Math.max(0, questions.length - askedNow);
        if (remNow <= 0) {
          await finalizeInterview(allMsgs);
          return;
        }
        await speak(data.question);
        if (!recording) await startRecording();
        return;
      }

      if (data.type === "base") {
        // Move to the next base question only if within bounds and we still have budget
        if (currentIndex + 1 < questions.length) {
          setCurrentIndex((i) => i + 1);
          // stay in processing until the next question TTS begins
          return;
        }
        // No base left, fall through to end
      }

      // End of conversation or fallback
      await finalizeInterview(allMsgs);
    } catch (e: any) {
      // Fallback to original sequential behavior on failure
      const askedSoFar = allMsgs.filter((m) => m.role === "assistant").length;
      const remainingBudget = Math.max(0, questions.length - askedSoFar);
      if (currentIndex + 1 < questions.length && remainingBudget > 0) {
        setCurrentIndex((i) => i + 1);
      } else {
        await finalizeInterview(allMsgs);
      }
    }
  };

  const finalizeInterview = async (allMessages: SavedMessage[]) => {
    try {
      setIsProcessing(true);
      if (!farewellRef.current) {
        farewellRef.current = true;
        const outro = `Thank you, ${userName}. This concludes the interview. I'll now generate your feedback.`;
        await speak(outro, { record: false });
      }
      const res = await fetch("/api/create-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId,
          userId: userId!,
          transcript: allMessages,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push(`/interview/${interviewId}/feedback`);
      } else {
        toast.error(data?.error || "Failed to create feedback");
        router.push("/");
      }
    } catch (e: any) {
      toast.error(e?.message || "Feedback failed");
      router.push("/");
    }
  };

  return (
    <>
      {/* Top progress + textual status */}
      <div className="w-full mb-4">
        <div className="w-full flex items-center justify-between mb-2">
          <p className="text-white/80 text-sm">
            {(() => {
              const total = Math.max(1, questions.length);
              const current = Math.min(askedSetRef.current.size, total);
              return `Question ${current}/${total}`;
            })()}
          </p>
          <p className="text-white/60 text-sm">
            {isSpeaking
              ? "Status: Speaking"
              : recording
              ? "Status: Listening"
              : isProcessing
              ? "Status: Processing"
              : "Status: Idle"}
          </p>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          {(() => {
            const total = Math.max(1, questions.length);
            const progress = Math.round(
              (askedSetRef.current.size / total) * 100
            );
            return (
              <div className="progress" style={{ width: `${progress}%` }} />
            );
          })()}
        </div>
      </div>

      <div className="call-view">
        <div className="card-interviewer auth-card p-7">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="ai"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
          {/* AI status chip on the card */}
          <div>
            {isSpeaking ? (
              <span className="px-3 py-1 text-xs rounded-full border border-white/15 bg-white/10 text-white/90 ring-1 ring-primary-200/40 shadow-sm">
                Speaking
              </span>
            ) : isProcessing ? (
              <span className="px-3 py-1 text-xs rounded-full border border-white/15 bg-white/10 text-white/80 shadow-sm">
                Processing
              </span>
            ) : (
              <span className="px-3 py-1 text-xs rounded-full border border-white/10 bg-white/5 text-white/60 shadow-sm">
                Idle
              </span>
            )}
          </div>
        </div>

        <div className="card-border">
          <div className="card-content auth-card p-7">
            <Image
              src="/user-avatar.png"
              alt="me"
              width={539}
              height={539}
              className="rounded-full object-cover size-[120px]"
            />
            <h3>{userName}</h3>
            {/* User status chip on the card */}
            {recording && (
              <span className="px-3 py-1 text-xs rounded-full border border-white/15 bg-white/10 text-white/90 ring-1 ring-primary-200/40 shadow-sm">
                Listening
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Transcript / Status area */}
      {(isSpeaking ||
        displayAssistantText ||
        recording ||
        isProcessing ||
        !hasStarted) && (
        <div className="transcript-border">
          <div className="transcript">
            {!hasStarted ? (
              <p className="animate-fadeIn">
                Hi {userName}, press Start Answer when you're ready. I'll begin
                now.
              </p>
            ) : isSpeaking || displayAssistantText ? (
              <p
                className={cn(
                  "transition-opacity duration-500 opacity-0",
                  "animate-fadeIn opacity-100"
                )}
              >
                {displayAssistantText}
              </p>
            ) : recording ? (
              <p className="animate-fadeIn">Listening...</p>
            ) : isProcessing ? (
              <p className="animate-fadeIn">Processing...</p>
            ) : null}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="w-full flex flex-col items-center gap-3">
        <div className="flex gap-3">
          {!recording ? (
            <button
              className="btn-primary"
              onClick={startRecording}
              disabled={isSpeaking}
            >
              Start Answer
            </button>
          ) : (
            <button className="btn-disconnect" onClick={stopRecording}>
              Stop Answer
            </button>
          )}
          <button className="btn-secondary" onClick={endInterviewNow}>
            End Interview
          </button>
        </div>
      </div>
    </>
  );
}
