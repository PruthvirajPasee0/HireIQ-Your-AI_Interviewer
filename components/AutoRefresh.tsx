"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type AutoRefreshProps = {
  enabled?: boolean;
  intervalMs?: number;
  statusUrl?: string;
};

export default function AutoRefresh({
  enabled = true,
  intervalMs = 3000,
  statusUrl,
}: AutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    let stopped = false;
    const interval = window.setInterval(async () => {
      if (stopped || document.hidden) return;

      if (!statusUrl) {
        router.refresh();
        return;
      }

      try {
        const res = await fetch(statusUrl, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { ready?: boolean };
        if (data.ready) {
          stopped = true;
          window.clearInterval(interval);
          router.refresh();
        }
      } catch {
        // Ignore transient network errors; next tick retries.
      }
    }, intervalMs);

    return () => {
      stopped = true;
      window.clearInterval(interval);
    };
  }, [enabled, intervalMs, router, statusUrl]);

  return null;
}
