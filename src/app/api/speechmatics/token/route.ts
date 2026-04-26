import { NextResponse } from "next/server";
import {
  createSpeechmaticsRealtimeJwt,
  getSpeechmaticsOperatingPoint,
  getSpeechmaticsRealtimeLanguage,
  getSpeechmaticsRealtimeMaxDelay,
  getSpeechmaticsRealtimeTtlSeconds,
  getSpeechmaticsRealtimeUrl
} from "@/lib/speechmatics";

export async function GET() {
  try {
    const token = await createSpeechmaticsRealtimeJwt();

    return NextResponse.json(
      {
        token,
        url: getSpeechmaticsRealtimeUrl(),
        language: getSpeechmaticsRealtimeLanguage(),
        maxDelay: getSpeechmaticsRealtimeMaxDelay(),
        ttlSeconds: getSpeechmaticsRealtimeTtlSeconds(),
        operatingPoint: getSpeechmaticsOperatingPoint() ?? null
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
