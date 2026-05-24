"use client";

import { useEffect, useRef } from "react";

/**
 * Lightweight canvas-based sparkles — drop-in replacement for the tsparticles
 * version (we couldn't install @tsparticles/react due to a broken workspace
 * dep in that package). Same prop shape as the Aceternity Sparkles component
 * so the pricing section can use it unchanged.
 */
type Props = {
  className?: string;
  size?: number;
  minSize?: number | null;
  density?: number;
  speed?: number;
  minSpeed?: number | null;
  opacity?: number;
  opacitySpeed?: number;
  minOpacity?: number | null;
  color?: string;
  background?: string;
  direction?: "top" | "bottom" | "left" | "right" | "none";
};

interface Particle {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  opacity: number;
  opacityDir: 1 | -1;
  opacitySpeed: number;
}

export function Sparkles({
  className,
  size = 1.4,
  minSize = null,
  density = 800,
  speed = 1,
  minSpeed = null,
  opacity = 1,
  opacitySpeed = 3,
  minOpacity = null,
  color = "#FFFFFF",
  background = "transparent",
  direction = "none",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const minS = minSize ?? size / 2.5;
    const minSp = minSpeed ?? speed / 10;
    const minO = minOpacity ?? opacity / 10;

    const init = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);

      const w = rect.width;
      const h = rect.height;
      const count = Math.max(30, Math.min(density, 3000));
      const particles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        const angleVx =
          direction === "left"
            ? -1
            : direction === "right"
              ? 1
              : (Math.random() - 0.5) * 2;
        const angleVy =
          direction === "top"
            ? -1
            : direction === "bottom"
              ? 1
              : (Math.random() - 0.5) * 2;
        const sp = minSp + Math.random() * (speed - minSp);
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size: minS + Math.random() * (size - minS),
          vx: angleVx * sp * 0.15,
          vy: angleVy * sp * 0.15,
          opacity: minO + Math.random() * (opacity - minO),
          opacityDir: Math.random() < 0.5 ? -1 : 1,
          opacitySpeed: 0.005 + Math.random() * 0.005 * opacitySpeed,
        });
      }
      particlesRef.current = particles;
    };

    const loop = () => {
      animationRef.current = requestAnimationFrame(loop);
      const rect = wrap.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (background !== "transparent") {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, w, h);
      }
      ctx.fillStyle = color;
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        p.opacity += p.opacityDir * p.opacitySpeed;
        if (p.opacity >= opacity) {
          p.opacity = opacity;
          p.opacityDir = -1;
        } else if (p.opacity <= minO) {
          p.opacity = minO;
          p.opacityDir = 1;
        }
        ctx.globalAlpha = p.opacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    init();
    loop();

    const ro = new ResizeObserver(() => init());
    ro.observe(wrap);

    return () => {
      cancelAnimationFrame(animationRef.current);
      ro.disconnect();
    };
  }, [
    size,
    minSize,
    density,
    speed,
    minSpeed,
    opacity,
    opacitySpeed,
    minOpacity,
    color,
    background,
    direction,
  ]);

  return (
    <div ref={wrapRef} className={className} style={{ position: "relative" }}>
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
