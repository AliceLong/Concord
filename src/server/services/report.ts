import type { CareModuleId } from "@/lib/care-modules";
import { generateAiReport } from "@/lib/report-ai";
import { getElderById } from "@/server/repositories/elder";
import type { GeneratedReport } from "@/types/report";

export class ElderNotFoundError extends Error {
  constructor(elderId: string) {
    super(`Elder not found: ${elderId}`);
    this.name = "ElderNotFoundError";
  }
}

export async function createGeneratedReport(params: {
  elderId: string;
  transcript: string;
  sessionDate?: string;
  selectedModules: CareModuleId[];
}): Promise<GeneratedReport> {
  const elder = getElderById(params.elderId);

  if (!elder) {
    throw new ElderNotFoundError(params.elderId);
  }

  return generateAiReport({
    elder,
    transcript: params.transcript.trim(),
    sessionDate: params.sessionDate,
    selectedModules: params.selectedModules
  });
}
