"use client";

import PrefetchLink from "@/components/PrefetchLink";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, ListChecks, Settings, LogOut, ChevronsLeft, ChevronsRight, History } from "lucide-react";
import React, { useState } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/interview", label: "Interviews", icon: ListChecks },
  { href: "/taken", label: "Taken Interviews", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

type SidebarProps = {
  user?: Partial<User> & { profileURL?: string } | null;
};

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Update the data attribute on the main content area when sidebar state changes
  React.useEffect(() => {
    const mainContent = document.querySelector('[data-sidebar-collapsed]');
    if (mainContent) {
      mainContent.setAttribute('data-sidebar-collapsed', collapsed.toString());
    }
  }, [collapsed]);

  return (
    <aside className={`glass-panel h-screen p-4 flex flex-col gap-4 transition-[width] duration-300 ${collapsed ? "w-20" : "w-64"}`}>
      <div className="flex items-center justify-between">
        <PrefetchLink href="/" className="flex items-center gap-2 px-2">
          <Image src="/logo.svg" alt="Hireiq.ai" width={32} height={28} />
          {!collapsed && <h2 className="text-primary-100">Hireiq.ai</h2>}
        </PrefetchLink>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="nav-link px-2 py-1"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
        </button>
      </div>

      <nav className="mt-2 flex-1">
        <ul className="space-y-1 list-none m-0 p-0">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname?.startsWith(href));
            return (
              <li key={href}>
                <PrefetchLink href={href} className="nav-link" data-active={active}>
                  <Icon className="size-4 shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}
                </PrefetchLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto">
        <div className="glass-card flex items-center gap-3 p-3">
          <Image
            src={user?.profileURL || "/ai-avatar.png"}
            alt={user?.name || "User"}
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-medium truncate">{user?.name || "User"}</p>
              <p className="text-xs text-light-400 truncate">{user?.email || "Signed in"}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-3">
          <PrefetchLink href="/sign-out" className="nav-link flex-1 justify-center">
            <LogOut className="size-4" />
            {!collapsed && <span>Sign out</span>}
          </PrefetchLink>
        </div>
      </div>
    </aside>
  );
}
