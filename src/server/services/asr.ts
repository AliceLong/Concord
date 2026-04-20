import { transcribeAudio } from "@/lib/asr-client";
import type { AsrTranscription, AudioInputMetadata } from "@/types/report";

export async function transcribeUploadedAudio(
  file: File,
  metadata?: AudioInputMetadata
): Promise<AsrTranscription> {
  if (file.size === 0) {
    throw new Error("audio file is required.");
  }

  return transcribeAudio(file, metadata);
}
