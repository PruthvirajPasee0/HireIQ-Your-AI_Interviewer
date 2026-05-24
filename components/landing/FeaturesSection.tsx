"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Mic,
  Calendar,
  FileText,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function FeaturesSection() {
  return (
    <section id="features" className="relative bg-black py-20 md:py-32">
      {/* Section header */}
      <div className="text-center mb-16 px-6">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-sm text-primary-200 font-medium uppercase tracking-widest mb-4"
        >
          [ CAPABILITIES ]
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
          style={{
            background:
              "linear-gradient(to bottom, #ffffff, #ffffff, rgba(255,255,255,0.6))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "-0.03em",
          }}
        >
          Everything you need to ace interviews
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-white/55 text-lg max-w-2xl mx-auto"
        >
          From resume-tailored questions to a live AI interviewer in Google
          Meet — every part of the loop is automated.
        </motion.p>
      </div>

      {/* Feature grid */}
      <div className="mx-auto max-w-2xl px-6 lg:max-w-6xl">
        <div className="mx-auto grid gap-4 lg:grid-cols-2">
          {/* Card 1 — AI-generated questions */}
          <FeatureCard>
            <CardHeader className="pb-3">
              <CardHeading
                icon={FileText}
                title="Resume-tailored questions"
                description="Drop in a PDF — Gemini reads it and writes 5–20 interview questions referencing the candidate's real projects."
              />
            </CardHeader>

            <div className="relative mb-6 border-t border-dashed border-white/10 sm:mb-0">
              <div className="absolute inset-0 [background:radial-gradient(125%_125%_at_50%_0%,transparent_40%,rgba(255,255,255,0.04),transparent_125%)]" />
              <div className="aspect-[76/45] p-1 px-6 flex items-center justify-center">
                <ResumeMock />
              </div>
            </div>
          </FeatureCard>

          {/* Card 2 — Live AI in Meet */}
          <FeatureCard>
            <CardHeader className="pb-3">
              <CardHeading
                icon={Mic}
                title="Live AI interviewer in Meet"
                description="The bot joins your Google Meet, speaks the questions, listens, and adapts when you interject."
              />
            </CardHeader>

            <CardContent>
              <div className="relative mb-6 sm:mb-0">
                <div className="absolute -inset-6 [background:radial-gradient(50%_50%_at_75%_50%,transparent,rgba(0,0,0,0.6)_100%)]" />
                <div className="aspect-[76/45] border border-white/10 rounded-lg overflow-hidden">
                  <LiveBotMock />
                </div>
              </div>
            </CardContent>
          </FeatureCard>

          {/* Card 3 — wide: feedback breakdown */}
          <FeatureCard className="p-6 lg:col-span-2">
            <p className="mx-auto my-6 max-w-md text-balance text-center text-2xl font-semibold text-white">
              Auto-graded feedback across the categories that matter.
            </p>

            <div className="flex justify-center gap-6 overflow-hidden">
              <CircularUI
                label="Communication"
                circles={[{ pattern: "border" }, { pattern: "border" }]}
              />
              <CircularUI
                label="Technical"
                circles={[{ pattern: "none" }, { pattern: "primary" }]}
              />
              <CircularUI
                label="Problem-Solving"
                circles={[{ pattern: "blue" }, { pattern: "none" }]}
              />
              <CircularUI
                label="Cultural Fit"
                circles={[{ pattern: "primary" }, { pattern: "none" }]}
                className="hidden sm:block"
              />
              <CircularUI
                label="Confidence"
                circles={[{ pattern: "border" }, { pattern: "primary" }]}
                className="hidden md:block"
              />
            </div>
          </FeatureCard>

          {/* Card 4 — schedule */}
          <FeatureCard>
            <CardHeader className="pb-3">
              <CardHeading
                icon={Calendar}
                title="One-click scheduling"
                description="Paste a Meet link, pick an agent, send the candidate an invite — done in under a minute."
              />
            </CardHeader>

            <CardContent>
              <div className="relative mb-6 sm:mb-0">
                <div className="aspect-[76/45] border border-white/10 rounded-lg overflow-hidden">
                  <SchedulerMock />
                </div>
              </div>
            </CardContent>
          </FeatureCard>

          {/* Card 5 — reusable agents */}
          <FeatureCard>
            <CardHeader className="pb-3">
              <CardHeading
                icon={Users}
                title="Reusable interviewer agents"
                description="Create a persona once — voice, question bank, target role — and pair it with any candidate."
              />
            </CardHeader>

            <CardContent>
              <div className="relative mb-6 sm:mb-0">
                <div className="aspect-[76/45] border border-white/10 rounded-lg overflow-hidden">
                  <AgentMock />
                </div>
              </div>
            </CardContent>
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  children: ReactNode;
  className?: string;
}

const FeatureCard = ({ children, className }: FeatureCardProps) => (
  <Card
    className={cn(
      // Dark glass surface
      "group relative rounded-none border-white/10 bg-white/[0.02] text-white shadow-zinc-950/5 transition-colors duration-500 overflow-hidden",
      className,
    )}
  >
    {/* Bright blue radial hover gradient */}
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      style={{
        background:
          "radial-gradient(120% 90% at 50% 0%, rgba(125, 211, 252, 0.85) 0%, rgba(56, 189, 248, 0.7) 18%, rgba(37, 99, 235, 0.55) 38%, rgba(15, 23, 42, 0) 75%)",
      }}
    />
    {/* SVG fractal-noise grain — true film-grain look */}
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-80 transition-opacity duration-500 mix-blend-overlay"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        backgroundSize: "180px 180px",
      }}
    />
    {/* Fine dotted halftone — small tight dots */}
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-55 transition-opacity duration-500 mix-blend-soft-light"
      style={{
        backgroundImage:
          "radial-gradient(rgba(255,255,255,0.32) 0.6px, transparent 0.8px)",
        backgroundSize: "3px 3px",
      }}
    />
    <CardDecorator />
    <div className="relative z-10">{children}</div>
  </Card>
);

