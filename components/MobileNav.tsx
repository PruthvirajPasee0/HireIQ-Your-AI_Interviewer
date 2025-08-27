"use client";

import PrefetchLink from "@/components/PrefetchLink";
import Image from "next/image";
import { Menu, Home, ListChecks, Settings, LogOut, History } from "lucide-react";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

type MobileNavProps = {
  user?: Partial<User> & { profileURL?: string };
};

export default function MobileNav({ user }: MobileNavProps) {
  const avatar = user?.profileURL || "/ai-avatar.png";
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-between">
      <Sheet>
        <SheetTrigger className="glass-card p-2 rounded-xl flex items-center justify-center">
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent side="left" className="bg-transparent border-none p-0">
          <SheetTitle className="sr-only">Mobile navigation</SheetTitle>
          <aside className="glass-panel p-4 h-full flex flex-col gap-4 w-full">
            <PrefetchLink href="/" className="flex items-center gap-2 px-2">
              <Image src="/logo.svg" alt="Hireiq.ai" width={32} height={28} />
              <h2 className="text-primary-100">Hireiq.ai</h2>
            </PrefetchLink>

            <nav className="mt-2 flex-1">
              <ul className="space-y-1 list-none m-0 p-0">
                <li>
                  <PrefetchLink href="/" className="nav-link" data-active={pathname === "/"}>
                    <Home className="size-4" />
                    <span>Dashboard</span>
                  </PrefetchLink>
                </li>
                <li>
                  <PrefetchLink href="/interview" className="nav-link" data-active={pathname?.startsWith("/interview")}>
                    <ListChecks className="size-4" />
                    <span>Interviews</span>
                  </PrefetchLink>
                </li>
                <li>
                  <PrefetchLink href="/taken" className="nav-link" data-active={pathname?.startsWith("/taken")}>
                    <History className="size-4" />
                    <span>Taken Interviews</span>
                  </PrefetchLink>
                </li>
                <li>
                  <PrefetchLink href="/settings" className="nav-link" data-active={pathname?.startsWith("/settings")}>
                    <Settings className="size-4" />
                    <span>Settings</span>
                  </PrefetchLink>
                </li>
              </ul>
            </nav>

            <div className="mt-auto">
              <div className="glass-card flex items-center gap-3 p-3">
                <Image
                  src={avatar}
                  alt={user?.name || "User"}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
                <div className="min-w-0">
                  <p className="font-medium truncate">{user?.name || "User"}</p>
                  <p className="text-xs text-light-400 truncate">{user?.email || "Signed in"}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <PrefetchLink href="/settings" className="nav-link flex-1 justify-center">
                  <Settings className="size-4" />
                  <span>Settings</span>
                </PrefetchLink>
                <PrefetchLink href="/sign-out" className="nav-link flex-1 justify-center">
                  <LogOut className="size-4" />
                  <span>Sign out</span>
                </PrefetchLink>
              </div>
            </div>
          </aside>
        </SheetContent>
      </Sheet>

      <PrefetchLink href="/" className="flex items-center gap-2">
        <Image src="/logo.svg" alt="Hireiq.ai" width={32} height={28} />
        <span className="text-primary-100 font-semibold">Hireiq.ai</span>
      </PrefetchLink>

      <div className="size-9" />
    </div>
  );
}
