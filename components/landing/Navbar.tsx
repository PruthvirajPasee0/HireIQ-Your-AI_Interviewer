"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 50);
  });

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 px-3 md:px-4"
    >
      <div
        className={`mx-auto mt-2 transition-all duration-500 ${
          scrolled
            ? "max-w-5xl rounded-2xl border border-white/10 bg-dark-100/60 backdrop-blur-xl shadow-lg px-3"
            : "max-w-7xl bg-transparent"
        }`}
      >
        <nav className="flex items-center justify-between h-14 md:h-16 px-2">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Hireiq.ai" width={28} height={24} />
            <span className="text-lg font-bold text-primary-100">
              Hireiq.ai
            </span>
          </Link>

          {/* Desktop Center Nav */}
          <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors rounded-md hover:bg-white/5"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop Right */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/sign-in"
              className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors rounded-md hover:bg-white/5"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="px-5 py-2 text-sm font-semibold text-dark-100 bg-gradient-to-b from-white via-white/95 to-white/70 rounded-lg hover:scale-105 active:scale-95 transition-all"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </button>
        </nav>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden mx-3 mt-1 rounded-2xl bg-dark-100/95 backdrop-blur-xl border border-white/10 overflow-hidden"
          >
            <div className="flex flex-col gap-1 p-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-white/60 hover:text-white transition-colors py-2.5 px-3 rounded-lg hover:bg-white/5"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-3 mt-2 border-t border-white/10">
                <Link
                  href="/sign-in"
                  className="text-sm text-white/70 hover:text-white transition-colors py-2.5 text-center rounded-lg hover:bg-white/5"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="text-sm font-semibold text-dark-100 bg-gradient-to-b from-white via-white/95 to-white/70 rounded-lg py-2.5 text-center hover:scale-[1.02] active:scale-[0.98] transition-all"
                  onClick={() => setMobileOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
