"use client";

import ScrollReveal from "./ScrollReveal";
import AnimatedCounter from "./AnimatedCounter";

const stats = [
  { target: 10000, suffix: "+", label: "Practice Interviews" },
  { target: 95, suffix: "%", label: "User Satisfaction" },
  { target: 500, suffix: "+", label: "Companies Represented" },
  { target: 4.9, suffix: "/5", label: "Average Rating", decimals: 1 },
];

export default function StatsSection() {
  return (
    <section className="py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <ScrollReveal>
          <div className="relative rounded-3xl overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 blue-gradient-dark" />
            <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-sm" />
            <div className="absolute top-0 left-1/4 w-[600px] h-[300px] bg-primary-200/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Content */}
            <div className="relative grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 p-8 md:p-12">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="text-center"
                >
                  <p className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
                    <AnimatedCounter
                      target={stat.target}
                      suffix={stat.suffix}
                      decimals={stat.decimals || 0}
                    />
                  </p>
                  <p className="text-sm text-light-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
