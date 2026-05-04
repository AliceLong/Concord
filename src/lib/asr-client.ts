import type {AsrTranscription, AudioInputMetadata} from "@/types/report";
import {
  getImplicitRecognizerName,
  getSpeechClient,
  type SpeechRecognitionConfig
} from "@/lib/google-client";
import type {protos} from "@google-cloud/speech";

export function getAsrModel(): string {
  return process.env.GOOGLE_ASR_MODEL ?? "chirp_3";
}

function getExplicitDecodingConfig(
  mimeType: string,
  metadata?: AudioInputMetadata
): protos.google.cloud.speech.v2.IExplicitDecodingConfig | null {
  const sampleRateHertz = metadata?.sampleRateHertz;
  const audioChannelCount = metadata?.audioChannelCount;

  if (!sampleRateHertz || !audioChannelCount) {
    return null;
  }

  const normalized = mimeType.toLowerCase();
  const encoding =
    normalized.includes("webm") ? "WEBM_OPUS" :
    normalized.includes("ogg") ? "OGG_OPUS" :
    normalized.includes("audio/mp4") || normalized.includes("video/mp4") ? "MP4_AAC" :
    normalized.includes("audio/x-m4a") || normalized.includes("audio/m4a") ? "M4A_AAC" :
    normalized.includes("wav") ? "LINEAR16" :
    null;

  if (!encoding) {
    return null;
  }

  return {
    encoding,
    sampleRateHertz,
    audioChannelCount
  };
}

export function buildRecognitionConfig(
  metadata?: AudioInputMetadata
): SpeechRecognitionConfig {
  const explicitDecodingConfig = getExplicitDecodingConfig(metadata?.mimeType ?? "application/octet-stream", metadata);

  return {
    ...(explicitDecodingConfig ? {explicitDecodingConfig} : {autoDecodingConfig: {}}),
    languageCodes: [process.env.GOOGLE_ASR_LANGUAGE ?? "yue-Hant-HK"],
    model: getAsrModel()
  };
}

export async function transcribeAudio(
  file: File,
  metadata?: AudioInputMetadata
): Promise<AsrTranscription> {
  const client = getSpeechClient();
  const model = getAsrModel();
  const buffer = Buffer.from(await file.arrayBuffer());
  const baseRequest = {
    recognizer: getImplicitRecognizerName(),
    content: buffer
  };

  let recognizeResponse: protos.google.cloud.speech.v2.IRecognizeResponse | undefined;

  try {
    const response = await client.recognize({
      ...baseRequest,
      config: buildRecognitionConfig({
        ...metadata,
        mimeType: metadata?.mimeType || file.type || "application/octet-stream"
      })
    });
    recognizeResponse = response[0];
  } catch (error) {
    const response = await client.recognize({
      ...baseRequest,
      config: {
        autoDecodingConfig: {},
        languageCodes: [process.env.GOOGLE_ASR_LANGUAGE ?? "yue-Hant-HK"],
        model
      }
    });
    recognizeResponse = response[0];

    if (!recognizeResponse && error instanceof Error) {
      throw error;
    }
  }

  const transcript = (recognizeResponse.results ?? [])
    .flatMap((result: protos.google.cloud.speech.v2.ISpeechRecognitionResult) => result.alternatives ?? [])
    .map((alternative: protos.google.cloud.speech.v2.ISpeechRecognitionAlternative) => alternative.transcript?.trim() ?? "")
    .filter(Boolean)
    .join("\n")
    .trim();

  if (!transcript) {
    throw new Error("Google Speech-to-Text returned an empty transcript.");
  }

  return {
    transcript,
    model
  };
}
