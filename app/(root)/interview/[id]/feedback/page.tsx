import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth.action";

const Feedback = async ({ params }: RouteParams) => {
  const { id } = await params;
  // Fetch user and interview in parallel to reduce latency
  const [user, interview] = await Promise.all([
    getCurrentUser(),
    getInterviewById(id),
  ]);
  if (!interview) redirect("/");

  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user?.id!,
  });

  const score = feedback?.totalScore ?? 0;
  const radius = 56; // SVG circle radius
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score));
  const dashoffset = circumference - (progress / 100) * circumference;

  const scoreColor = progress >= 75 ? "text-green-400" : progress >= 50 ? "text-yellow-400" : "text-red-400";
  const ringColor = progress >= 75 ? "stroke-green-400" : progress >= 50 ? "stroke-yellow-400" : "stroke-red-400";

  return (
    <section className="section-feedback">
      {/* Header */}
      <div className="flex flex-col gap-3 items-center text-center">
        <h1 className="text-4xl font-semibold">
          Feedback on the Interview - <span className="capitalize">{interview.role}</span> Interview
        </h1>
        <div className="flex items-center gap-5 text-sm">
          <div className="flex items-center gap-2">
            <Image src="/calendar.svg" width={20} height={20} alt="calendar" />
            <p>{feedback?.createdAt ? dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A") : "N/A"}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Score Ring */}
        <div className="glass-card p-6 flex flex-col items-center justify-center gap-4">
          <div className="relative w-[140px] h-[140px]">
            <svg width="140" height="140" className="rotate-[-90deg]">
              <circle cx="70" cy="70" r={radius} className="stroke-light-400/30" strokeWidth="10" fill="transparent" />
              <circle
                cx="70"
                cy="70"
                r={radius}
                className={`${ringColor}`}
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={dashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 rotate-0 flex items-center justify-center">
              <div className="text-center">
                <p className={`text-4xl font-bold ${scoreColor}`}>{score}</p>
                <p className="text-xs text-light-500">out of 100</p>
              </div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-light-300">Overall Impression</p>
          </div>
        </div>

        {/* Summary and Notes */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-lg font-semibold mb-2">Summary</h3>
          <p className="leading-7">{feedback?.finalAssessment}</p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="mt-6 glass-card p-6">
        <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
        <div className="flex flex-col gap-4">
          {feedback?.categoryScores?.map((category, index) => {
            const pct = Math.max(0, Math.min(100, category.score));
            const barColor = pct >= 75 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500";
            const dotColor = pct >= 75 ? "bg-green-400" : pct >= 50 ? "bg-yellow-400" : "bg-red-400";
            return (
              <div key={index} className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${dotColor}`} />
                    <p className="font-medium">{category.name}</p>
                  </div>
                  <p className="text-sm text-light-400">{category.score}/100</p>
                </div>
                <div className="h-2 w-full rounded-full bg-light-400/20">
                  <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-sm text-light-300">{category.comment}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strengths and Improvements */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-3">Strengths</h3>
          <div className="flex flex-wrap gap-2">
            {feedback?.strengths?.map((item, i) => (
              <span key={i} className="px-3 py-1 rounded-full bg-green-500/15 text-green-400 text-sm">
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-3">Areas for Improvement</h3>
          <div className="flex flex-wrap gap-2">
            {feedback?.areasForImprovement?.map((item, i) => (
              <span key={i} className="px-3 py-1 rounded-full bg-red-500/15 text-red-400 text-sm">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="buttons">
        <Button className="btn-secondary flex-1">
          <Link href="/" prefetch className="flex w-full justify-center">
            <p className="text-sm font-semibold text-primary-200 text-center">Back to dashboard</p>
          </Link>
        </Button>
        <Button className="btn-primary flex-1">
          <Link href={`/interview/${id}`} prefetch className="flex w-full justify-center">
            <p className="text-sm font-semibold text-black text-center">Retake Interview</p>
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default Feedback;
