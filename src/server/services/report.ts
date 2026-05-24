import type { CareModuleId } from "@/lib/care-modules";
import {
  buildCombinedTranscriptFromResults,
  buildExerciseText
} from "@/lib/report-analysis";
import { analyzeModulesWithLlm, generateAiReport } from "@/lib/report-ai";
import { getElderById } from "@/server/repositories/elder";
import type { GeneratedReport } from "@/types/report";
import type { ExerciseResult, ModuleRecognitionResult } from "@/lib/report-session-storage";

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

export async function analyzeReportModules(params: {
  elderId: string;
  transcript: string;
  sessionDate?: string;
  selectedModules: CareModuleId[];
}): Promise<{ moduleResults: ModuleRecognitionResult[] }> {
  const elder = getElderById(params.elderId);

  if (!elder) {
    throw new ElderNotFoundError(params.elderId);
  }

  return {
    moduleResults: await analyzeModulesWithLlm({
      elder,
      transcript: params.transcript.trim(),
      sessionDate: params.sessionDate,
      selectedModules: params.selectedModules
    })
  };
}

export async function finalizeGeneratedReport(params: {
  elderId: string;
  selectedModules: CareModuleId[];
  moduleResults: ModuleRecognitionResult[];
  exerciseResult?: ExerciseResult;
  sessionDate?: string;
}): Promise<GeneratedReport> {
  const transcript = [
    buildCombinedTranscriptFromResults(params.moduleResults),
    buildExerciseText(params.exerciseResult)
  ]
    .filter(Boolean)
    .join("\n\n");

  return createGeneratedReport({
    elderId: params.elderId,
    transcript: transcript || "未提及",
    sessionDate: params.sessionDate,
    selectedModules: params.selectedModules
  });
}