const CardDecorator = () => (
  <>
    <span className="border-primary-200 absolute -left-px -top-px z-20 block size-2 border-l-2 border-t-2" />
    <span className="border-primary-200 absolute -right-px -top-px z-20 block size-2 border-r-2 border-t-2" />
    <span className="border-primary-200 absolute -bottom-px -left-px z-20 block size-2 border-b-2 border-l-2" />
    <span className="border-primary-200 absolute -bottom-px -right-px z-20 block size-2 border-b-2 border-r-2" />
  </>
);

interface CardHeadingProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const CardHeading = ({ icon: Icon, title, description }: CardHeadingProps) => (
  <div className="p-6">
    <span className="text-white/55 flex items-center gap-2 text-sm">
      <Icon className="size-4" />
      {title}
    </span>
    <p className="mt-8 text-2xl font-semibold text-white">{description}</p>
  </div>
);

interface CircleConfig {
  pattern: "none" | "border" | "primary" | "blue";
}

interface CircularUIProps {
  label: string;
  circles: CircleConfig[];
  className?: string;
}

const CircularUI = ({ label, circles, className }: CircularUIProps) => (
  <div className={className}>
    <div className="bg-gradient-to-b from-white/15 size-fit rounded-2xl to-transparent p-px">
      <div className="bg-gradient-to-b from-zinc-900 to-zinc-900/40 relative flex aspect-square w-fit items-center -space-x-4 rounded-[15px] p-4">
        {circles.map((circle, i) => (
          <div
            key={i}
            className={cn("size-7 rounded-full border sm:size-8", {
              "border-primary-200": circle.pattern === "none",
              "border-white/40 bg-[repeating-linear-gradient(-45deg,rgba(255,255,255,0.15),rgba(255,255,255,0.15)_1px,transparent_1px,transparent_4px)]":
                circle.pattern === "border",
              "border-primary-200 bg-zinc-900 bg-[repeating-linear-gradient(-45deg,rgba(167,243,208,0.45),rgba(167,243,208,0.45)_1px,transparent_1px,transparent_4px)]":
                circle.pattern === "primary",
              "z-1 bg-zinc-900 border-blue-500 bg-[repeating-linear-gradient(-45deg,#3b82f6,#3b82f6_1px,transparent_1px,transparent_4px)]":
                circle.pattern === "blue",
            })}
          />
        ))}
      </div>
    </div>
    <span className="text-white/55 mt-1.5 block text-center text-xs">
      {label}
    </span>
  </div>
);

/* --- Tiny inline mocks (no external images) --- */

