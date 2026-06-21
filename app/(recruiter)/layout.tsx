import { ReactNode } from "react";
import { requireRecruiter } from "@/lib/auth/role";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import RoutePrefetcher from "@/components/RoutePrefetcher";

const RecruiterLayout = async ({ children }: { children: ReactNode }) => {
  const user = await requireRecruiter();

  return (
    <div className="dashboard-bg min-h-screen">
      <RoutePrefetcher
        routes={[
          "/recruiter",
          "/recruiter/agents/new",
          "/recruiter/sessions/new",
          "/sign-out",
        ]}
      />
      <div className="hidden md:block fixed left-0 top-0 h-screen z-30">
        <Sidebar user={user} variant="recruiter" />
      </div>

      <div
        className="md:pl-[260px] data-[sidebar-collapsed=true]:md:pl-20 transition-all duration-300 ease-in-out"
        data-sidebar-collapsed="false"
      >
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-6">
          <main className="flex flex-col gap-6">
            <div className="md:hidden">
              <MobileNav user={user} variant="recruiter" />
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default RecruiterLayout;
