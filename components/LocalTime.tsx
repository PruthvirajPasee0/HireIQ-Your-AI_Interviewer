"use client";

import { useEffect, useState } from "react";

/**
 * Renders an ISO timestamp in the VIEWER's local timezone.
 *
 * Server components render dates in the server's timezone (UTC on Vercel),
 * which made IST-scheduled interviews display ~5.5h off. This is a client
 * component, so the formatting runs in the browser and reflects the user's
 * actual timezone. We only format after mount to avoid a server/client
 * hydration mismatch.
 */
export default function LocalTime({
  iso,
  options = { dateStyle: "medium", timeStyle: "short" },
}: {
  iso: string;
  options?: Intl.DateTimeFormatOptions;
}) {
  const [text, setText] = useState<string>("");

  useEffect(() => {
    if (!iso) return;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      setText(iso);
      return;
    }
    setText(d.toLocaleString(undefined, options));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iso]);

  // Before mount, render a stable placeholder (avoids hydration mismatch).
  return <span suppressHydrationWarning>{text || "…"}</span>;
}
