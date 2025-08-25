"use client";

import { z } from "zod";
import PrefetchLink from "@/components/PrefetchLink";
import Image from "next/image";
import { toast } from "sonner";
import { auth } from "@/firebase/client";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import { signIn, signUp } from "@/lib/actions/auth.action";
import FormField from "./FormField";

const authFormSchema = (type: FormType) => {
  return z.object({
    name: type === "sign-up" ? z.string().min(3) : z.string().optional(),
    email: z.string().email(),
    password: z.string().min(3),
  });
};

const AuthForm = ({ type }: { type: FormType }) => {
  const router = useRouter();
  // Prefetch common auth routes to speed up tab switching and redirects
  useEffect(() => {
    ["/", "/sign-in", "/sign-up"].forEach((r) => {
      try { router.prefetch(r); } catch {}
    });
  }, [router]);

  const formSchema = authFormSchema(type);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (type === "sign-up") {
        const { name, email, password } = data;

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        const result = await signUp({
          uid: userCredential.user.uid,
          name: name!,
          email,
          password,
        });

        if (!result.success) {
          toast.error(result.message);
          return;
        }

        toast.success("Account created successfully. Please sign in.");
        router.prefetch("/sign-in");
        router.push("/sign-in");
      } else {
        const { email, password } = data;

        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        const idToken = await userCredential.user.getIdToken();
        if (!idToken) {
          toast.error("Sign in Failed. Please try again.");
          return;
        }

        await signIn({
          email,
          idToken,
        });

        toast.success("Signed in successfully.");
        router.prefetch("/");
        router.push("/");
      }
    } catch (error) {
      console.log(error);
      toast.error(`There was an error: ${error}`);
    }
  };

  const onGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const idToken = await result.user.getIdToken();
      const email = result.user.email;

      if (!idToken || !email) {
        toast.error("Google sign-in failed");
        return;
      }

      const res = await signIn({ email, idToken });
      if (res?.success === false) {
        toast.error(res.message || "Server sign-in failed");
        return;
      }

      toast.success("Signed in with Google");
      // Warm dashboard for instant avatar/profile update
      try { router.prefetch("/"); } catch {}
      router.push("/");
    } catch (error) {
      console.log(error);
      toast.error("Google sign-in error");
    }
  };

  const isSignIn = type === "sign-in";

  return (
    <div className="auth-card w-full max-w-[580px] mx-auto">
      <div className="flex flex-col gap-6 py-10 px-8 sm:py-12 sm:px-10">
        <div className="flex items-center gap-2 justify-center">
          <Image src="/logo.svg" alt="logo" height={32} width={38} />
          <h2 className="text-primary-100">Hireiq.ai</h2>
        </div>

        <div className="flex justify-center">
          <nav className="segmented" role="tablist" aria-label="Auth tabs">
            <PrefetchLink href="/sign-in" data-active={isSignIn ? "true" : undefined}>
              Sign In
            </PrefetchLink>
            <PrefetchLink href="/sign-up" data-active={!isSignIn ? "true" : undefined}>
              Sign Up
            </PrefetchLink>
          </nav>
        </div>

        <h3 className="text-center">Practice job interviews with AI</h3>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full space-y-6 mt-2 form"
          >
            {!isSignIn && (
              <FormField
                control={form.control}
                name="name"
                label="Name"
                placeholder="Your Name"
                type="text"
              />
            )}

            <FormField
              control={form.control}
              name="email"
              label="Email"
              placeholder="Your email address"
              type="email"
            />

            <FormField
              control={form.control}
              name="password"
              label="Password"
              placeholder="Enter your password"
              type="password"
            />

            <div className="flex justify-center">
              <Button type="submit">
                {isSignIn ? "Sign In" : "Create an Account"}
              </Button>
            </div>
          </form>
        </Form>

        <div className="flex items-center gap-2">
          <div className="h-px bg-dark-200 flex-1" />
          <span className="text-xs text-dark-400">or</span>
          <div className="h-px bg-dark-200 flex-1" />
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={onGoogleSignIn}
            className="h-10 px-4 rounded-md bg-white text-black border border-border flex items-center"
          >
            <Image src="/google.svg" alt="google" width={18} height={18} className="mr-2" />
            Continue with Google
          </button>
        </div>

        <p className="text-center">
          {isSignIn ? "No account yet?" : "Have an account already?"}
          <PrefetchLink
            href={!isSignIn ? "/sign-in" : "/sign-up"}
            className="font-bold text-user-primary ml-1"
          >
            {!isSignIn ? "Sign In" : "Sign Up"}
          </PrefetchLink>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
