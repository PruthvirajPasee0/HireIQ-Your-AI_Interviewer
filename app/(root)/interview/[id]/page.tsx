import Image from "next/image";
import { redirect } from "next/navigation";

import { getRandomInterviewCover } from "@/lib/utils";

import { getInterviewById } from "@/lib/actions/general.action";
import { getCurrentUser } from "@/lib/actions/auth.action";
import DisplayTechIcons from "@/components/DisplayTechIcons";
import InterviewRunner from "@/components/InterviewRunner";
import { db } from "@/firebase/admin";

const InterviewDetails = async ({ params }: RouteParams) => {
  const { id } = await params;
  // Fetch user and interview in parallel to reduce latency
  const [user, interview] = await Promise.all([
    getCurrentUser(),
    getInterviewById(id),
  ]);
  if (!user) redirect("/sign-in");
  if (!interview) redirect("/dashboard");

  // Community interview templates are read-only. Clone to the current user
  // before running so feedback and transcript ownership stays strict.
  if (interview.userId !== user.id) {
    const clonedInterview: Omit<Interview, "id"> = {
      role: interview.role,
      type: interview.type,
      techstack: interview.techstack,
      level: interview.level,
      questions: interview.questions,
      userId: user.id,
      finalized: true,
      coverImage: interview.coverImage,
      createdAt: new Date().toISOString(),
    };

    const clonedDoc = await db.collection("interviews").add(clonedInterview);
    redirect(`/interview/${clonedDoc.id}`);
  }

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
        userName={user.name}
        interviewId={id}
        questions={interview.questions}
      />
    </>
  );
};

export default InterviewDetails;
