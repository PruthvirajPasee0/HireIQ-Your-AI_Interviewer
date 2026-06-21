"use client";

import PrefetchLink from "@/components/PrefetchLink";
import Image from "next/image";
import {
  Menu,
  Home,
  ListChecks,
  Settings,
  LogOut,
  History,
  UserPlus,
  CalendarPlus,
} from "lucide-react";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import type { ComponentType } from "react";

type MobileNavProps = {
  user?: Partial<User> & { profileURL?: string };
  variant?: "candidate" | "recruiter";
};

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  activePrefixes?: string[];
};

const navItemsByVariant: Record<"candidate" | "recruiter", NavItem[]> = {
  candidate: [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/interview", label: "Interviews", icon: ListChecks, activePrefixes: ["/interview"] },
    { href: "/taken", label: "Taken Interviews", icon: History, activePrefixes: ["/taken"] },
    { href: "/settings", label: "Settings", icon: Settings, activePrefixes: ["/settings"] },
  ],
  recruiter: [
    { href: "/recruiter", label: "Dashboard", icon: Home },
    {
      href: "/recruiter/agents/new",
      label: "New Agent",
      icon: UserPlus,
      activePrefixes: ["/recruiter/agents"],
    },
    {
      href: "/recruiter/sessions/new",
      label: "Schedule Interview",
      icon: CalendarPlus,
      activePrefixes: ["/recruiter/sessions"],
    },
  ],
};

export default function MobileNav({ user, variant = "candidate" }: MobileNavProps) {
  const avatar = user?.profileURL || "/ai-avatar.png";
  const pathname = usePathname();
  const navItems = navItemsByVariant[variant];
  const homeHref = variant === "recruiter" ? "/recruiter" : "/dashboard";

  return (
    <div className="flex items-center justify-between">
      <Sheet>
        <SheetTrigger
          className="glass-card p-2 rounded-xl flex items-center justify-center"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent side="left" className="bg-transparent border-none p-0">
          <SheetTitle className="sr-only">Mobile navigation</SheetTitle>
          <aside className="glass-panel p-4 h-full flex flex-col gap-4 w-full">
            <PrefetchLink href={homeHref} className="flex items-center gap-2 px-2">
              <Image src="/logo.svg" alt="Hireiq.ai" width={32} height={28} />
              <h2 className="text-primary-100">Hireiq.ai</h2>
            </PrefetchLink>

            <nav className="mt-2 flex-1">
              <ul className="space-y-1 list-none m-0 p-0">
                {navItems.map(({ href, label, icon: Icon, activePrefixes }) => {
                  const active = activePrefixes
                    ? activePrefixes.some((prefix) => pathname?.startsWith(prefix))
                    : pathname === href;
                  return (
                    <li key={href}>
                      <PrefetchLink href={href} className="nav-link" data-active={active}>
                        <Icon className="size-4" />
                        <span>{label}</span>
                      </PrefetchLink>
                    </li>
                  );
                })}
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
                  <p className="text-xs text-light-400 truncate">
                    {user?.email || "Signed in"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                {variant === "candidate" && (
                  <PrefetchLink
                    href="/settings"
                    className="nav-link flex-1 justify-center"
                  >
                    <Settings className="size-4" />
                    <span>Settings</span>
                  </PrefetchLink>
                )}
                <PrefetchLink
                  href="/sign-out"
                  className="nav-link flex-1 justify-center"
                >
                  <LogOut className="size-4" />
                  <span>Sign out</span>
                </PrefetchLink>
              </div>
            </div>
          </aside>
        </SheetContent>
      </Sheet>

      <PrefetchLink href={homeHref} className="flex items-center gap-2">
        <Image src="/logo.svg" alt="Hireiq.ai" width={32} height={28} />
        <span className="text-primary-100 font-semibold">Hireiq.ai</span>
      </PrefetchLink>

      <div className="size-9" />
    </div>
  );
}
