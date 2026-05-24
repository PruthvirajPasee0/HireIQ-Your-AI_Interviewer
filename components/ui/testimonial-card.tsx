"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface Stat {
  value: string;
  label: string;
}

export interface Testimonial {
  name: string;
  title: string;
  quote?: string;
  avatarSrc: string;
  rating: number;
}

export interface ClientsSectionProps {
  tagLabel: string;
  title: string;
  description: string;
  stats: Stat[];
  testimonials: Testimonial[];
  primaryActionLabel: string;
  secondaryActionLabel: string;
  primaryActionHref?: string;
  secondaryActionHref?: string;
  className?: string;
}

const StatCard = ({ value, label }: Stat) => (
  <Card className="bg-white/[0.04] border-white/10 text-center rounded-xl">
    <CardContent className="p-4">
      <p className="text-2xl md:text-3xl font-bold text-white">{value}</p>
      <p className="text-xs md:text-sm text-white/60">{label}</p>
    </CardContent>
  </Card>
);

const StickyTestimonialCard = ({
  testimonial,
  index,
}: {
  testimonial: Testimonial;
  index: number;
}) => {
  return (
    <motion.div
      className="sticky w-full"
      style={{ top: `${20 + index * 24}px` }}
    >
      <div
        className={cn(
          "p-6 rounded-2xl shadow-lg flex flex-col h-auto w-full",
          "bg-white/[0.04] border border-white/10 backdrop-blur-xl",
        )}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-xl bg-cover bg-center flex-shrink-0 ring-1 ring-white/15"
            style={{ backgroundImage: `url(${testimonial.avatarSrc})` }}
            aria-label={`Photo of ${testimonial.name}`}
          />
          <div className="flex-grow">
            <p className="font-semibold text-lg text-white">{testimonial.name}</p>
            <p className="text-sm text-white/60">{testimonial.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 my-4">
          <span className="font-bold text-base text-white">
            {testimonial.rating.toFixed(1)}
          </span>
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-4 w-4",
                  i < Math.floor(testimonial.rating)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-white/20",
                )}
              />
            ))}
          </div>
        </div>

        {testimonial.quote && (
          <p className="text-base text-white/75 leading-relaxed">
            &ldquo;{testimonial.quote}&rdquo;
          </p>
        )}
      </div>
    </motion.div>
  );
};

export const ClientsSection = ({
  tagLabel,
  title,
  description,
  stats,
  testimonials,
  primaryActionLabel,
  secondaryActionLabel,
  primaryActionHref = "/sign-up",
  secondaryActionHref = "#how-it-works",
  className,
}: ClientsSectionProps) => {
  const scrollContainerHeight = `calc(100vh + ${testimonials.length * 100}px)`;

  return (
    <section
      className={cn(
        "w-full bg-black text-white py-20 md:py-28",
        className,
      )}
    >
      <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
        <div className="flex flex-col gap-6 lg:sticky lg:top-24">
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-white/70">{tagLabel}</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            {title}
          </h2>
          <p className="text-lg text-white/70">{description}</p>
          <div
            className={cn(
              "grid gap-4 mt-4",
              stats.length >= 4
                ? "grid-cols-2 sm:grid-cols-4"
                : "grid-cols-3",
            )}
          >
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>
          <div className="flex items-center gap-4 mt-6">
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <a href={secondaryActionHref}>{secondaryActionLabel}</a>
            </Button>
            <Button asChild size="lg" className="rounded-full">
              <a href={primaryActionHref}>{primaryActionLabel}</a>
            </Button>
          </div>
        </div>

        <div
          className="relative flex flex-col gap-4"
          style={{ height: scrollContainerHeight }}
        >
          {testimonials.map((testimonial, index) => (
            <StickyTestimonialCard
              key={testimonial.name}
              index={index}
              testimonial={testimonial}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
