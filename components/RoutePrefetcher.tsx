"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type WindowWithRIC = Window &
  typeof globalThis & {
    requestIdleCallback?: (callback: () => void) => number;
  };

export default function RoutePrefetcher({ routes }: { routes: string[] }) {
  const router = useRouter();
  useEffect(() => {
    const prefetchAll = () => {
      routes.forEach((r) => {
        try { router.prefetch(r); } catch {}
      });
    };
    // Defer to idle to avoid competing with critical rendering
    const win = window as WindowWithRIC;
    if (typeof win.requestIdleCallback === "function") {
      win.requestIdleCallback(prefetchAll);
    } else {
      setTimeout(prefetchAll, 0);
    }
  }, [routes, router]);
  return null;
}
