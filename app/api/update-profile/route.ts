import { NextRequest, NextResponse } from "next/server";
import { updateUserProfile } from "@/lib/actions/auth.action";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, profileURL } = body ?? {};
    const result = await updateUserProfile({ name, profileURL });
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message || "Failed" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
  }
}
