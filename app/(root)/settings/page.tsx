import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { Button } from "@/components/ui/button";
import SettingsForm from "@/components/SettingsForm";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-col gap-6">
      <h3>Settings</h3>

      <section className="glass-panel p-6">
        <div className="flex items-center gap-4">
          <Image
            src={(user as any)?.profileURL || "/ai-avatar.png"}
            alt={user?.name || "User"}
            width={64}
            height={64}
            className="rounded-full object-cover"
          />
          <div className="min-w-0">
            <p className="text-lg font-semibold truncate">{user?.name || "User"}</p>
            <p className="text-light-400 truncate">{user?.email}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="glass-card p-5">
          <h4 className="text-primary-100 mb-2">Edit profile</h4>
          <p className="text-sm text-light-400 mb-4">
            Update your display name and profile picture URL.
          </p>
          <SettingsForm user={user} />
        </div>

        <div className="glass-card p-5">
          <h4 className="text-primary-100 mb-2">Account</h4>
          <p className="text-sm text-light-400">
            Manage authentication and sign out of your account.
          </p>
          <div className="mt-3">
            <Button asChild variant="outline">
              <Link href="/sign-out" prefetch>Sign out</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
