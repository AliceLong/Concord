import { NextResponse } from "next/server";
import { pushStreamingAudioChunk } from "@/server/services/asr-stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const sessionId = formData.get("sessionId");
    const audio = formData.get("audio");

    if (typeof sessionId !== "string" || !sessionId) {
      return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
    }

    if (!(audio instanceof File) || audio.size === 0) {
      return NextResponse.json({ error: "audio file is required." }, { status: 400 });
    }

    await pushStreamingAudioChunk(sessionId, audio);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
