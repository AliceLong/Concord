import { transcribeAudio } from "@/lib/asr-client";
import type { AsrTranscription } from "@/types/report";

export async function transcribeUploadedAudio(file: File): Promise<AsrTranscription> {
  if (file.size === 0) {
    throw new Error("audio file is required.");
  }

  return transcribeAudio(file);
}
