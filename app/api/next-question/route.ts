// Follow-ups disabled: no model or schema needed

export async function POST(request: Request) {
  try {
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
  } catch (e: any) {
    console.error("/api/next-question error:", e);
    return Response.json({ success: false, error: String(e) }, { status: 500 });
  }
}
