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

// Pre-generate particle positions to avoid hydration mismatch
const PARTICLE_POSITIONS = [
  { top: 12, left: 8 }, { top: 45, left: 92 }, { top: 78, left: 23 },
  { top: 34, left: 67 }, { top: 89, left: 45 }, { top: 56, left: 12 },
  { top: 23, left: 78 }, { top: 67, left: 34 }, { top: 91, left: 56 },
  { top: 8, left: 89 }, { top: 43, left: 5 }, { top: 71, left: 61 },
  { top: 15, left: 42 }, { top: 58, left: 85 }, { top: 82, left: 15 },
  { top: 37, left: 52 }, { top: 95, left: 73 }, { top: 19, left: 31 },
  { top: 62, left: 48 }, { top: 5, left: 65 }, { top: 48, left: 19 },
  { top: 76, left: 77 }, { top: 28, left: 95 }, { top: 53, left: 38 },
  { top: 87, left: 8 },
];

const PARTICLE_DURATIONS = [
  6, 8, 7, 9, 5, 8, 6, 7, 9, 5, 8, 6, 7, 9, 8, 6, 7, 5, 9, 8, 6, 7, 5, 8, 9,
];

const PARTICLE_DELAYS = [
  0, 2, 1, 3, 0.5, 2.5, 1.5, 3.5, 0.8, 2.2, 1.2, 3.2, 0.3, 2.7, 1.7, 3.7, 0.6, 2.9, 1.9, 3.9, 0.1, 2.1, 1.1, 3.1, 0.4,
];

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Word-by-word headline reveal
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

      // Hero image floating
      if (imageRef.current) {
        gsap.to(imageRef.current, {
          y: -15,
          duration: 3,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const headlineWords = "Ace Your Next Interview with AI".split(" ");

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center pt-20 md:pt-0 overflow-hidden"
    >
      {/* === GRID BACKGROUND (from 21st Magic Hero) === */}
      <div
        className="absolute -z-10 inset-0 opacity-60 h-full w-full"
        style={{
          backgroundImage:
            "linear-gradient(to right, #333 1px, transparent 1px), linear-gradient(to bottom, #333 1px, transparent 1px)",
          backgroundSize: "6rem 5rem",
          maskImage:
            "radial-gradient(ellipse 80% 50% at 50% 0%, #000 70%, transparent 110%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 50% at 50% 0%, #000 70%, transparent 110%)",
        }}
      />

      {/* === FLOATING PARTICLES (from Ruixen Hero) === */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {PARTICLE_POSITIONS.map((pos, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 0.3, 0], y: [0, -30, 0] }}
            transition={{
              duration: PARTICLE_DURATIONS[i],
              repeat: Infinity,
              delay: PARTICLE_DELAYS[i],
            }}
            className="absolute w-1 h-1 bg-primary-200/40 rounded-full"
            style={{ top: `${pos.top}%`, left: `${pos.left}%` }}
          />
        ))}
      </div>

      {/* === ANIMATED GRADIENT BLOBS === */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 0.4, scale: 1 }}
        transition={{ duration: 1.4 }}
        className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-primary-200/20 blur-[140px] rounded-full z-0"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 0.25, scale: 1 }}
        transition={{ duration: 1.6, delay: 0.3 }}
        className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-primary-200/10 blur-[160px] rounded-full z-0"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.15, scale: 1 }}
        transition={{ duration: 2, delay: 0.6 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary-200/10 rounded-full blur-[120px] z-0"
      />

      <div className="max-w-7xl mx-auto px-4 md:px-6 w-full relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Left: Text Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex-1 text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div variants={itemVariants}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-200/10 border border-primary-200/20 mb-8 backdrop-blur-sm">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-200 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-200" />
                </span>
                <span className="text-sm font-medium text-primary-200">
                  AI-Powered Interview Prep
                </span>
              </span>
            </motion.div>

            {/* Headline with gradient text */}
            <h1
              ref={headlineRef}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-none tracking-tighter mb-6"
              style={{ perspective: "600px" }}
            >
              {headlineWords.map((word, i) => (
                <span
                  key={i}
                  className="hero-word inline-block mr-[0.3em]"
                  style={
                    word === "AI"
                      ? { color: "#3B82F6" }
                      : {
                          background:
                            "linear-gradient(to bottom right, #ffffff 30%, rgba(255,255,255,0.4))",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }
                  }
                >
                  {word}
                </span>
              ))}
            </h1>

            {/* Subheadline */}
            <motion.p
              variants={itemVariants}
              className="text-lg md:text-xl text-light-400 max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed tracking-tight"
            >
              Practice real interview questions, get instant AI feedback, and
              land your dream job. Trusted by thousands of candidates worldwide.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link
                href="/sign-up"
                className="group btn-primary inline-flex items-center justify-center gap-2 text-base px-8 py-3 relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Free Practice
                  <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <Link
                href="#how-it-works"
                className="group inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full border border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all font-bold text-base backdrop-blur-sm"
              >
                <Play className="size-4 text-primary-200" />
                See How It Works
              </Link>
            </motion.div>

            {/* Mini social proof under CTAs */}
            <motion.div
              variants={itemVariants}
              className="flex items-center gap-4 mt-8 justify-center lg:justify-start"
            >
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-dark-100 bg-gradient-to-br from-primary-200/60 to-primary-200/20 flex items-center justify-center text-[10px] font-bold text-white"
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
                <p className="text-xs text-light-600">
                  Loved by 10,000+ candidates
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Hero Visual - Shader Fluid Animation */}
          <div className="flex-1 flex justify-center lg:justify-end">
            <div ref={imageRef} className="relative w-full max-w-[480px]">
              {/* Multi-layer glow behind shader */}
              <div className="absolute inset-0 bg-primary-200/20 rounded-full blur-[80px] scale-75 pointer-events-none" />
              <div className="absolute -inset-8 bg-primary-200/5 rounded-full blur-[60px] pointer-events-none" />

              {/* Shader animation container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="relative rounded-3xl overflow-hidden aspect-square"
                style={{
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow:
                    "0 20px 60px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.05)",
                }}
              >
                <ShaderAnimation />

                {/* Glass overlay gradient for blending */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-tr from-primary-200/5 via-transparent to-white/5 pointer-events-none" />
              </motion.div>

              {/* Floating badges */}
              <motion.div
                initial={{ opacity: 0, x: -30, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: 1.3, duration: 0.6, ease: "backOut" }}
                className="absolute -left-6 top-1/4 px-4 py-2.5 rounded-xl backdrop-blur-xl z-10"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
                  border: "1px solid rgba(255,255,255,0.12)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                }}
              >
                <p className="text-sm font-semibold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success-100" />
                  Score: <span className="text-success-100">92/100</span>
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: 1.5, duration: 0.6, ease: "backOut" }}
                className="absolute -right-6 bottom-1/3 px-4 py-2.5 rounded-xl backdrop-blur-xl z-10"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
                  border: "1px solid rgba(255,255,255,0.12)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                }}
              >
                <p className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sparkles className="size-3.5 text-primary-200" />
                  <span className="text-primary-200">AI Feedback</span> Ready
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 1.7, duration: 0.6, ease: "backOut" }}
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl backdrop-blur-xl z-10"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
                  border: "1px solid rgba(255,255,255,0.12)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                }}
              >
                <p className="text-sm font-semibold text-white flex items-center gap-2">
                  <span className="text-yellow-400">&#9733;</span>
                  4.9/5 Rating
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* === BOTTOM RADIAL ACCENT (from 21st Magic Hero) === */}
      <div
        className="absolute left-1/2 bottom-0 -translate-x-1/2 w-[140%] h-[200px] rounded-[100%] pointer-events-none"
        style={{
          background:
            "radial-gradient(closest-side, rgba(0,0,0,0.8) 82%, transparent)",
        }}
      />
    </section>
  );
}
