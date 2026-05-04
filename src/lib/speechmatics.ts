import { createSpeechmaticsJWT } from "@speechmatics/auth";

type SpeechmaticsRegion = "eu" | "usa" | "au";
type SpeechmaticsOperatingPoint = "standard" | "enhanced";

function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getSpeechmaticsApiKey(): string {
  const apiKey = process.env.SPEECHMATICS_API_KEY;

  if (!apiKey) {
    throw new Error("SPEECHMATICS_API_KEY is missing.");
  }

  return apiKey;
}

export function getSpeechmaticsRealtimeUrl(): string {
  return process.env.SPEECHMATICS_RT_URL ?? "wss://eu2.rt.speechmatics.com/v2";
}

export function getSpeechmaticsRealtimeLanguage(): string {
  return process.env.SPEECHMATICS_RT_LANGUAGE ?? "yue";
}

export function getSpeechmaticsRealtimeTtlSeconds(): number {
  return parseNumber(process.env.SPEECHMATICS_RT_TTL_SECONDS, 60);
}

export function getSpeechmaticsRealtimeMaxDelay(): number {
  return parseNumber(process.env.SPEECHMATICS_RT_MAX_DELAY, 0.7);
}

export function getSpeechmaticsOperatingPoint(): SpeechmaticsOperatingPoint | undefined {
  const operatingPoint = process.env.SPEECHMATICS_RT_OPERATING_POINT;

  if (operatingPoint === "standard" || operatingPoint === "enhanced") {
    return operatingPoint;
  }

  return undefined;
}

export function getSpeechmaticsRegion(): SpeechmaticsRegion | undefined {
  const region = process.env.SPEECHMATICS_REGION;

  if (region === "eu" || region === "usa" || region === "au") {
    return region;
  }

  return undefined;
}

export async function createSpeechmaticsRealtimeJwt(): Promise<string> {
  return await createSpeechmaticsJWT({
    type: "rt",
    apiKey: getSpeechmaticsApiKey(),
    ttl: getSpeechmaticsRealtimeTtlSeconds(),
    region: getSpeechmaticsRegion()
  });
}
