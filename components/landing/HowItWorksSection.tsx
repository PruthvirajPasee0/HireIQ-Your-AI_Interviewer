"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings2, Headphones, Award } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    icon: Settings2,
    number: "01",
    title: "Choose Your Interview",
    description:
      "Select your target role, experience level, and tech stack. Our AI creates a custom interview tailored just for you.",
  },
  {
    icon: Headphones,
    number: "02",
    title: "Practice with AI",
    description:
      "Have a real-time voice conversation with our AI interviewer. Answer questions naturally, just like a real interview.",
  },
  {
    icon: Award,
    number: "03",
    title: "Get Feedback & Improve",
    description:
      "Receive a detailed scorecard with actionable feedback. Track your progress and practice again to improve.",
  },
];

export default function HowItWorksSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Step circles scale in
      gsap.from(".step-circle", {
        scale: 0,
        stagger: 0.2,
        duration: 0.6,
        ease: "back.out(1.7)",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
          toggleActions: "play none none none",
        },
      });

      // Step text fade in
      gsap.from(".step-text", {
        y: 30,
        opacity: 0,
        stagger: 0.2,
        duration: 0.6,
        delay: 0.3,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
          toggleActions: "play none none none",
        },
      });

      // Connecting line animation (desktop only)
      if (lineRef.current && window.innerWidth >= 768) {
        gsap.from(lineRef.current, {
          scaleX: 0,
          transformOrigin: "left center",
          duration: 1,
          ease: "power2.inOut",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            toggleActions: "play none none none",
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="how-it-works" className="landing-section" ref={sectionRef}>
      <div className="landing-container">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm text-primary-200 font-medium uppercase tracking-widest mb-4"
          >
            How It Works
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4"
          >
            Three Steps to Interview Success
          </motion.h2>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Desktop connecting line */}
          <div
            ref={lineRef}
            className="hidden md:block absolute top-[52px] left-[16%] right-[16%] h-px bg-gradient-to-r from-primary-200/50 via-primary-200/30 to-primary-200/50"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {steps.map((step, index) => (
              <div key={step.number} className="flex flex-col items-center text-center">
                {/* Circle */}
                <div className="step-circle relative z-10 w-[104px] h-[104px] rounded-full bg-dark-100 border-2 border-primary-200/30 flex items-center justify-center mb-8">
                  <div className="w-20 h-20 rounded-full bg-primary-200/10 flex items-center justify-center">
                    <step.icon className="size-8 text-primary-200" />
                  </div>
                  {/* Step number */}
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary-200 text-dark-100 text-sm font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                </div>

                {/* Text */}
                <div className="step-text">
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm text-light-400 leading-relaxed max-w-xs mx-auto">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
