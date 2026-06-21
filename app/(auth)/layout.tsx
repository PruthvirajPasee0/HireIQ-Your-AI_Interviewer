import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/actions/auth.action";

const AuthLayout = async ({ children }: { children: ReactNode }) => {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "recruiter" ? "/recruiter" : "/dashboard");

  // The new AnimatedAuthForm is full-bleed (grid lg:grid-cols-2 min-h-screen),
  // so we don't wrap it in the legacy `auth-bg` + `auth-layout` containers.
  return <>{children}</>;
};

export default AuthLayout;
