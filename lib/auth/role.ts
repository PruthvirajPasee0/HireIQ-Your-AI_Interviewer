import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth.action";

export async function requireRecruiter(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "recruiter") redirect("/dashboard");
  return user;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

export function isRecruiter(user: User | null | undefined): boolean {
  return !!user && user.role === "recruiter";
}
