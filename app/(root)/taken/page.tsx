import Link from "next/link";

import InterviewCard from "@/components/InterviewCard";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getInterviewsByUserId } from "@/lib/actions/general.action";

const TakenInterviewsPage = async () => {
  const user = await getCurrentUser();

  if (!user?.id) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p>Please sign in to view your taken interviews.</p>
        <Button asChild className="btn-primary">
          <Link href="/" prefetch>Go to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const userInterviews = await getInterviewsByUserId(user.id);
  const hasPastInterviews = (userInterviews?.length || 0) > 0;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h2>Taken Interviews</h2>
        <Button asChild className="btn-primary">
          <Link href="/interview" prefetch>Start New Interview</Link>
        </Button>
      </div>

      <div className="interviews-section">
        {hasPastInterviews ? (
          userInterviews?.map((interview) => (
            <InterviewCard
              key={interview.id}
              userId={user.id}
              interviewId={interview.id}
              role={interview.role}
              type={interview.type}
              techstack={interview.techstack}
              createdAt={interview.createdAt}
            />
          ))
        ) : (
          <p>You haven&apos;t taken any interviews yet.</p>
        )}
      </div>
    </section>
  );
};

export default TakenInterviewsPage;
