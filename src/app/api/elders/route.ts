import { NextResponse } from "next/server";
import { getElderOptions } from "@/server/services/dashboard";

export async function GET() {
  try {
    const elders = await getElderOptions();
    return NextResponse.json({ elders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
