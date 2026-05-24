import { ReactNode } from "react";
import Navbar from "@/components/landing/Navbar";
import WelcomeScreen from "@/components/landing/WelcomeScreen";

export default function LandingLayout({ children }: { children: ReactNode }) {
  // The CinematicFooter is rendered inline at the end of the landing page so
  // the curtain-reveal scroll effect works correctly (it needs to be in
  // normal document flow). We drop the static Footer here.
  return (
    <WelcomeScreen>
      <div className="min-h-screen relative landing-bg">
        <Navbar />
        <main>{children}</main>
      </div>
    </WelcomeScreen>
  );
}
