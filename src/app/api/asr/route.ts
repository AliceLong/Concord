import { NextResponse } from "next/server";
import { transcribeUploadedAudio } from "@/server/services/asr";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!(audio instanceof File) || audio.size === 0) {
      return NextResponse.json({ error: "audio file is required." }, { status: 400 });
    }

    const result = await transcribeUploadedAudio(audio);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
