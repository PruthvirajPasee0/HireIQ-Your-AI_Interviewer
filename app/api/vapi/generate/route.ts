export async function POST(request: Request) {
  void request;
  return Response.json(
    {
      success: false,
      error:
        "Deprecated endpoint. Use /api/generate-interview instead.",
    },
    { status: 410 }
  );
}

export async function GET() {
  return Response.json(
    {
      success: false,
      error:
        "Deprecated endpoint. Use /api/generate-interview instead.",
    },
    { status: 410 }
  );
}
