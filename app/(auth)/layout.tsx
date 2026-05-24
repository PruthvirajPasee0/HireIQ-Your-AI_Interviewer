import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { isAuthenticated } from "@/lib/actions/auth.action";

const AuthLayout = async ({ children }: { children: ReactNode }) => {
  const isUserAuthenticated = await isAuthenticated();
  if (isUserAuthenticated) redirect("/dashboard");

  // The new AnimatedAuthForm is full-bleed (grid lg:grid-cols-2 min-h-screen),
  // so we don't wrap it in the legacy `auth-bg` + `auth-layout` containers.
  return <>{children}</>;
};

export default AuthLayout;
