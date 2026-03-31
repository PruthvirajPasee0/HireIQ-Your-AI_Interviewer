"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { ShaderAnimation } from "@/components/ui/shader-animation";

const COMPANY_LOGOS = [
  { src: "/covers/google.png", alt: "Google" },
  { src: "/covers/amazon.png", alt: "Amazon" },
  { src: "/covers/netflix.png", alt: "Netflix" },
  { src: "/covers/adobe.png", alt: "Adobe" },
  { src: "/covers/facebook.png", alt: "Facebook" },
  { src: "/covers/spotify.png", alt: "Spotify" },
  { src: "/covers/cisco.png", alt: "Cisco" },
  { src: "/covers/walmart.png", alt: "Walmart" },
  { src: "/covers/reddit.png", alt: "Reddit" },
  { src: "/covers/pinterest.png", alt: "Pinterest" },
  { src: "/covers/yahoo.png", alt: "Yahoo" },
  { src: "/covers/tiktok.png", alt: "TikTok" },
];

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(12px)",
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring",
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
};

export default function HeroSection() {
  return (
    <section className="overflow-hidden">
      {/* ═══ TEXT SECTION — with shader backdrop ═══ */}
      <div className="relative">
        {/* Shader background — only behind text area */}
        <div className="absolute inset-0 z-0">
          <ShaderAnimation />
          <div className="absolute inset-0 bg-black/60" />
        </div>

        {/* Decorative light rays */}
        <div
          aria-hidden
          className="z-[2] absolute inset-0 pointer-events-none isolate opacity-40 contain-strict hidden lg:block"
        >
          <div className="w-[35rem] h-[80rem] -translate-y-[350px] absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
          <div className="h-[80rem] absolute left-0 top-0 w-56 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
        </div>

        <div className="relative z-10 pt-24 md:pt-36 pb-16 md:pb-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center">
              {/* Badge + Headline + Subtitle */}
              <AnimatedGroup variants={transitionVariants}>
                <Link
                  href="/sign-up"
                  className="group mx-auto flex w-fit items-center gap-4 rounded-full border border-white/10 bg-white/5 p-1 pl-4 shadow-md backdrop-blur-sm transition-all duration-300 hover:bg-white/10"
                >
                  <span className="text-sm text-white/80">
                    AI-Powered Interview Preparation
                  </span>
                  <span className="block h-4 w-0.5 bg-white/20" />
                  <div className="size-6 overflow-hidden rounded-full bg-white/10 duration-500 group-hover:bg-white/20">
                    <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                      <span className="flex size-6">
                        <ArrowRight className="m-auto size-3 text-white" />
                      </span>
                      <span className="flex size-6">
                        <ArrowRight className="m-auto size-3 text-white" />
                      </span>
                    </div>
                  </div>
                </Link>

                <h1 className="mt-8 max-w-4xl mx-auto text-balance text-5xl font-bold tracking-tight text-white md:text-6xl lg:mt-16 xl:text-[5.25rem] xl:leading-[1.05]">
                  Ace Every Interview with{" "}
                  <span className="text-primary-200">AI-Powered</span> Practice
                </h1>

                <p className="mx-auto mt-8 max-w-2xl text-balance text-lg text-white/55">
                  Practice real interview questions with our AI interviewer, get
                  instant detailed feedback, and track your progress. Land your
                  dream job with confidence.
                </p>
              </AnimatedGroup>

              {/* CTA Buttons */}
              <AnimatedGroup
                variants={{
                  container: {
                    visible: {
                      transition: {
                        staggerChildren: 0.05,
                        delayChildren: 0.75,
                      },
                    },
                  },
                  ...transitionVariants,
                }}
                className="mt-12 flex flex-col items-center justify-center gap-2 md:flex-row"
              >
                <div className="rounded-[14px] border border-white/10 bg-white/5 p-0.5">
                  <Button
                    asChild
                    size="lg"
                    className="rounded-xl bg-white px-5 text-base text-black font-semibold hover:bg-white/90"
                  >
                    <Link href="/sign-up">
                      <span className="text-nowrap">Start Free Practice</span>
                    </Link>
                  </Button>
                </div>
                <Button
                  asChild
                  size="lg"
                  variant="ghost"
                  className="h-10.5 rounded-xl px-5 text-white/70 hover:text-white hover:bg-white/10"
                >
                  <Link href="#how-it-works">
                    <span className="text-nowrap">See How It Works</span>
                  </Link>
                </Button>
              </AnimatedGroup>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ DASHBOARD PREVIEW — detailed mockup, NO shader ═══ */}
      <div className="relative bg-black">
        <AnimatedGroup
          variants={{
            container: {
              visible: {
                transition: { staggerChildren: 0.05, delayChildren: 0.75 },
              },
            },
            ...transitionVariants,
          }}
        >
          <div className="relative -mr-56 overflow-hidden px-2 sm:mr-0 pt-4 pb-8">
            <div
              aria-hidden
              className="absolute inset-0 z-10 bg-gradient-to-b from-transparent from-35% to-black pointer-events-none"
            />
            <div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4 shadow-2xl shadow-primary-200/5">
              <div className="aspect-[16/9] relative rounded-xl overflow-hidden bg-[#07090e] border border-white/5">
                <div className="absolute inset-0 flex flex-col text-[11px]">
                  {/* Browser chrome */}
                  <div className="flex items-center border-b border-white/10 px-4 py-2.5">
                    <div className="flex gap-1.5 mr-4">
                      <div className="size-2.5 rounded-full bg-[#ff5f57]" />
                      <div className="size-2.5 rounded-full bg-[#febc2e]" />
                      <div className="size-2.5 rounded-full bg-[#28c840]" />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="flex items-center gap-2 bg-white/5 rounded-lg px-4 py-1 max-w-xs w-full">
                        <div className="size-3 rounded bg-white/10" />
                        <span className="text-[10px] text-white/35">hireiq.ai/dashboard</span>
                      </div>
                    </div>
                    <div className="w-16" />
                  </div>

                  <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className="hidden md:flex flex-col w-52 border-r border-white/8 bg-white/[0.02] p-3 gap-1">
                      <div className="flex items-center gap-2 px-2 mb-4">
                        <Image src="/logo.svg" alt="Hireiq.ai" width={18} height={16} />
                        <span className="text-xs font-semibold text-white/80">Hireiq.ai</span>
                      </div>
                      {[
                        { label: "Dashboard", active: true },
                        { label: "Interviews", active: false },
                        { label: "Taken Interviews", active: false },
                        { label: "Feedback History", active: false },
                        { label: "Settings", active: false },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className={`rounded-lg px-3 py-2 ${
                            item.active
                              ? "bg-primary-200/15 text-primary-200"
                              : "text-white/35 hover:text-white/50"
                          }`}
                        >
                          {item.label}
                        </div>
                      ))}
                      {/* User card at bottom */}
                      <div className="mt-auto flex items-center gap-2 rounded-lg bg-white/5 p-2.5">
                        <div className="size-7 rounded-full bg-gradient-to-br from-primary-200/60 to-primary-200/20 flex items-center justify-center text-[9px] font-bold text-white">P</div>
                        <div>
                          <div className="text-[10px] text-white/70 font-medium">Pruthviraj</div>
                          <div className="text-[9px] text-white/30">Pro Plan</div>
                        </div>
                      </div>
                    </div>

                    {/* Main content */}
                    <div className="flex-1 p-4 md:p-5 overflow-hidden">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="text-sm font-semibold text-white/80">Welcome back, Pruthviraj</div>
                          <div className="text-[10px] text-white/30 mt-0.5">Here&apos;s your interview progress</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-7 px-3 rounded-lg bg-white/5 border border-white/10 flex items-center text-[10px] text-white/40">Search...</div>
                          <div className="h-7 px-3 rounded-lg bg-primary-200 flex items-center text-[10px] text-black font-semibold">+ New Interview</div>
                        </div>
                      </div>

                      {/* Stats row */}
                      <div className="grid grid-cols-4 gap-2.5 mb-4">
                        {[
                          { label: "Overall Score", value: "92/100", sub: "+8 from last week", color: "text-green-400", subColor: "text-green-400/60" },
                          { label: "Total Sessions", value: "24", sub: "3 this week", color: "text-primary-200", subColor: "text-primary-200/60" },
                          { label: "Practice Streak", value: "7 days", sub: "Personal best!", color: "text-amber-400", subColor: "text-amber-400/60" },
                          { label: "Avg. Feedback", value: "4.8/5", sub: "Top 5% of users", color: "text-violet-400", subColor: "text-violet-400/60" },
                        ].map((s) => (
                          <div key={s.label} className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                            <div className="text-[9px] text-white/35 mb-1">{s.label}</div>
                            <div className={`text-base font-bold ${s.color}`}>{s.value}</div>
                            <div className={`text-[9px] mt-0.5 ${s.subColor}`}>{s.sub}</div>
                          </div>
                        ))}
                      </div>

                      {/* Two-column layout */}
                      <div className="grid grid-cols-5 gap-3">
                        {/* Recent interviews */}
                        <div className="col-span-3">
                          <div className="text-[10px] text-white/40 mb-2 font-medium">Recent Interviews</div>
                          <div className="space-y-2">
                            {[
                              { role: "Senior Frontend Developer", type: "Technical", score: 95, company: "Google", time: "2h ago" },
                              { role: "Product Manager", type: "Behavioral", score: 88, company: "Amazon", time: "1d ago" },
                              { role: "Full Stack Engineer", type: "Mixed", score: 91, company: "Netflix", time: "3d ago" },
                            ].map((interview) => (
                              <div key={interview.role} className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.02] p-2.5">
                                <div className="size-8 rounded-lg bg-primary-200/10 border border-primary-200/20 flex items-center justify-center text-[9px] text-primary-200 font-bold shrink-0">
                                  {interview.score}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[10px] text-white/70 font-medium truncate">{interview.role}</div>
                                  <div className="text-[9px] text-white/30">{interview.company} &middot; {interview.type}</div>
                                </div>
                                <div className="text-[9px] text-white/20 shrink-0">{interview.time}</div>
                                <div className="h-1.5 w-16 rounded-full bg-white/5 overflow-hidden shrink-0">
                                  <div className="h-full rounded-full bg-green-400/60" style={{ width: `${interview.score}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Sidebar stats */}
                        <div className="col-span-2">
                          <div className="text-[10px] text-white/40 mb-2 font-medium">Skill Breakdown</div>
                          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3 space-y-2.5">
                            {[
                              { skill: "Communication", pct: 94, color: "bg-blue-400" },
                              { skill: "Technical Knowledge", pct: 88, color: "bg-violet-400" },
                              { skill: "Problem Solving", pct: 91, color: "bg-emerald-400" },
                              { skill: "Cultural Fit", pct: 96, color: "bg-amber-400" },
                              { skill: "Confidence", pct: 85, color: "bg-rose-400" },
                            ].map((s) => (
                              <div key={s.skill}>
                                <div className="flex justify-between mb-1">
                                  <span className="text-[9px] text-white/40">{s.skill}</span>
                                  <span className="text-[9px] text-white/60 font-medium">{s.pct}%</span>
                                </div>
                                <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                                  <div className={`h-full rounded-full ${s.color}/50`} style={{ width: `${s.pct}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="text-[10px] text-white/40 mt-3 mb-2 font-medium">Quick Actions</div>
                          <div className="grid grid-cols-2 gap-2">
                            {["Practice Now", "View Reports", "Tech Stack", "AI Feedback"].map((action) => (
                              <div key={action} className="rounded-lg border border-white/8 bg-white/[0.02] px-2.5 py-2 text-center text-[9px] text-white/40">
                                {action}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedGroup>
      </div>

      {/* ═══ TRUSTED BY — infinite carousel, NO shader ═══ */}
      <div className="relative bg-black py-16 md:py-24 overflow-hidden">
        <p className="text-center text-sm text-white/30 uppercase tracking-widest mb-10 px-6">
          Trusted by candidates at top companies
        </p>

        {/* Carousel track */}
        <div className="relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

          <div className="flex animate-logo-scroll gap-16 md:gap-20 w-max">
            {[...COMPANY_LOGOS, ...COMPANY_LOGOS].map((logo, i) => (
              <div
                key={`${logo.alt}-${i}`}
                className="flex-shrink-0 flex items-center justify-center h-12 grayscale opacity-40 hover:grayscale-0 hover:opacity-90 transition-all duration-300"
              >
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={120}
                  height={48}
                  className="object-contain h-10 w-auto"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
