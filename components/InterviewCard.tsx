import dayjs from "dayjs";
import PrefetchLink from "@/components/PrefetchLink";
import Image from "next/image";

import { Button } from "./ui/button";
import DisplayTechIcons from "./DisplayTechIcons";
import { MessageSquareText, Play } from "lucide-react";

import { cn, getRandomInterviewCover } from "@/lib/utils";
import { getFeedbackByInterviewId } from "@/lib/actions/general.action";

const InterviewCard = async ({
  interviewId,
  userId,
  role,
  type,
  techstack,
  createdAt,
}: InterviewCardProps) => {
  const feedback =
    userId && interviewId
      ? await getFeedbackByInterviewId({
          interviewId,
          userId,
        })
      : null;

  const normalizedType = /mix/gi.test(type) ? "Mixed" : type;

  const badgeColor =
    {
      Behavioral: "bg-light-400/90 backdrop-blur-sm",
      Mixed: "bg-light-600/90 backdrop-blur-sm",
      Technical: "bg-light-800/90 backdrop-blur-sm",
    }[normalizedType] || "bg-light-600/90 backdrop-blur-sm";

  const formattedDate = dayjs(
    feedback?.createdAt || createdAt || Date.now()
  ).format("MMM D, YYYY");

  return (
    <div className="group relative w-full h-auto transition-all duration-300 hover:-translate-y-0.5 hover:ring-1 hover:ring-primary-200/40 hover:shadow-2xl">
      {/* Hover glow background */}
      <div
        className="pointer-events-none absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(800px 300px at 110% -10%, rgba(59,130,246,0.14), transparent 60%)",
        }}
      />

      {/* Sign-in style glassmorphism card */}
      <div className="auth-card p-0 relative overflow-hidden">
        <div className="p-4 sm:p-5">
          {/* Type Badge - Positioned to prevent overlap */}
          <div
            className={cn(
              "absolute top-3 right-3 w-fit px-3 py-1.5 rounded-lg",
              "backdrop-blur-sm",
              badgeColor,
              "transition-all duration-300 ease-out",
              "group-hover:scale-105 motion-reduce:group-hover:scale-100"
            )}
          >
            <p className="text-xs font-semibold text-white dark:text-slate-100">
              {normalizedType}
            </p>
          </div>

          {/* Content Container */}
          <div className="flex flex-col h-full space-y-4">
            {/* Header Section */}
            <div className="flex items-start space-x-4 pr-20 sm:pr-24">
              <div className="relative flex-shrink-0">
                <Image
                  src={getRandomInterviewCover()}
                  alt="cover-image"
                  width={80}
                  height={80}
                  className="rounded-full object-cover size-20 sm:size-24 border-2 border-white/50 dark:border-slate-700/50 transition-transform duration-300 group-hover:scale-105 motion-reduce:group-hover:scale-100"
                />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-white capitalize leading-tight">
                  {role} Interview
                </h3>
                
                {/* Date & Score */}
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <Image
                      src="/calendar.svg"
                      width={16}
                      height={16}
                      alt="calendar"
                      className="opacity-70"
                    />
                    <span className="font-medium">{formattedDate}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Image 
                      src="/star.svg" 
                      width={16} 
                      height={16} 
                      alt="star" 
                      className="opacity-70"
                    />
                    <span className="font-semibold text-white">
                      {feedback?.totalScore || "---"}/100
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feedback Text */}
            <div className="flex-1 min-h-[60px]">
              <p className="text-sm sm:text-base text-white/90 leading-relaxed line-clamp-2 sm:line-clamp-3">
                {feedback?.finalAssessment ||
                  "You haven't taken this interview yet. Take it now to improve your skills."}
              </p>
            </div>

            {/* Footer Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-white/10 dark:border-slate-700/20">
              <div className="flex-1 min-w-0">
                <DisplayTechIcons 
                  techStack={techstack} 
                  className="justify-start items-center"
                />
              </div>
              
              <Button className="btn-primary w-full sm:w-auto">
                <PrefetchLink
                  href={
                    feedback
                      ? `/interview/${interviewId}/feedback`
                      : `/interview/${interviewId}`
                  }
                  className="w-full flex items-center justify-center gap-2"
                >
                  {feedback ? (
                    <>
                      <MessageSquareText size={18} />
                      <span>Check Feedback</span>
                    </>
                  ) : (
                    <>
                      <Play size={18} />
                      <span>Start Interview</span>
                    </>
                  )}
                </PrefetchLink>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewCard;
