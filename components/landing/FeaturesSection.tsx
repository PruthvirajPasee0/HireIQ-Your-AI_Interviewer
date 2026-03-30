"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, Mic, MessageSquareText, TrendingUp } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: Brain,
    title: "AI-Powered Questions",
    description:
      "Get tailored interview questions based on your target role, tech stack, and experience level.",
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  {
    icon: Mic,
    title: "Real-Time Voice Interview",
    description:
      "Practice with our AI interviewer in real-time voice conversations, just like a real interview.",
    gradient: "from-violet-500/20 to-purple-500/20",
  },
  {
    icon: MessageSquareText,
    title: "Instant Feedback",
    description:
      "Receive detailed feedback with scores, strengths, and areas for improvement after each session.",
    gradient: "from-emerald-500/20 to-green-500/20",
  },
  {
    icon: TrendingUp,
    title: "Track Your Progress",
    description:
      "Monitor your performance over time and see how you improve with each practice session.",
    gradient: "from-orange-500/20 to-amber-500/20",
  },
];

export default function FeaturesSection() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".feature-card", {
        y: 60,
        opacity: 0,
        stagger: 0.15,
        duration: 0.7,
        ease: "power2.out",
        scrollTrigger: {
          trigger: gridRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
      });
    }, gridRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="features" className="landing-section">
      <div className="landing-container">
        {/* Section Header */}
        <div className="text-center mb-16">
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
            Everything You Need to Succeed
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-light-400 text-lg max-w-2xl mx-auto"
          >
            Our AI-powered platform gives you the tools and practice you need to
            ace any interview.
          </motion.p>
        </div>

        {/* Feature Cards - Dark Grid inspired */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              whileHover={{
                y: -5,
                transition: { duration: 0.2 },
              }}
              className="feature-card group relative overflow-hidden rounded-2xl p-px cursor-default"
            >
              {/* Hover border gradient */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/20 via-white/5 to-transparent" />

              {/* Card body */}
              <div
                className="relative h-full rounded-2xl p-6 md:p-7 flex flex-col"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(15,15,20,0.8), rgba(10,10,15,0.9))",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {/* Hover inner glow */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/0 to-white/0 group-hover:from-white/[0.02] group-hover:to-white/[0.04] transition-colors pointer-events-none" />

                {/* Icon */}
                <div
                  className={`relative z-10 w-11 h-11 rounded-xl bg-gradient-to-br ${feature.gradient} border border-white/10 flex items-center justify-center mb-5`}
                >
                  <feature.icon className="size-5 text-white" />
                </div>

                {/* Text */}
                <h3 className="relative z-10 text-lg font-semibold text-white mb-2.5">
                  {feature.title}
                </h3>
                <p className="relative z-10 text-sm text-white/50 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
