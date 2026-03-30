"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ArrowRight, Sparkles, Play } from "lucide-react";
import { ShaderAnimation } from "@/components/ui/shader-animation";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const words = headlineRef.current?.querySelectorAll(".hero-word");
      if (words) {
        gsap.from(words, {
          y: 80,
          opacity: 0,
          rotateX: 40,
          stagger: 0.08,
          duration: 0.9,
          ease: "power3.out",
          delay: 0.4,
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const headlineWords = "Ace Your Next Interview with AI".split(" ");

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center pt-20 md:pt-0 overflow-hidden"
    >
      {/* Shader animation as hero background */}
      <div className="absolute inset-0 z-0">
        <ShaderAnimation />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/55" />
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 w-full relative z-10">
        {/* Centered content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          {/* Badge */}
          <motion.div variants={itemVariants}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-200 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-200" />
              </span>
              <span className="text-sm font-medium text-white/90">
                AI-Powered Interview Prep
              </span>
            </span>
          </motion.div>

          {/* Headline */}
          <h1
            ref={headlineRef}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-none tracking-tighter mb-6"
            style={{ perspective: "600px" }}
          >
            {headlineWords.map((word, i) => (
              <span
                key={i}
                className="hero-word inline-block mr-[0.3em]"
                style={
                  word === "AI"
                    ? { color: "#3B82F6" }
                    : { color: "#ffffff" }
                }
              >
                {word}
              </span>
            ))}
          </h1>

          {/* Subheadline */}
          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed tracking-tight"
          >
            Practice real interview questions, get instant AI feedback, and
            land your dream job. Trusted by thousands of candidates worldwide.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/sign-up"
              className="group inline-flex items-center justify-center gap-2 text-base px-8 py-3.5 rounded-full bg-white text-black font-bold hover:bg-white/90 transition-all hover:scale-105 active:scale-95"
            >
              Start Free Practice
              <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#how-it-works"
              className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full border border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all font-bold text-base backdrop-blur-sm"
            >
              <Play className="size-4 text-primary-200" />
              See How It Works
            </Link>
          </motion.div>

          {/* Floating stat badges */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center justify-center gap-4 mt-12"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-success-100" />
              <span className="text-sm text-white/80">
                Score: <span className="text-success-100 font-semibold">92/100</span>
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <Sparkles className="size-3.5 text-primary-200" />
              <span className="text-sm text-white/80">
                <span className="text-primary-200 font-semibold">AI Feedback</span> Ready
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <span className="text-yellow-400 text-sm">&#9733;</span>
              <span className="text-sm text-white/80">4.9/5 Rating</span>
            </div>
          </motion.div>

          {/* Social proof */}
          <motion.div
            variants={itemVariants}
            className="flex items-center gap-4 mt-8 justify-center"
          >
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-black/50 bg-gradient-to-br from-primary-200/60 to-primary-200/20 flex items-center justify-center text-[10px] font-bold text-white"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className="text-yellow-400 text-xs">
                    &#9733;
                  </span>
                ))}
              </div>
              <p className="text-xs text-white/40">
                Loved by 10,000+ candidates
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
