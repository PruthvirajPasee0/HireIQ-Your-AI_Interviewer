"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "@/firebase/client";
import { getCurrentUser, signIn, signUp } from "@/lib/actions/auth.action";
import PrefetchLink from "@/components/PrefetchLink";

type FormType = "sign-in" | "sign-up";
type Role = "recruiter" | "candidate";

interface PupilProps {
  size?: number;
  maxDistance?: number;
  pupilColor?: string;
  forceLookX?: number;
  forceLookY?: number;
}

const Pupil = ({
  size = 12,
  maxDistance = 5,
  pupilColor = "black",
  forceLookX,
  forceLookY,
}: PupilProps) => {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const pupilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, []);

  const pos = (() => {
    if (!pupilRef.current) return { x: 0, y: 0 };
    if (forceLookX !== undefined && forceLookY !== undefined)
      return { x: forceLookX, y: forceLookY };
    const r = pupilRef.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = mouseX - cx;
    const dy = mouseY - cy;
    const dist = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDistance);
    const angle = Math.atan2(dy, dx);
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist };
  })();

  return (
    <div
      ref={pupilRef}
      className="rounded-full"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: pupilColor,
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        transition: "transform 0.1s ease-out",
      }}
    />
  );
};

interface EyeBallProps {
  size?: number;
  pupilSize?: number;
  maxDistance?: number;
  eyeColor?: string;
  pupilColor?: string;
  isBlinking?: boolean;
  forceLookX?: number;
  forceLookY?: number;
}

const EyeBall = ({
  size = 48,
  pupilSize = 16,
  maxDistance = 10,
  eyeColor = "white",
  pupilColor = "black",
  isBlinking = false,
  forceLookX,
  forceLookY,
}: EyeBallProps) => {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const eyeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, []);

  const pos = (() => {
    if (!eyeRef.current) return { x: 0, y: 0 };
    if (forceLookX !== undefined && forceLookY !== undefined)
      return { x: forceLookX, y: forceLookY };
    const r = eyeRef.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = mouseX - cx;
    const dy = mouseY - cy;
    const dist = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDistance);
    const angle = Math.atan2(dy, dx);
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist };
  })();

  return (
    <div
      ref={eyeRef}
      className="rounded-full flex items-center justify-center transition-all duration-150"
      style={{
        width: `${size}px`,
        height: isBlinking ? "2px" : `${size}px`,
        backgroundColor: eyeColor,
        overflow: "hidden",
      }}
    >
      {!isBlinking && (
        <div
          className="rounded-full"
          style={{
            width: `${pupilSize}px`,
            height: `${pupilSize}px`,
            backgroundColor: pupilColor,
            transform: `translate(${pos.x}px, ${pos.y}px)`,
            transition: "transform 0.1s ease-out",
          }}
        />
      )}
    </div>
  );
};

// Role-based palette for the left panel
const ROLE_THEME: Record<
  Role,
  {
    label: string;
    helper: string;
    gradientFrom: string;
    gradientVia: string;
    gradientTo: string;
    leadCharacter: string; // main tall rectangle character
    accentCharacter: string; // the round/yellow one in front
    submitClass: string; // tailwind classes for the submit button
  }
> = {
  recruiter: {
    label: "Recruiter",
    helper: "Hire candidates with an AI interviewer",
    gradientFrom: "#1A0F4A",
    gradientVia: "#3B1E8E",
    gradientTo: "#6C3FF5",
    leadCharacter: "#6C3FF5", // purple — recruiter
    accentCharacter: "#E8D754",
    submitClass: "bg-indigo-600 hover:bg-indigo-500 text-white",
  },
  candidate: {
    label: "Candidate",
    helper: "Practice interviews with an AI",
    gradientFrom: "#3A1A05",
    gradientVia: "#A04A0A",
    gradientTo: "#FF9B6B",
    // Coral-red so the lead character reads distinctly against the orange
    // semi-circle character in front of it (was both #FF9B6B — visually merged).
    leadCharacter: "#E0556B",
    accentCharacter: "#E8D754",
    submitClass: "bg-amber-500 hover:bg-amber-400 text-zinc-900",
  },
};

