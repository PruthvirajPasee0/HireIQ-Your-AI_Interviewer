"use client";

import FlowArt, { FlowSection } from "@/components/ui/story-scroll";

const HEADLINE_CLS =
  "text-[clamp(3.5rem,12vw,14rem)] font-bold leading-[0.85] uppercase tracking-tight";
const STEP_LABEL_CLS = "text-xs font-bold uppercase tracking-[0.2em]";
const BODY_CLS =
  "max-w-[50ch] text-[clamp(1rem,2.5vw,2rem)] font-normal leading-relaxed";

const COLORS = {
  intro: { bg: "#0A0F1F", text: "#ffffff", rule: "rgba(255,255,255,0.4)" },
  pick: { bg: "#3B1E8E", text: "#ffffff", rule: "rgba(255,255,255,0.4)" },
  practice: { bg: "#0EA5E9", text: "#0A0F1F", rule: "rgba(10,15,31,0.4)" },
  feedback: { bg: "#F59E0B", text: "#0A0F1F", rule: "rgba(10,15,31,0.4)" },
};

export default function HowItWorksSection() {
  return (
    <section id="how-it-works">
      <FlowArt aria-label="How Hireiq.ai works">
        <FlowSection
          aria-label="How it works intro"
          style={{ backgroundColor: COLORS.intro.bg, color: COLORS.intro.text }}
        >
          <p className={STEP_LABEL_CLS}>How it works</p>
          <hr
            className="my-[2vw] border-none border-t"
            style={{ borderColor: COLORS.intro.rule }}
          />
          <div>
            <h2 className={HEADLINE_CLS}>
              Three
              <br />
              Steps
              <br />
              To Success
            </h2>
          </div>
          <hr
            className="my-[2vw] border-none border-t"
            style={{ borderColor: COLORS.intro.rule }}
          />
          <p className={`${BODY_CLS} mt-auto`}>
            From job-targeted question generation to a live AI interviewer in
            Google Meet and auto-graded feedback. Built for recruiters and
            candidates alike.
          </p>
        </FlowSection>

        <FlowSection
          aria-label="Step 1 — Choose your interview"
          style={{ backgroundColor: COLORS.pick.bg, color: COLORS.pick.text }}
        >
          <p className={STEP_LABEL_CLS}>01 — Choose your interview</p>
          <hr
            className="my-[2vw] border-none border-t"
            style={{ borderColor: COLORS.pick.rule }}
          />
          <div>
            <h2 className={HEADLINE_CLS}>
              Pick
              <br />
              The
              <br />
              Role
            </h2>
          </div>
          <hr
            className="my-[2vw] border-none border-t"
            style={{ borderColor: COLORS.pick.rule }}
          />
          <p className={BODY_CLS}>
            Select target role, level, and tech stack. The AI builds a custom
            interview — and reads a resume if you upload one.
          </p>
          <hr
            className="my-[2vw] border-none border-t"
            style={{ borderColor: COLORS.pick.rule }}
          />
          <div className="flex flex-wrap gap-[3vw]">
            <div className="min-w-[180px] flex-1">
              <p className="mb-2 text-sm font-bold uppercase tracking-wider">
                Role-aware
              </p>
              <p className="text-[clamp(0.85rem,1.3vw,1.05rem)] leading-relaxed opacity-75">
                Senior FE? Staff Backend? Data Science? Questions tuned to your
                level and stack.
              </p>
            </div>
            <div className="min-w-[180px] flex-1">
              <p className="mb-2 text-sm font-bold uppercase tracking-wider">
                Resume-tailored
              </p>
              <p className="text-[clamp(0.85rem,1.3vw,1.05rem)] leading-relaxed opacity-75">
                Drop in a PDF — Gemini reads it and probes the candidate&apos;s
                real projects.
              </p>
            </div>
            <div className="min-w-[180px] flex-1">
              <p className="mb-2 text-sm font-bold uppercase tracking-wider">
                Reusable agents
              </p>
              <p className="text-[clamp(0.85rem,1.3vw,1.05rem)] leading-relaxed opacity-75">
                Recruiters create personas once, pair them with any candidate.
              </p>
            </div>
          </div>
        </FlowSection>

        <FlowSection
          aria-label="Step 2 — Practice with AI"
          style={{
            backgroundColor: COLORS.practice.bg,
            color: COLORS.practice.text,
          }}
        >
          <p className={STEP_LABEL_CLS}>02 — Practice with AI</p>
          <hr
            className="my-[2vw] border-none border-t"
            style={{ borderColor: COLORS.practice.rule }}
          />
          <div>
            <h2 className={HEADLINE_CLS}>
              Talk
              <br />
              To The
              <br />
              AI
            </h2>
          </div>
          <hr
            className="my-[2vw] border-none border-t"
            style={{ borderColor: COLORS.practice.rule }}
          />
          <p className={BODY_CLS}>
            Real-time voice conversation — solo practice OR live in Google Meet
            with a recruiter steering the session.
          </p>
          <hr
            className="my-[2vw] border-none border-t"
            style={{ borderColor: COLORS.practice.rule }}
          />
          <div className="flex flex-wrap gap-[3vw]">
            <div className="min-w-[180px] flex-1">
              <p className="mb-2 text-sm font-bold uppercase tracking-wider">
                Natural voice
              </p>
              <p className="text-[clamp(0.85rem,1.3vw,1.05rem)] leading-relaxed opacity-75">
                Deepgram aura-2 voices feel human. Pick one per agent.
              </p>
            </div>
            <div className="min-w-[180px] flex-1">
              <p className="mb-2 text-sm font-bold uppercase tracking-wider">
                Live in Meet
              </p>
              <p className="text-[clamp(0.85rem,1.3vw,1.05rem)] leading-relaxed opacity-75">
                The bot joins your Google Meet, asks, listens, adapts.
              </p>
            </div>
            <div className="min-w-[180px] flex-1">
              <p className="mb-2 text-sm font-bold uppercase tracking-wider">
                Recruiter override
              </p>
              <p className="text-[clamp(0.85rem,1.3vw,1.05rem)] leading-relaxed opacity-75">
                Skip, inject a custom question, or just speak — the AI follows
                your lead.
              </p>
            </div>
          </div>
        </FlowSection>

        <FlowSection
          aria-label="Step 3 — Get feedback and improve"
          style={{
            backgroundColor: COLORS.feedback.bg,
            color: COLORS.feedback.text,
          }}
        >
          <p className={STEP_LABEL_CLS}>03 — Get feedback &amp; improve</p>
          <hr
            className="my-[2vw] border-none border-t"
            style={{ borderColor: COLORS.feedback.rule }}
          />
          <div>
            <h2 className={HEADLINE_CLS}>
              Score
              <br />
              And
              <br />
              Improve
            </h2>
          </div>
          <hr
            className="my-[2vw] border-none border-t"
            style={{ borderColor: COLORS.feedback.rule }}
          />
          <p className={BODY_CLS}>
            Detailed scorecard with actionable feedback in seconds. Track your
            progress and practice again — or share the report with your hiring
            team.
          </p>
          <hr
            className="my-[2vw] border-none border-t"
            style={{ borderColor: COLORS.feedback.rule }}
          />
          <div className="flex flex-wrap gap-[3vw]">
            <div className="min-w-[140px] flex-1">
              <p className="mb-2 text-sm font-bold uppercase tracking-wider">
                10,000+
              </p>
              <p className="text-[clamp(0.85rem,1.3vw,1.05rem)] leading-relaxed opacity-75">
                Practice interviews completed.
              </p>
            </div>
            <div className="min-w-[140px] flex-1">
              <p className="mb-2 text-sm font-bold uppercase tracking-wider">
                95%
              </p>
              <p className="text-[clamp(0.85rem,1.3vw,1.05rem)] leading-relaxed opacity-75">
                Candidate satisfaction across sessions.
              </p>
            </div>
            <div className="min-w-[140px] flex-1">
              <p className="mb-2 text-sm font-bold uppercase tracking-wider">
                500+
              </p>
              <p className="text-[clamp(0.85rem,1.3vw,1.05rem)] leading-relaxed opacity-75">
                Companies represented in our user base.
              </p>
            </div>
            <div className="min-w-[140px] flex-1">
              <p className="mb-2 text-sm font-bold uppercase tracking-wider">
                4.9 / 5
              </p>
              <p className="text-[clamp(0.85rem,1.3vw,1.05rem)] leading-relaxed opacity-75">
                Average user rating.
              </p>
            </div>
          </div>
        </FlowSection>
      </FlowArt>
    </section>
  );
}
