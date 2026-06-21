"use client";

import React from "react";
import { motion, useInView, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Minimal stand-in for the Aceternity TimelineContent component.
 * Triggers each child's variant when the shared timelineRef enters view,
 * using `animationNum` as the stagger index for `custom`.
 */

type Props<T extends React.ElementType = "div"> = {
  as?: T;
  animationNum: number;
  timelineRef: React.RefObject<HTMLElement | null>;
  customVariants: Variants;
  className?: string;
  children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function TimelineContent<T extends React.ElementType = "div">({
  as,
  animationNum,
  timelineRef,
  customVariants,
  className,
  children,
  ...rest
}: Props<T>) {
  const isInView = useInView(timelineRef as React.RefObject<Element>, {
    once: true,
    margin: "0px 0px -10% 0px",
  });

  const Tag = (as ?? "div") as React.ElementType;
  const MotionTag = React.useMemo(
    () => motion.create(Tag as React.ComponentType),
    [Tag],
  );

  return (
    <MotionTag
      custom={animationNum}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={customVariants}
      className={cn(className)}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
