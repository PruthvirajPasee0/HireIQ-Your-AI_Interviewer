import InterviewForm from "@/components/InterviewForm";
import { getCurrentUser } from "@/lib/actions/auth.action";

const Page = async () => {
  const user = await getCurrentUser();

  return (
    <>
      <h3>Interview generation</h3>
      {user?.id ? (
        <InterviewForm userId={user.id} />
      ) : (
        <p>Please sign in to generate an interview.</p>
      )}
    </>
  );
};

export default Page;
