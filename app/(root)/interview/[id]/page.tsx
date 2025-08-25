import Image from "next/image";
import { redirect } from "next/navigation";

import InterviewRunner from "@/components/InterviewRunner";
import { getRandomInterviewCover } from "@/lib/utils";

import { getInterviewById } from "@/lib/actions/general.action";
import { getCurrentUser } from "@/lib/actions/auth.action";
import DisplayTechIcons from "@/components/DisplayTechIcons";

const InterviewDetails = async ({ params }: RouteParams) => {
  const { id } = await params;
  // Fetch user and interview in parallel to reduce latency
  const [user, interview] = await Promise.all([
    getCurrentUser(),
    getInterviewById(id),
  ]);
  if (!interview) redirect("/");

  // Feedback is created at the end of the interview by InterviewRunner

  return (
    <>
      <div className="flex flex-row gap-4 justify-between">
        <div className="flex flex-row gap-4 items-center max-sm:flex-col">
          <div className="flex flex-row gap-4 items-center">
            <Image
              src={getRandomInterviewCover()}
              alt="cover-image"
              width={40}
              height={40}
              className="rounded-full object-cover size-[40px]"
            />
            <h3 className="capitalize">{interview.role} Interview</h3>
          </div>

          <DisplayTechIcons techStack={interview.techstack} />
        </div>

        <p className="glass-card px-4 py-2 rounded-full h-fit text-white/90">
          {interview.type}
        </p>
      </div>

      <InterviewRunner
        userName={user?.name!}
        userId={user?.id}
        interviewId={id}
        questions={interview.questions}
      />
    </>
  );
};

export default InterviewDetails;
