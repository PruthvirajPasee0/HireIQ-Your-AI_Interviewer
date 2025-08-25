import { ReactNode } from "react";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import { isAuthenticated, getCurrentUser } from "@/lib/actions/auth.action";
import RoutePrefetcher from "@/components/RoutePrefetcher";

const Layout = async ({ children }: { children: ReactNode }) => {
  const isUserAuthenticated = await isAuthenticated();
  if (!isUserAuthenticated) redirect("/sign-in");

  const user = await getCurrentUser();

  return (
    <div className="dashboard-bg min-h-screen">
      {/* Prefetch common routes to speed up navigation */}
      <RoutePrefetcher routes={["/", "/interview", "/taken", "/settings", "/sign-out"]} />
      {/* Fixed Sidebar on desktop */}
      <div className="hidden md:block fixed left-0 top-0 h-screen z-30">
        <Sidebar user={user as any} />
      </div>

      {/* Content area with dynamic padding based on sidebar state */}
      <div className="md:pl-[260px] data-[sidebar-collapsed=true]:md:pl-20 transition-all duration-300 ease-in-out"
           data-sidebar-collapsed="false">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-6">
          <main className="flex flex-col gap-6">
            {/* Mobile header */}
            <div className="md:hidden">
              <MobileNav user={user as any} />
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
