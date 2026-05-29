import { ReactNode } from "react";
import Navbar from "@/components/landing/Navbar";
import WelcomeScreen from "@/components/landing/WelcomeScreen";
import { MagneticCursor } from "@/components/ui/magnetic-cursor";

export default function LandingLayout({ children }: { children: ReactNode }) {
  // The CinematicFooter is rendered inline at the end of the landing page so
  // the curtain-reveal scroll effect works correctly (it needs to be in
  // normal document flow). We drop the static Footer here.
  return (
    <WelcomeScreen>
      <MagneticCursor
        magneticFactor={0.55}
        blendMode="exclusion"
        cursorSize={30}
        cursorColor="white"
        hoverPadding={14}
        lerpAmount={0.18}
        speedMultiplier={0.05}
        maxScaleX={1.8}
        maxScaleY={0.6}
      >
        <div className="min-h-screen relative landing-bg">
          <Navbar />
          <main>{children}</main>
        </div>
      </MagneticCursor>
    </WelcomeScreen>
  );
}
