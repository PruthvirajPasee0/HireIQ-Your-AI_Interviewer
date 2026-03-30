"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "Hireiq.ai helped me prepare for my Google interview. The AI feedback was incredibly detailed and actionable. I felt truly prepared walking into the room.",
    name: "Sarah K.",
    role: "Software Engineer",
    rating: 5,
  },
  {
    quote:
      "I practiced 5 interviews in one week and landed my dream job at Amazon. The real-time voice feature is a game-changer for realistic practice.",
    name: "Michael T.",
    role: "Product Manager",
    rating: 5,
  },
  {
    quote:
      "The instant feedback after each session helped me identify my weak points. I improved my score from 60 to 92 in just 3 sessions.",
    name: "Priya R.",
    role: "Data Scientist",
    rating: 5,
  },
];

export default function TestimonialsSection() {
  return (
    <section className="landing-section">
      <div className="landing-container">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm text-primary-200 font-medium uppercase tracking-widest mb-4"
          >
            Testimonials
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4"
          >
            Loved by Candidates Everywhere
          </motion.h2>
        </div>

        {/* Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.15, duration: 0.6 }}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              className="glass-card p-6 md:p-8 rounded-2xl flex flex-col"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="size-4 text-yellow-400 fill-yellow-400"
                  />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-light-100 text-sm leading-relaxed flex-1 mb-6">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-200/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-200">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-light-400">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
