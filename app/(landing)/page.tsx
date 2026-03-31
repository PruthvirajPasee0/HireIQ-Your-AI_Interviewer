import { Metadata } from "next";
import HeroSection from "@/components/landing/HeroSection";

import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import StatsSection from "@/components/landing/StatsSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CTASection from "@/components/landing/CTASection";

export const metadata: Metadata = {
  title: "Hireiq.ai - AI-Powered Interview Preparation",
  description:
    "Practice real interview questions with AI and get instant feedback. Prepare for your dream job with Hireiq.ai.",
};

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <StatsSection />
      <TestimonialsSection />
      <CTASection />
    </>
  );
}
