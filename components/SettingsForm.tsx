"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type SettingsFormValues = {
  name: string;
  profileURL: string;
};

const inputCls =
  "input w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-transparent transition-all duration-200";

export default function SettingsForm({
  user,
}: {
  user: (Partial<User> & { profileURL?: string }) | null;
}) {
  const router = useRouter();
  const form = useForm<SettingsFormValues>({
    defaultValues: {
      name: user?.name || "",
      profileURL: user?.profileURL || "",
    },
  });

  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(values: SettingsFormValues) {
    try {
      setSubmitting(true);
      const res = await fetch("/api/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.message || "Failed to update");
      toast.success("Profile updated");
      router.refresh();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="label text-white font-medium tracking-wide">
                Name
              </FormLabel>
              <FormControl>
                <Input className={inputCls} placeholder="Your name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="profileURL"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="label text-white font-medium tracking-wide">
                Profile picture URL
              </FormLabel>
              <FormControl>
                <Input className={inputCls} placeholder="https://..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
