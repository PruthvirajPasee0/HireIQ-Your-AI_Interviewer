"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import FormField from "@/components/FormField";

const schema = z.object({
  role: z.string().min(2),
  level: z.enum(["junior", "midlevel", "senior"]).default("junior"),
  type: z.enum(["behavioral", "mixed", "technical"]).default("mixed"),
  amount: z.coerce.number().min(1).max(50),
  techstack: z.string().min(1),
});

export default function InterviewForm({ userId }: { userId: string }) {
  const router = useRouter();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: "",
      level: "junior",
      type: "mixed",
      amount: 10,
      techstack: "React, TypeScript, Next.js",
    },
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      const res = await fetch("/api/generate-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, userid: userId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed");

      toast.success("Interview generated");
      try { router.prefetch(`/interview/${data.id}`); } catch {}
      router.push(`/interview/${data.id}`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to generate interview");
    }
  };

  return (
    <div className="glass-panel lg:min-w-[566px] w-full">
      <div className="flex flex-col gap-6 py-10 px-8 w-full">
        <h3>Create your interview</h3>
        <p>Provide details and we will generate tailored questions with Gemini.</p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6 form">
            <FormField control={form.control} name="role" label="Role" placeholder="e.g., Frontend Developer" />

            {/* Level */}
            <div className="space-y-2">
              <label className="label">Level</label>
              <select
                className="input"
                {...form.register("level")}
              >
                <option value="junior">Junior</option>
                <option value="midlevel">Midlevel</option>
                <option value="senior">Senior</option>
              </select>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <label className="label">Interview Type</label>
              <select
                className="input"
                {...form.register("type")}
              >
                <option value="behavioral">Behavioral</option>
                <option value="mixed">Mixed</option>
                <option value="technical">Technical</option>
              </select>
            </div>

            <FormField control={form.control} name="amount" label="Number of Questions" type="text" placeholder="e.g., 10" />

            <FormField control={form.control} name="techstack" label="Tech Stack" placeholder="e.g., React, TypeScript, Next.js" />

            <Button className="btn" type="submit">Generate</Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
