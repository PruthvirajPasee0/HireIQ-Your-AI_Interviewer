"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setMyRole } from "@/lib/actions/auth.action";

type Props = {
  to: "recruiter" | "candidate";
  redirectTo?: string;
  label?: string;
  className?: string;
};

export default function RoleSwitchButton({
  to,
  redirectTo,
  label,
  className,
}: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const onClick = () => {
    if (
      !confirm(
        to === "recruiter"
          ? "Switch this account to a recruiter account?"
          : "Switch this account to a candidate account?",
      )
    )
      return;
    start(async () => {
      const res = await setMyRole(to);
      if (!res.success) {
        toast.error(res.message ?? "Failed");
        return;
      }
      toast.success(`Switched to ${to}`);
      router.push(redirectTo ?? (to === "recruiter" ? "/recruiter" : "/dashboard"));
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={
        className ??
        "text-xs text-white/60 hover:text-white underline underline-offset-4 transition disabled:opacity-50"
      }
    >
      {pending
        ? "Switching..."
        : (label ??
          (to === "recruiter"
            ? "I'm a recruiter — switch my role"
            : "Switch back to candidate mode"))}
    </button>
  );
}
