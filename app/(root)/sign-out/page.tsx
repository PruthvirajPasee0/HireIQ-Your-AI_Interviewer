import { redirect } from "next/navigation";
import { signOut } from "@/lib/actions/auth.action";

export default async function SignOutPage() {
  await signOut();
  redirect("/sign-in");
}
