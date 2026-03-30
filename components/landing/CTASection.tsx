"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function CTASection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Pulsing glow effect on CTA
      if (glowRef.current) {
        gsap.to(glowRef.current, {
          boxShadow: "0 0 60px rgba(59,130,246,0.4)",
          repeat: -1,
          yoyo: true,
          duration: 2,
          ease: "sine.inOut",
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 md:py-28 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          ref={glowRef}
          className="relative rounded-3xl overflow-hidden p-10 md:p-16 text-center"
          style={{
            background:
              "radial-gradient(900px 450px at 50% 0%, rgba(59,130,246,0.25), transparent 70%), linear-gradient(135deg, #0A0F1F 0%, #0B1022 50%, #070A14 100%)",
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.06)",
          }}
        >
          {/* Background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary-200/15 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Ready to Ace Your Next Interview?
            </h2>
            <p className="text-light-400 text-lg max-w-xl mx-auto mb-8">
              Join thousands of candidates who improved their interview skills
              with AI-powered practice and feedback.
            </p>
            <Link
              href="/sign-up"
              className="btn-primary inline-flex items-center gap-2 text-base px-10 py-4"
            >
              Get Started Free
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
