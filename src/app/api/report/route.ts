import { NextResponse } from "next/server";
import { z } from "zod";
import { createGeneratedReport, ElderNotFoundError } from "@/server/services/report";

const requestSchema = z.object({
  elderId: z.string().min(1),
  transcript: z.string().min(1),
  sessionDate: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const payload = requestSchema.parse(await request.json());
    const report = await createGeneratedReport(payload);

    return NextResponse.json({ report }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
    }

    if (error instanceof ElderNotFoundError) {
      return NextResponse.json({ error: "Elder not found." }, { status: 404 });
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