type Props = { type: FormType };

export default function AnimatedAuthForm({ type }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialRole: Role =
    searchParams.get("role") === "recruiter" ? "recruiter" : "candidate";
  const [role, setRole] = useState<Role>(initialRole);

  // Keep the URL in sync with the role toggle so the choice is visible and
  // shareable (and so refreshing the page doesn't silently reset it).
  const selectRole = (next: Role) => {
    setRole(next);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(searchParams.toString());
      params.set("role", next);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };

  const isSignIn = type === "sign-in";
  const theme = ROLE_THEME[role];

  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Animation state
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [isLeadBlinking, setIsLeadBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isLeadPeeking, setIsLeadPeeking] = useState(false);
  const leadRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const yellowRef = useRef<HTMLDivElement>(null);
  const orangeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, []);

  useEffect(() => {
    const schedule = (): NodeJS.Timeout => {
      return setTimeout(() => {
        setIsLeadBlinking(true);
        setTimeout(() => {
          setIsLeadBlinking(false);
          schedule();
        }, 150);
      }, Math.random() * 4000 + 3000);
    };
    const t = schedule();
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const schedule = (): NodeJS.Timeout => {
      return setTimeout(() => {
        setIsBlackBlinking(true);
        setTimeout(() => {
          setIsBlackBlinking(false);
          schedule();
        }, 150);
      }, Math.random() * 4000 + 3000);
    };
    const t = schedule();
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isTyping) {
      setIsLookingAtEachOther(true);
      const t = setTimeout(() => setIsLookingAtEachOther(false), 800);
      return () => clearTimeout(t);
    }
    setIsLookingAtEachOther(false);
  }, [isTyping]);

  useEffect(() => {
    if (password.length > 0 && showPassword) {
      const t = setTimeout(() => {
        setIsLeadPeeking(true);
        setTimeout(() => setIsLeadPeeking(false), 800);
      }, Math.random() * 3000 + 2000);
      return () => clearTimeout(t);
    }
    setIsLeadPeeking(false);
  }, [password, showPassword, isLeadPeeking]);

  const calcPosition = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
    const r = ref.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 3;
    const dx = mouseX - cx;
    const dy = mouseY - cy;
    return {
      faceX: Math.max(-15, Math.min(15, dx / 20)),
      faceY: Math.max(-10, Math.min(10, dy / 30)),
      bodySkew: Math.max(-6, Math.min(6, -dx / 120)),
    };
  };

  const leadPos = calcPosition(leadRef);
  const blackPos = calcPosition(blackRef);
  const yellowPos = calcPosition(yellowRef);
  const orangePos = calcPosition(orangeRef);

  // Always redirect based on the user's PERSISTED role, not the local toggle.
  // The toggle is just the choice for new-account creation; for sign-in we
  // honour whatever the Firestore user doc actually says.
  const redirectAfterAuth = async () => {
    const user = await getCurrentUser();
    if (user?.role === "recruiter") {
      router.push("/recruiter");
    } else {
      router.push("/dashboard");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      if (isSignIn) {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await cred.user.getIdToken();
        if (!idToken) {
          setError("Sign in failed. Please try again.");
          return;
        }
        const res = await signIn({ email, idToken, role });
        if (res?.success === false) {
          setError(res.message || "Sign in failed");
          return;
        }
        toast.success("Signed in");
        await redirectAfterAuth();
      } else {
        if (!name.trim()) {
          setError("Name is required");
          return;
        }
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const res = await signUp({
          uid: cred.user.uid,
          name,
          email,
          password,
          role,
        });
        if (!res.success) {
          setError(res.message ?? "Failed to create account");
          return;
        }
        toast.success("Account created. Please sign in.");
        router.push(`/sign-in?role=${role}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      const userEmail = result.user.email;
      if (!idToken || !userEmail) {
        setError("Google sign-in failed");
        return;
      }
      const res = await signIn({ email: userEmail, idToken, role });
      if (res?.success === false) {
        setError(res.message || "Server sign-in failed");
        return;
      }
      toast.success("Signed in with Google");
      await redirectAfterAuth();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Force-look directions during password-shown-peek
  const passwordVisible = password.length > 0 && showPassword;
  const passwordHidden = password.length > 0 && !showPassword;
  const skewExtra = passwordHidden || isTyping ? -12 : 0;

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-zinc-950">
      {/* Left animated panel */}
      <div
        className="relative hidden lg:flex flex-col justify-between p-12 text-white overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${theme.gradientFrom} 0%, ${theme.gradientVia} 55%, ${theme.gradientTo} 100%)`,
        }}
      >
        <div className="relative z-20 flex items-center gap-2 text-lg font-semibold">
          <div className="size-9 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center">
            <Sparkles className="size-4" />
          </div>
          <span>Hireiq.ai</span>
          <span className="ml-3 text-xs uppercase tracking-wider bg-white/10 border border-white/15 px-2 py-1 rounded-full">
            {theme.label} portal
          </span>
        </div>

        <div className="relative z-20 flex items-end justify-center h-[500px]">
          <div className="relative" style={{ width: 550, height: 400 }}>
            {/* Lead character (role color) */}
            <div
              ref={leadRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: 70,
                width: 180,
                height:
                  isTyping || passwordHidden ? 440 : 400,
                backgroundColor: theme.leadCharacter,
                borderRadius: "10px 10px 0 0",
                zIndex: 1,
                transform: passwordVisible
                  ? "skewX(0deg)"
                  : isTyping || passwordHidden
                  ? `skewX(${(leadPos.bodySkew || 0) + skewExtra}deg) translateX(40px)`
                  : `skewX(${leadPos.bodySkew || 0}deg)`,
                transformOrigin: "bottom center",
              }}
            >
              <div
                className="absolute flex gap-8 transition-all duration-700 ease-in-out"
                style={{
                  left: passwordVisible
                    ? 20
                    : isLookingAtEachOther
                    ? 55
                    : 45 + leadPos.faceX,
                  top: passwordVisible
                    ? 35
                    : isLookingAtEachOther
                    ? 65
                    : 40 + leadPos.faceY,
                }}
              >
                <EyeBall
                  size={18}
                  pupilSize={7}
                  maxDistance={5}
                  pupilColor="#2D2D2D"
                  isBlinking={isLeadBlinking}
                  forceLookX={
                    passwordVisible
                      ? isLeadPeeking
                        ? 4
                        : -4
                      : isLookingAtEachOther
                      ? 3
                      : undefined
                  }
                  forceLookY={
                    passwordVisible
                      ? isLeadPeeking
                        ? 5
                        : -4
                      : isLookingAtEachOther
                      ? 4
                      : undefined
                  }
                />
                <EyeBall
                  size={18}
                  pupilSize={7}
                  maxDistance={5}
                  pupilColor="#2D2D2D"
                  isBlinking={isLeadBlinking}
                  forceLookX={
                    passwordVisible
                      ? isLeadPeeking
                        ? 4
                        : -4
                      : isLookingAtEachOther
                      ? 3
                      : undefined
                  }
                  forceLookY={
                    passwordVisible
                      ? isLeadPeeking
                        ? 5
                        : -4
                      : isLookingAtEachOther
                      ? 4
                      : undefined
                  }
                />
              </div>
            </div>

            {/* Black character */}
            <div
              ref={blackRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: 240,
                width: 120,
                height: 310,
                backgroundColor: "#2D2D2D",
                borderRadius: "8px 8px 0 0",
                zIndex: 2,
                transform: passwordVisible
                  ? "skewX(0deg)"
                  : isLookingAtEachOther
                  ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
                  : isTyping || passwordHidden
                  ? `skewX(${(blackPos.bodySkew || 0) * 1.5}deg)`
                  : `skewX(${blackPos.bodySkew || 0}deg)`,
                transformOrigin: "bottom center",
              }}
            >
              <div
                className="absolute flex gap-6 transition-all duration-700 ease-in-out"
                style={{
                  left: passwordVisible ? 10 : isLookingAtEachOther ? 32 : 26 + blackPos.faceX,
                  top: passwordVisible ? 28 : isLookingAtEachOther ? 12 : 32 + blackPos.faceY,
                }}
              >
                <EyeBall
                  size={16}
                  pupilSize={6}
                  maxDistance={4}
                  pupilColor="#2D2D2D"
                  isBlinking={isBlackBlinking}
                  forceLookX={passwordVisible ? -4 : isLookingAtEachOther ? 0 : undefined}
                  forceLookY={passwordVisible ? -4 : isLookingAtEachOther ? -4 : undefined}
                />
                <EyeBall
                  size={16}
                  pupilSize={6}
                  maxDistance={4}
                  pupilColor="#2D2D2D"
                  isBlinking={isBlackBlinking}
                  forceLookX={passwordVisible ? -4 : isLookingAtEachOther ? 0 : undefined}
                  forceLookY={passwordVisible ? -4 : isLookingAtEachOther ? -4 : undefined}
                />
              </div>
            </div>

            {/* Orange semi-circle */}
            <div
              ref={orangeRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: 0,
                width: 240,
                height: 200,
                zIndex: 3,
                backgroundColor: "#FF9B6B",
                borderRadius: "120px 120px 0 0",
                transform: passwordVisible
                  ? "skewX(0deg)"
                  : `skewX(${orangePos.bodySkew || 0}deg)`,
                transformOrigin: "bottom center",
              }}
            >
              <div
                className="absolute flex gap-8 transition-all duration-200 ease-out"
                style={{
                  left: passwordVisible ? 50 : 82 + (orangePos.faceX || 0),
                  top: passwordVisible ? 85 : 90 + (orangePos.faceY || 0),
                }}
              >
                <Pupil
                  size={12}
                  maxDistance={5}
                  pupilColor="#2D2D2D"
                  forceLookX={passwordVisible ? -5 : undefined}
                  forceLookY={passwordVisible ? -4 : undefined}
                />
                <Pupil
                  size={12}
                  maxDistance={5}
                  pupilColor="#2D2D2D"
                  forceLookX={passwordVisible ? -5 : undefined}
                  forceLookY={passwordVisible ? -4 : undefined}
                />
              </div>
            </div>

            {/* Yellow accent character */}
            <div
              ref={yellowRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: 310,
                width: 140,
                height: 230,
                backgroundColor: theme.accentCharacter,
                borderRadius: "70px 70px 0 0",
                zIndex: 4,
                transform: passwordVisible
                  ? "skewX(0deg)"
                  : `skewX(${yellowPos.bodySkew || 0}deg)`,
                transformOrigin: "bottom center",
              }}
            >
              <div
                className="absolute flex gap-6 transition-all duration-200 ease-out"
                style={{
                  left: passwordVisible ? 20 : 52 + (yellowPos.faceX || 0),
                  top: passwordVisible ? 35 : 40 + (yellowPos.faceY || 0),
                }}
              >
                <Pupil
                  size={12}
                  maxDistance={5}
                  pupilColor="#2D2D2D"
                  forceLookX={passwordVisible ? -5 : undefined}
                  forceLookY={passwordVisible ? -4 : undefined}
                />
                <Pupil
                  size={12}
                  maxDistance={5}
                  pupilColor="#2D2D2D"
                  forceLookX={passwordVisible ? -5 : undefined}
                  forceLookY={passwordVisible ? -4 : undefined}
                />
              </div>
              <div
                className="absolute w-20 h-[4px] bg-[#2D2D2D] rounded-full transition-all duration-200 ease-out"
                style={{
                  left: passwordVisible ? 10 : 40 + (yellowPos.faceX || 0),
                  top: passwordVisible ? 88 : 88 + (yellowPos.faceY || 0),
                }}
              />
            </div>
          </div>
        </div>

        <div className="relative z-20 flex items-center gap-6 text-sm text-white/60">
          <span>Hireiq.ai — {theme.helper}</span>
        </div>

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/4 right-1/4 size-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 size-96 bg-white/5 rounded-full blur-3xl" />
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center p-8 bg-zinc-950 text-white">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 text-lg font-semibold mb-8">
            <Image src="/logo.svg" alt="logo" height={28} width={32} />
            <span>Hireiq.ai</span>
          </div>

          {/* Role switcher */}
          <div className="mb-8 flex justify-center">
            <div className="inline-flex items-center gap-1 rounded-full bg-white/5 p-1 border border-white/10">
              {(["candidate", "recruiter"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => selectRole(r)}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
                    role === r
                      ? r === "recruiter"
                        ? "bg-indigo-600 text-white"
                        : "bg-amber-500 text-zinc-900"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  {ROLE_THEME[r].label}
                </button>
              ))}
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {isSignIn ? "Welcome back" : `Join as a ${theme.label}`}
            </h1>
            <p className="text-white/60 text-sm">
              {isSignIn ? "Please enter your details" : theme.helper}
            </p>
          </div>

          {/* Sign-in/up tabs */}
          <div className="flex justify-center mb-6">
            <nav
              className="inline-flex items-center gap-1 rounded-full bg-white/5 p-1 border border-white/10"
              role="tablist"
            >
              <PrefetchLink
                href={`/sign-in?role=${role}`}
                className={`px-4 py-2 rounded-full text-sm transition ${
                  isSignIn ? "bg-white/15 text-white" : "text-white/70 hover:text-white"
                }`}
              >
                Sign in
              </PrefetchLink>
              <PrefetchLink
                href={`/sign-up?role=${role}`}
                className={`px-4 py-2 rounded-full text-sm transition ${
                  !isSignIn ? "bg-white/15 text-white" : "text-white/70 hover:text-white"
                }`}
              >
                Sign up
              </PrefetchLink>
            </nav>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isSignIn && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-white/85">
                  Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                  required
                  className="h-12 bg-white/5 border border-white/15 text-white placeholder:text-white/40 focus-visible:border-white/40"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-white/85">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                required
                className="h-12 bg-white/5 border border-white/15 text-white placeholder:text-white/40 focus-visible:border-white/40"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-white/85">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                  required
                  className="h-12 pr-10 bg-white/5 border border-white/15 text-white placeholder:text-white/40 focus-visible:border-white/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            {isSignIn && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={remember}
                    onCheckedChange={(v) => setRemember(v === true)}
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm font-normal cursor-pointer text-white/70"
                  >
                    Remember me
                  </Label>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 text-sm text-red-300 bg-red-950/30 border border-red-900/40 rounded-lg">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className={`w-full h-12 text-base font-medium ${theme.submitClass}`}
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Please wait..." : isSignIn ? "Sign in" : "Create account"}
            </Button>
          </form>

          {/* Google */}
          <div className="mt-5">
            <Button
              variant="outline"
              type="button"
              onClick={handleGoogle}
              disabled={isLoading}
              className="w-full h-12 bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/15"
            >
              <Image
                src="/google.svg"
                alt="Google"
                width={18}
                height={18}
                className="mr-2"
              />
              Continue with Google
            </Button>
          </div>

          {/* Switch */}
          <div className="text-center text-sm text-white/60 mt-8">
            {isSignIn ? "Don't have an account?" : "Already have an account?"}{" "}
            <PrefetchLink
              href={isSignIn ? `/sign-up?role=${role}` : `/sign-in?role=${role}`}
              className="text-white font-medium hover:underline"
            >
              {isSignIn ? "Sign up" : "Sign in"}
            </PrefetchLink>
          </div>
        </div>
      </div>
    </div>
  );
}
