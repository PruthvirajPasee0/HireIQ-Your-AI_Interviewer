import { getCurrentUser } from "@/lib/actions/auth.action";
import { enforceRateLimit } from "@/lib/rate-limit";

// Follow-ups disabled: no model or schema needed
const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    const rateLimit = await enforceRateLimit({
      namespace: "next-question",
      key: user.id,
      limit: 600,
      windowMs: 60 * 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return Response.json(
        { success: false, error: "Rate limit exceeded. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        }
      );
    }

    const { messages, baseQuestion, remainingCount } = await request.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { success: false, error: "Missing conversation messages" },
        { status: 400 }
      );
    }

    const budget = typeof remainingCount === "number" ? remainingCount : undefined;
    // If no remaining base questions, end immediately.
    if (typeof budget === "number" && budget <= 0) {
      return Response.json({ success: true, type: "end" }, { status: 200 });
    }
    // FOLLOW-UPS DISABLED: Always proceed to base question if present; otherwise end.
    if (baseQuestion) {
      return Response.json({ success: true, type: "base" }, { status: 200 });
    }
    return Response.json({ success: true, type: "end" }, { status: 200 });

    // Note: Model-based decision disabled since follow-ups are off.
  } catch (error: unknown) {
    console.error("/api/next-question error:", error);
    return Response.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
