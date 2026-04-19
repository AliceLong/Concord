import { NextResponse } from "next/server";
import { getDashboardPayload } from "@/server/services/dashboard";

export async function GET() {
  try {
    const dashboard = await getDashboardPayload();
    return NextResponse.json({ dashboard });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
