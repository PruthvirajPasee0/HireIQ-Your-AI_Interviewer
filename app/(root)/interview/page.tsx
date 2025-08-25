import InterviewForm from "@/components/InterviewForm";
import { getCurrentUser } from "@/lib/actions/auth.action";

const Page = async () => {
  const user = await getCurrentUser();

  return (
    <section className="flex flex-col items-center justify-center min-h-screen py-12 px-4">
      <div className="w-full max-w-4xl">
        {user?.id ? (
          <InterviewForm userId={user.id} />
        ) : (
          <div className="text-center space-y-6">
            <h3 className="text-4xl font-bold mb-4">Interview Generation</h3>
            <p className="text-white/80 text-lg leading-relaxed">
              Please sign in to generate an interview.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Page;