function ResumeMock() {
  return (
    <div className="w-full h-full grid grid-cols-[1fr_1.2fr] gap-2 text-[8px]">
      <div className="rounded border border-white/10 bg-white/[0.03] p-2 flex flex-col gap-1">
        <div className="flex items-center gap-1 text-white/50">
          <FileText className="size-2.5" /> jane_doe_resume.pdf
        </div>
        <div className="h-1 w-3/4 rounded bg-white/15" />
        <div className="h-1 w-2/3 rounded bg-white/10" />
        <div className="h-1 w-1/2 rounded bg-white/10" />
        <div className="h-1 w-3/4 rounded bg-white/10" />
        <div className="h-1 w-1/2 rounded bg-white/10" />
        <div className="h-1 w-2/3 rounded bg-white/10" />
      </div>
      <div className="rounded border border-primary-200/30 bg-primary-200/[0.05] p-2 flex flex-col gap-1">
        <div className="flex items-center gap-1 text-primary-200">
          <Sparkles className="size-2.5" /> AI questions
        </div>
        {[
          "Tell me about your fintech work",
          "Walk me through the deadlock fix",
          "How do you design at scale?",
          "Strongest tech and why?",
          "Hardest bug you fixed",
        ].map((q, i) => (
          <div
            key={i}
            className="flex items-start gap-1 text-white/70 leading-tight"
          >
            <span className="text-primary-200 shrink-0">{i + 1}.</span>
            <span className="truncate">{q}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveBotMock() {
  return (
    <div className="w-full h-full bg-zinc-900 p-2 flex flex-col gap-1.5 text-[8px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-white/60">
          <Mic className="size-2.5 text-red-400" /> LIVE · Q3 of 8
        </div>
        <span className="text-[7px] text-white/30">meet.google.com/abc-...</span>
      </div>
      <div className="flex-1 flex flex-col gap-1 overflow-hidden">
        <div className="text-indigo-300">
          <span className="text-[7px] uppercase">AI</span>
          <p>Walk me through how you&apos;d design a URL shortener at scale.</p>
        </div>
        <div className="text-white/80">
          <span className="text-[7px] uppercase text-white/40">Candidate</span>
          <p>Sure. I&apos;d start with base62 encoding and shard by hash...</p>
        </div>
      </div>
      <div className="flex gap-1">
        <div className="text-[7px] rounded bg-white/10 px-1.5 py-0.5">Skip</div>
        <div className="text-[7px] rounded bg-amber-500 text-black px-1.5 py-0.5">
          Inject
        </div>
        <div className="text-[7px] rounded bg-red-500 text-white px-1.5 py-0.5">
          End
        </div>
      </div>
    </div>
  );
}

function SchedulerMock() {
  return (
    <div className="w-full h-full bg-zinc-900 p-2 flex flex-col gap-1 text-[8px]">
      <div className="flex items-center gap-1 text-white/60">
        <Calendar className="size-2.5" /> Schedule interview
      </div>
      {[
        { k: "Agent", v: "Senior FE Screen" },
        { k: "Candidate", v: "Jane Doe" },
        { k: "Meet link", v: "meet.google.com/..." },
        { k: "Time", v: "Today, 3:30 PM" },
      ].map((row) => (
        <div
          key={row.k}
          className="flex justify-between rounded bg-white/[0.03] border border-white/10 px-1.5 py-1"
        >
          <span className="text-white/40">{row.k}</span>
          <span className="text-white/80 truncate ml-2">{row.v}</span>
        </div>
      ))}
      <div className="mt-auto text-center bg-primary-200 text-black font-semibold rounded py-1">
        Schedule interview
      </div>
    </div>
  );
}

function AgentMock() {
  return (
    <div className="w-full h-full bg-zinc-900 p-2 grid grid-cols-2 gap-1.5 text-[8px]">
      {[
        { name: "FE Senior Screen", voice: "Odysseus", q: 8 },
        { name: "PM Behavioral", voice: "Thalia", q: 6 },
        { name: "Data Mid Screen", voice: "Helena", q: 10 },
        { name: "Backend Staff", voice: "Zeus", q: 12 },
      ].map((a, i) => (
        <div
          key={i}
          className="rounded border border-white/10 bg-white/[0.03] p-1.5 flex flex-col gap-0.5"
        >
          <div className="flex items-center gap-1">
            <Brain className="size-2.5 text-primary-200" />
            <span className="text-white/85 font-medium truncate">
              {a.name}
            </span>
          </div>
          <div className="text-white/40">
            voice: {a.voice} · {a.q} Qs
          </div>
        </div>
      ))}
    </div>
  );
}
