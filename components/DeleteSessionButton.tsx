"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteInterviewSession } from "@/lib/actions/sessions.action";

type Props = {
  sessionId: string;
  candidateName: string;
  /** "icon" = small inline trash on dashboard, "button" = labeled button on feedback page */
  variant?: "icon" | "button";
  redirectTo?: string;
};

export default function DeleteSessionButton({
  sessionId,
  candidateName,
  variant = "icon",
  redirectTo,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      !confirm(
        `Delete interview with ${candidateName}? Transcript and feedback will be removed permanently.`,
      )
    )
      return;

    startTransition(async () => {
      const res = await deleteInterviewSession(sessionId);
      if (!res.success) {
        toast.error(res.message ?? "Failed");
        return;
      }
      toast.success("Interview deleted");
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    });
  };

  if (variant === "button") {
    return (
      <Button
        type="button"
        variant="destructive"
        onClick={handleClick}
        disabled={isPending}
      >
        {isPending ? "Deleting..." : "Delete interview"}
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      title="Delete interview"
      aria-label="Delete interview"
      className="text-white/40 hover:text-red-400 transition disabled:opacity-30 text-xs"
    >
      {isPending ? "..." : "✕ Delete"}
    </button>
  );
}
