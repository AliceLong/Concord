import { hasOpenAIEnv } from "@/lib/env";
import { getOpenAIClient } from "@/lib/openai";

interface TranscriptionInput {
  file: File;
  language?: string;
}

export async function transcribeUploadedAudio(input: TranscriptionInput): Promise<string> {
  if (!hasOpenAIEnv()) {
    throw new Error("OPENAI_API_KEY is missing. Configure server env before transcribing.");
  }

  const model = process.env.OPENAI_TRANSCRIPTION_MODEL ?? "whisper-1";
  const language = input.language ?? process.env.OPENAI_TRANSCRIPTION_LANGUAGE ?? "yue";

  const openai = getOpenAIClient();
  const result = await openai.audio.transcriptions.create({
    file: input.file,
    model,
    language,
    response_format: "text"
  });

  return typeof result === "string" ? result.trim() : String(result).trim();
}
