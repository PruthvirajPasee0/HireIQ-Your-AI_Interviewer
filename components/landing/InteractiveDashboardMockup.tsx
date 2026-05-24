"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

type TabId =
  | "dashboard"
  | "interviews"
  | "taken"
  | "feedback"
  | "settings";

const SIDEBAR_ITEMS: { id: TabId; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "interviews", label: "Interviews" },
  { id: "taken", label: "Taken Interviews" },
  { id: "feedback", label: "Feedback History" },
  { id: "settings", label: "Settings" },
];

const STATS = [
  {
    label: "Overall Score",
    value: "92/100",
    sub: "+8 from last week",
    color: "text-green-400",
    subColor: "text-green-400/60",
  },
  {
    label: "Total Sessions",
    value: "24",
    sub: "3 this week",
    color: "text-primary-200",
    subColor: "text-primary-200/60",
  },
  {
    label: "Practice Streak",
    value: "7 days",
    sub: "Personal best!",
    color: "text-amber-400",
    subColor: "text-amber-400/60",
  },
  {
    label: "Avg. Feedback",
    value: "4.8/5",
    sub: "Top 5% of users",
    color: "text-violet-400",
    subColor: "text-violet-400/60",
  },
];

const RECENT_INTERVIEWS = [
  {
    role: "Senior Frontend Developer",
    type: "Technical",
    score: 95,
    company: "Google",
    time: "2h ago",
  },
  {
    role: "Product Manager",
    type: "Behavioral",
    score: 88,
    company: "Amazon",
    time: "1d ago",
  },
  {
    role: "Full Stack Engineer",
    type: "Mixed",
    score: 91,
    company: "Netflix",
    time: "3d ago",
  },
];

const SKILLS = [
  { skill: "Communication", pct: 94, color: "bg-blue-400" },
  { skill: "Technical Knowledge", pct: 88, color: "bg-violet-400" },
  { skill: "Problem Solving", pct: 91, color: "bg-emerald-400" },
  { skill: "Cultural Fit", pct: 96, color: "bg-amber-400" },
  { skill: "Confidence", pct: 85, color: "bg-rose-400" },
];

const QUICK_ACTIONS = ["Practice Now", "View Reports", "Tech Stack", "AI Feedback"];

const UPCOMING_INTERVIEWS = [
  { role: "Backend Engineer", company: "Stripe", level: "Senior" },
  { role: "DevOps Specialist", company: "Cloudflare", level: "Mid" },
  { role: "Mobile Engineer", company: "Uber", level: "Senior" },
  { role: "Data Scientist", company: "OpenAI", level: "Staff" },
];

const FEEDBACK_HISTORY = [
  { role: "Senior FE Developer", score: 95, summary: "Excellent communication, deep React knowledge." },
  { role: "Product Manager", score: 88, summary: "Strong product sense; refine prioritization framing." },
  { role: "Full Stack Engineer", score: 91, summary: "Solid system design, brush up on indexing internals." },
];

