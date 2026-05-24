"use client";

import {
  ClientsSection,
  type Stat,
  type Testimonial,
} from "@/components/ui/testimonial-card";

const stats: Stat[] = [
  { value: "10K+", label: "Practice interviews" },
  { value: "95%", label: "User satisfaction" },
  { value: "500+", label: "Companies" },
  { value: "4.9/5", label: "Average rating" },
];

const testimonials: Testimonial[] = [
  {
    name: "Sarah K.",
    title: "Software Engineer · Google",
    quote:
      "Hireiq.ai helped me prepare for my Google interview. The AI feedback was incredibly detailed and actionable. I felt truly prepared walking into the room.",
    avatarSrc:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=70",
    rating: 5.0,
  },
  {
    name: "Michael T.",
    title: "Product Manager · Amazon",
    quote:
      "I practiced 5 interviews in one week and landed my dream job at Amazon. The real-time voice feature is a game-changer for realistic practice.",
    avatarSrc:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=70",
    rating: 4.9,
  },
  {
    name: "Priya R.",
    title: "Data Scientist · Stripe",
    quote:
      "The instant feedback after each session helped me identify my weak points. I improved my score from 60 to 92 in just 3 sessions.",
    avatarSrc:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&auto=format&fit=crop&q=70",
    rating: 4.8,
  },
];

export default function TestimonialsSection() {
  return (
    <section id="testimonials">
      <ClientsSection
        tagLabel="Loved by candidates"
        title="Loved by candidates everywhere"
        description="Hireiq.ai users land roles at top companies — from senior engineers to product managers and data scientists."
        stats={stats}
        testimonials={testimonials}
        primaryActionLabel="Start practicing free"
        secondaryActionLabel="See how it works"
        primaryActionHref="/sign-up"
        secondaryActionHref="#how-it-works"
      />
    </section>
  );
}
