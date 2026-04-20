import { NextResponse } from "next/server";
import { transcribeUploadedAudio } from "@/server/services/asr";

function parseOptionalNumber(value: FormDataEntryValue | null): number | undefined {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audio = formData.get("audio");
    const mimeType = formData.get("mimeType");
    const sampleRateHertz = parseOptionalNumber(formData.get("sampleRateHertz"));
    const audioChannelCount = parseOptionalNumber(formData.get("audioChannelCount"));

    if (!(audio instanceof File) || audio.size === 0) {
      return NextResponse.json({ error: "audio file is required." }, { status: 400 });
    }

    const result = await transcribeUploadedAudio(audio, {
      mimeType: typeof mimeType === "string" ? mimeType : audio.type,
      sampleRateHertz,
      audioChannelCount
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
