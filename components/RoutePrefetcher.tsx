"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RoutePrefetcher({ routes }: { routes: string[] }) {
  const router = useRouter();
  useEffect(() => {
    const prefetchAll = () => {
      routes.forEach((r) => {
        try { router.prefetch(r); } catch {}
      });
    };
    // Defer to idle to avoid competing with critical rendering
    if (typeof (window as any).requestIdleCallback === "function") {
      (window as any).requestIdleCallback(prefetchAll);
    } else {
      setTimeout(prefetchAll, 0);
    }
  }, [routes, router]);
  return null;
}
