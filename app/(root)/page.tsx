import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import InterviewCard from "@/components/InterviewCard";

import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  getInterviewsByUserId,
  getLatestInterviews,
} from "@/lib/actions/general.action";

async function Home() {
  const user = await getCurrentUser();

  const [userInterviews, allInterview] = await Promise.all([
    getInterviewsByUserId(user?.id!),
    getLatestInterviews({ userId: user?.id! }),
  ]);

  const hasPastInterviews = userInterviews?.length! > 0;
  const hasUpcomingInterviews = allInterview?.length! > 0;

  return (
    <>
      {/* User Profile Section */}
      <section className="hero-banner">
        <div className="flex items-center justify-between gap-6 w-full">
          <div className="flex items-center gap-6">
            <Image 
              src={user?.profileURL || "/user-avatar.png"} 
              alt="User profile" 
              width={64} 
              height={64} 
              className="rounded-full object-cover size-16 border-2 border-white/30"
            />
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold">Welcome back, {user?.name || "User"}!</h2>
            </div>
          </div>
          
          <div className="glass-card px-6 py-4 rounded-2xl border border-white/10 backdrop-blur-xl bg-white/[0.06] shadow-lg">
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-white/70">Interviews completed:</span>
                <span className="font-semibold text-white">{userInterviews?.length || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/70">Last practice:</span>
                <span className="font-semibold text-white">
                  {userInterviews?.[0]?.createdAt ? new Date(userInterviews[0].createdAt).toLocaleDateString() : "Never"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="hero-banner">
        <div className="flex flex-col gap-4 max-w-2xl">
          <h2>Get Interview-Ready with AI-Powered Practice & Feedback</h2>
          <p className="text-lg">Practice real interview questions & get instant feedback</p>
          <div className="flex items-center gap-3">
            <Button asChild className="btn-primary max-sm:w-full">
              <Link href="/interview" prefetch>Start an Interview</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <h2>Your Interviews</h2>

        <div className="interviews-section p-0">
          {hasPastInterviews ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userInterviews?.map((interview) => (
                <div key={interview.id} className="transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20">
                  <InterviewCard
                    userId={user?.id}
                    interviewId={interview.id}
                    role={interview.role}
                    type={interview.type}
                    techstack={interview.techstack}
                    createdAt={interview.createdAt}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p>You haven&apos;t taken any interviews yet</p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <h2>Take Interviews</h2>

        <div className="interviews-section p-0">
          {hasUpcomingInterviews ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allInterview?.map((interview) => (
                <div key={interview.id} className="transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20">
                  <InterviewCard
                    userId={user?.id}
                    interviewId={interview.id}
                    role={interview.role}
                    type={interview.type}
                    techstack={interview.techstack}
                    createdAt={interview.createdAt}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p>There are no interviews available</p>
          )}
        </div>
      </section>
    </>
  );
}

export default Home;
