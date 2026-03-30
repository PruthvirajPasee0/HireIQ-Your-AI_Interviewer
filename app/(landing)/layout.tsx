import { ReactNode } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import WelcomeScreen from "@/components/landing/WelcomeScreen";

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <WelcomeScreen>
      <div className="min-h-screen relative overflow-hidden landing-bg">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </div>
    </WelcomeScreen>
  );
}
