import { NextResponse } from "next/server";
import { createStreamingAsrSession } from "@/server/services/asr-stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      mimeType?: string;
      sampleRateHertz?: number;
      audioChannelCount?: number;
    };

    const result = await createStreamingAsrSession(body);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
