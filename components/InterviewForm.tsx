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
    <div className="glass-panel lg:min-w-[600px] w-full max-w-2xl mx-auto">
      <div className="flex flex-col gap-8 py-12 px-10 w-full">
        <div className="text-center">
          <h3 className="text-3xl font-bold mb-3">Create Your Interview</h3>
          <p className="text-white/80 text-lg leading-relaxed tracking-wide">
            Provide details and we will generate tailored questions with Gemini
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6 form">
            <div className="space-y-2">
              <FormField 
                control={form.control} 
                name="role" 
                label="Role" 
                placeholder="e.g., Frontend Developer" 
              />
            </div>

            {/* Level */}
            <div className="space-y-3">
              <label className="label text-white font-medium tracking-wide">Experience Level</label>
              <select
                className="input w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                {...form.register("level")}
              >
                <option value="junior" className="bg-slate-900 text-white">Junior</option>
                <option value="midlevel" className="bg-slate-900 text-white">Midlevel</option>
                <option value="senior" className="bg-slate-900 text-white">Senior</option>
              </select>
            </div>

            {/* Type */}
            <div className="space-y-3">
              <label className="label text-white font-medium tracking-wide">Interview Type</label>
              <select
                className="input w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                {...form.register("type")}
              >
                <option value="behavioral" className="bg-slate-900 text-white">Behavioral</option>
                <option value="mixed" className="bg-slate-900 text-white">Mixed</option>
                <option value="technical" className="bg-slate-900 text-white">Technical</option>
              </select>
            </div>

            <div className="space-y-3">
              <FormField 
                control={form.control} 
                name="amount" 
                label="Number of Questions" 
                type="text" 
                placeholder="e.g., 10" 
              />
            </div>

            <div className="space-y-3">
              <FormField 
                control={form.control} 
                name="techstack" 
                label="Tech Stack" 
                placeholder="e.g., React, TypeScript, Next.js" 
              />
            </div>

            <Button 
              className="
                relative w-full
                bg-gradient-to-r from-indigo-600 to-purple-600
                hover:from-indigo-700 hover:to-purple-700
                text-white font-semibold text-lg
                rounded-lg px-8 py-4
                transition-all duration-300 ease-out
                hover:shadow-lg hover:shadow-indigo-500/25
                active:scale-[0.98] active:duration-150
                motion-reduce:transition-none motion-reduce:hover:scale-100
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                dark:focus:ring-offset-slate-900
                mt-4
              "
              type="submit"
            >
              Generate Interview
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