export default function InteractiveDashboardMockup() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [selectedInterview, setSelectedInterview] = useState<string | null>(null);
  const [practiceClicked, setPracticeClicked] = useState(false);

  const handlePractice = () => {
    setPracticeClicked(true);
    setTimeout(() => setPracticeClicked(false), 1500);
  };

  return (
    <div className="h-full w-full flex flex-col text-[11px] bg-[#07090e] rounded-2xl overflow-hidden border border-white/5">
      {/* Browser chrome */}
      <div className="flex items-center border-b border-white/10 px-4 py-2.5 shrink-0">
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

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Sidebar */}
        <div className="hidden md:flex flex-col w-52 border-r border-white/8 bg-white/[0.02] p-3 gap-1 shrink-0">
          <div className="flex items-center gap-2 px-2 mb-4">
            <Image src="/logo.svg" alt="Hireiq.ai" width={18} height={16} />
            <span className="text-xs font-semibold text-white/80">Hireiq.ai</span>
          </div>

          {SIDEBAR_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setSelectedInterview(null);
                }}
                className={`text-left rounded-lg px-3 py-2 transition cursor-pointer ${
                  isActive
                    ? "bg-primary-200/15 text-primary-200"
                    : "text-white/35 hover:text-white/70 hover:bg-white/[0.04]"
                }`}
              >
                {item.label}
              </button>
            );
          })}

          <div className="mt-auto flex items-center gap-2 rounded-lg bg-white/5 p-2.5">
            <div className="size-7 rounded-full bg-gradient-to-br from-primary-200/60 to-primary-200/20 flex items-center justify-center text-[9px] font-bold text-white">
              P
            </div>
            <div>
              <div className="text-[10px] text-white/70 font-medium">Pruthviraj</div>
              <div className="text-[9px] text-white/30">Pro Plan</div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-4 md:p-5 overflow-y-auto min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              {/* Header (same across tabs) */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold text-white/80">
                    {activeTab === "dashboard" && "Welcome back, Pruthviraj"}
                    {activeTab === "interviews" && "Browse Interviews"}
                    {activeTab === "taken" && "Your Completed Interviews"}
                    {activeTab === "feedback" && "Feedback History"}
                    {activeTab === "settings" && "Settings"}
                  </div>
                  <div className="text-[10px] text-white/30 mt-0.5">
                    {activeTab === "dashboard" && "Here's your interview progress"}
                    {activeTab === "interviews" && "Pick a role to start a practice session"}
                    {activeTab === "taken" && "Review what you've done so far"}
                    {activeTab === "feedback" && "AI-graded results across all sessions"}
                    {activeTab === "settings" && "Manage account and preferences"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-7 px-3 rounded-lg bg-white/5 border border-white/10 flex items-center text-[10px] text-white/40 cursor-text">
                    Search...
                  </div>
                  <button
                    type="button"
                    onClick={handlePractice}
                    className={`h-7 px-3 rounded-lg flex items-center text-[10px] font-semibold transition cursor-pointer ${
                      practiceClicked
                        ? "bg-green-400 text-black"
                        : "bg-primary-200 text-black hover:bg-primary-200/90"
                    }`}
                  >
                    {practiceClicked ? "✓ Starting..." : "+ New Interview"}
                  </button>
                </div>
              </div>

              {/* Dashboard tab */}
              {activeTab === "dashboard" && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
                    {STATS.map((s) => (
                      <div
                        key={s.label}
                        className="rounded-xl border border-white/8 bg-white/[0.03] p-3 hover:bg-white/[0.06] hover:border-white/15 transition cursor-pointer"
                      >
                        <div className="text-[9px] text-white/35 mb-1">{s.label}</div>
                        <div className={`text-base font-bold ${s.color}`}>{s.value}</div>
                        <div className={`text-[9px] mt-0.5 ${s.subColor}`}>{s.sub}</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                    <div className="lg:col-span-3">
                      <div className="text-[10px] text-white/40 mb-2 font-medium">
                        Recent Interviews
                      </div>
                      <div className="space-y-2">
                        {RECENT_INTERVIEWS.map((interview) => {
                          const isSelected = selectedInterview === interview.role;
                          return (
                            <button
                              key={interview.role}
                              type="button"
                              onClick={() =>
                                setSelectedInterview(
                                  isSelected ? null : interview.role,
                                )
                              }
                              className={`w-full text-left flex items-center gap-3 rounded-lg border bg-white/[0.02] p-2.5 transition cursor-pointer ${
                                isSelected
                                  ? "border-primary-200/40 bg-primary-200/[0.06]"
                                  : "border-white/8 hover:border-white/20 hover:bg-white/[0.05]"
                              }`}
                            >
                              <div className="size-8 rounded-lg bg-primary-200/10 border border-primary-200/20 flex items-center justify-center text-[9px] text-primary-200 font-bold shrink-0">
                                {interview.score}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[10px] text-white/70 font-medium truncate">
                                  {interview.role}
                                </div>
                                <div className="text-[9px] text-white/30">
                                  {interview.company} &middot; {interview.type}
                                </div>
                                {isSelected && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="text-[9px] text-white/50 mt-1"
                                  >
                                    Click again to collapse · Score: {interview.score}/100
                                  </motion.div>
                                )}
                              </div>
                              <div className="text-[9px] text-white/20 shrink-0">
                                {interview.time}
                              </div>
                              <div className="h-1.5 w-16 rounded-full bg-white/5 overflow-hidden shrink-0">
                                <div
                                  className="h-full rounded-full bg-green-400/60"
                                  style={{ width: `${interview.score}%` }}
                                />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="lg:col-span-2">
                      <div className="text-[10px] text-white/40 mb-2 font-medium">
                        Skill Breakdown
                      </div>
                      <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3 space-y-2.5">
                        {SKILLS.map((s) => (
                          <div key={s.skill}>
                            <div className="flex justify-between mb-1">
                              <span className="text-[9px] text-white/40">{s.skill}</span>
                              <span className="text-[9px] text-white/60 font-medium">
                                {s.pct}%
                              </span>
                            </div>
                            <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${s.color}/50`}
                                style={{ width: `${s.pct}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="text-[10px] text-white/40 mt-3 mb-2 font-medium">
                        Quick Actions
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {QUICK_ACTIONS.map((action) => (
                          <button
                            key={action}
                            type="button"
                            onClick={handlePractice}
                            className="rounded-lg border border-white/8 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20 px-2.5 py-2 text-center text-[9px] text-white/40 hover:text-white/80 transition cursor-pointer"
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Interviews tab */}
              {activeTab === "interviews" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {UPCOMING_INTERVIEWS.map((i) => (
                    <button
                      key={i.role}
                      type="button"
                      onClick={handlePractice}
                      className="rounded-xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.07] hover:border-primary-200/40 p-4 text-left transition cursor-pointer group"
                    >
                      <div className="text-[11px] font-semibold text-white/85 group-hover:text-primary-200 transition">
                        {i.role}
                      </div>
                      <div className="text-[10px] text-white/40 mt-1">
                        {i.company} · {i.level}
                      </div>
                      <div className="text-[9px] text-primary-200/70 mt-3 group-hover:text-primary-200 transition">
                        Start practice →
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Taken tab */}
              {activeTab === "taken" && (
                <div className="space-y-2">
                  {RECENT_INTERVIEWS.map((interview) => (
                    <div
                      key={interview.role}
                      className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.02] hover:bg-white/[0.05] p-3 transition cursor-pointer"
                    >
                      <div className="size-9 rounded-lg bg-primary-200/10 border border-primary-200/20 flex items-center justify-center text-[10px] text-primary-200 font-bold shrink-0">
                        {interview.score}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] text-white/75 font-medium">
                          {interview.role}
                        </div>
                        <div className="text-[10px] text-white/35">
                          {interview.company} · {interview.type} · {interview.time}
                        </div>
                      </div>
                      <div className="text-[10px] text-primary-200/80">View feedback →</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Feedback tab */}
              {activeTab === "feedback" && (
                <div className="space-y-2.5">
                  {FEEDBACK_HISTORY.map((f) => (
                    <div
                      key={f.role}
                      className="rounded-xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.05] p-3.5 transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-[11px] text-white/80 font-medium">{f.role}</div>
                        <div className="text-[10px] text-green-400 font-semibold">
                          {f.score}/100
                        </div>
                      </div>
                      <div className="text-[10px] text-white/50 leading-relaxed">
                        {f.summary}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Settings tab */}
              {activeTab === "settings" && (
                <div className="space-y-2">
                  {[
                    { k: "Email notifications", v: "Enabled" },
                    { k: "Default question count", v: "8" },
                    { k: "Preferred AI voice", v: "Odysseus (warm, male)" },
                    { k: "Resume on file", v: "pruthviraj_resume.pdf" },
                    { k: "Plan", v: "Pro · renews 2026-06-25" },
                  ].map((row) => (
                    <div
                      key={row.k}
                      className="flex items-center justify-between rounded-lg border border-white/8 bg-white/[0.02] hover:bg-white/[0.05] px-3 py-2.5 transition cursor-pointer"
                    >
                      <span className="text-[10px] text-white/55">{row.k}</span>
                      <span className="text-[10px] text-white/80">{row.v}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
