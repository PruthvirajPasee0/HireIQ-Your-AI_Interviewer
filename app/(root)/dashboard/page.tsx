import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { BarChart3, Clock3, Sparkles, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import InterviewCard from "@/components/InterviewCard";
import RoleSwitchButton from "@/components/RoleSwitchButton";

import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  getLatestFeedbackByInterviewIds,
  getInterviewsByUserId,
  getLatestInterviews,
} from "@/lib/actions/general.action";

async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user?.role === "recruiter") redirect("/recruiter");

  const [userInterviews, communityInterviews] = await Promise.all([
    getInterviewsByUserId(user.id),
    getLatestInterviews({ userId: user.id }),
  ]);
  const feedbackByInterviewId = await getLatestFeedbackByInterviewIds({
    userId: user.id,
    interviewIds: (userInterviews ?? []).map((interview) => interview.id),
  });

  const hasPastInterviews = (userInterviews?.length ?? 0) > 0;
  const hasCommunityInterviews = (communityInterviews?.length ?? 0) > 0;
  const completedCount = userInterviews?.length ?? 0;
  const scoredFeedback = Object.values(feedbackByInterviewId).filter(
    (feedback) => typeof feedback?.totalScore === "number"
  );
  const avgScore =
    scoredFeedback.length > 0
      ? Math.round(
          scoredFeedback.reduce((sum, feedback) => sum + feedback.totalScore, 0) /
            scoredFeedback.length
        )
      : null;
  const lastPracticeDate = userInterviews?.[0]?.createdAt
    ? new Date(userInterviews[0].createdAt).toLocaleDateString()
    : "Never";

  return (
    <>
      <section className="hero-banner">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 w-full">
          <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
            <Image
              src={user?.profileURL || "/user-avatar.png"}
              alt="User profile"
              width={64}
              height={64}
              className="rounded-full object-cover size-16 border-2 border-white/30"
            />
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold">
                Welcome back, {user?.name || "User"}!
              </h2>
              <p className="text-sm text-white/70">
                Keep practicing to improve your interview confidence.
              </p>
              <RoleSwitchButton to="recruiter" redirectTo="/recruiter" />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <Button asChild className="btn-primary max-sm:w-full">
              <Link href="/interview" prefetch>
                Start an Interview
              </Link>
            </Button>
            <Button asChild className="btn-secondary max-sm:w-full">
              <Link href="/taken" prefetch>
                View Attempts
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-5">
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <Trophy size={16} />
          </div>
          <p className="dashboard-stat-label">Completed interviews</p>
          <p className="dashboard-stat-value">{completedCount}</p>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <BarChart3 size={16} />
          </div>
          <p className="dashboard-stat-label">Average score</p>
          <p className="dashboard-stat-value">
            {avgScore !== null ? `${avgScore}/100` : "--"}
          </p>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <Clock3 size={16} />
          </div>
          <p className="dashboard-stat-label">Last practice</p>
          <p className="dashboard-stat-value text-base">{lastPracticeDate}</p>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <Sparkles size={16} />
          </div>
          <p className="dashboard-stat-label">Community sets</p>
          <p className="dashboard-stat-value">{communityInterviews?.length ?? 0}</p>
        </div>
      </section>

      <section className="hero-banner mt-6">
        <div className="flex flex-col gap-3 max-w-2xl">
          <h2>Interview Practice Workspace</h2>
          <p className="text-base text-white/75">
            Practice role-specific rounds and get instant, actionable feedback.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild className="btn-primary max-sm:w-full">
              <Link href="/interview" prefetch>
                Start fresh interview
              </Link>
            </Button>
            <Button asChild className="btn-secondary max-sm:w-full">
              <Link href="/taken" prefetch>
                Review past attempts
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <div className="flex items-center justify-between gap-2">
          <h2>Your Interviews</h2>
          <span className="text-xs rounded-full border border-white/15 px-3 py-1 text-white/70">
            {completedCount} completed
          </span>
        </div>

        <div className="interviews-section p-0">
          {hasPastInterviews ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userInterviews?.map((interview) => (
                <div
                  key={interview.id}
                  className="transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20"
                >
                  <InterviewCard
                    interviewId={interview.id}
                    role={interview.role}
                    type={interview.type}
                    techstack={interview.techstack}
                    createdAt={interview.createdAt}
                    feedback={feedbackByInterviewId[interview.id] ?? null}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-xl border border-white/10 bg-white/[0.06] p-6">
              <p className="text-white/80">
                You haven&apos;t taken any interviews yet.
              </p>
              <p className="text-sm text-white/60 mt-1">
                Start your first mock interview to unlock personalized feedback.
              </p>
              <Button asChild className="btn-primary mt-4">
                <Link href="/interview" prefetch>
                  Start now
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <div className="flex items-center justify-between gap-2">
          <h2>Community Practice Interviews</h2>
          <span className="text-xs rounded-full border border-white/15 px-3 py-1 text-white/70">
            {communityInterviews?.length ?? 0} available
          </span>
        </div>
        <p className="text-white/65 -mt-4">
          Explore interview sets generated by other candidates for extra practice.
        </p>

        <div className="interviews-section p-0">
          {hasCommunityInterviews ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communityInterviews?.map((interview) => (
                <div
                  key={interview.id}
                  className="transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20"
                >
                  <InterviewCard
                    interviewId={interview.id}
                    role={interview.role}
                    type={interview.type}
                    techstack={interview.techstack}
                    createdAt={interview.createdAt}
                    feedback={null}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-xl border border-white/10 bg-white/[0.06] p-6">
              <p className="text-white/80">
                No community interviews are available right now.
              </p>
              <p className="text-sm text-white/60 mt-1">
                Check back later for fresh practice sets.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default Home;
