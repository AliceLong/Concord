import { getCareModuleById, getCareModulesByIds, type CareModuleId } from "@/lib/care-modules";
import type { ExerciseResult, ModuleRecognitionResult } from "@/lib/report-session-storage";

function includesAny(text: string, keywords: readonly string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
}

export function buildRecognitionResults(
  selectedModules: CareModuleId[],
  moduleDrafts: Partial<Record<CareModuleId, string>>
): ModuleRecognitionResult[] {
  const combined = Object.values(moduleDrafts).join("\n").toLowerCase();

  return getCareModulesByIds(selectedModules)
    .map((careModule) => {
      const ownDraft = moduleDrafts[careModule.id]?.trim() ?? "";
      const recognized = Boolean(ownDraft) || includesAny(combined, careModule.keywords);
      const extractedText = ownDraft || (recognized ? careModule.fallbackLead : "");

      return {
        moduleId: careModule.id,
        transcript: ownDraft,
        recognized,
        extractedText,
        suggestedReportText: extractedText,
        missingReason: recognized ? undefined : "未在语音内容中识别到该模块相关描述。"
      };
    })
    .sort((a, b) => Number(a.recognized) - Number(b.recognized));
}

export function parseModuleDraftsFromTranscript(
  transcript: string,
  selectedModules: CareModuleId[]
): Partial<Record<CareModuleId, string>> {
  const drafts: Partial<Record<CareModuleId, string>> = {};
  const modules = getCareModulesByIds(selectedModules);
  const headingPattern = /【\s*(\d+)\s*】\s*([^\n]*)\n?/g;
  const matches = [...transcript.matchAll(headingPattern)];

  if (matches.length === 0) {
    return selectedModules.length === 1 ? { [selectedModules[0]]: transcript } : {};
  }

  for (const [index, match] of matches.entries()) {
    const start = (match.index ?? 0) + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index ?? transcript.length : transcript.length;
    const moduleNumber = Number(match[1]);
    const careModule = modules.find((item) => item.number === moduleNumber);

    if (careModule) {
      drafts[careModule.id] = transcript.slice(start, end).trim();
    }
  }

  return drafts;
}

export function buildAnalysisResultsFromTranscript(
  transcript: string,
  selectedModules: CareModuleId[]
): ModuleRecognitionResult[] {
  const moduleDrafts = parseModuleDraftsFromTranscript(transcript, selectedModules);

  if (Object.keys(moduleDrafts).length > 0) {
    return buildRecognitionResults(selectedModules, moduleDrafts);
  }

  const normalized = transcript.toLowerCase();

  return getCareModulesByIds(selectedModules)
    .map((careModule) => {
      const recognized = includesAny(normalized, careModule.keywords);

      return {
        moduleId: careModule.id,
        transcript: recognized ? transcript : "",
        recognized,
        extractedText: recognized ? `${careModule.fallbackLead}${transcript}` : "",
        suggestedReportText: recognized ? `${careModule.fallbackLead}${transcript}` : "",
        missingReason: recognized ? undefined : "未在语音内容中识别到该模块相关描述。"
      };
    })
    .sort((a, b) => Number(a.recognized) - Number(b.recognized));
}

export function buildExerciseText(exercise?: ExerciseResult): string {
  if (!exercise) {
    return "";
  }

  const labels: Array<[keyof ExerciseResult, string]> = [
    ["neck", "拉筋运动 [颈部]"],
    ["shoulder", "拉筋运动 [肩膊(A、B)]"],
    ["chestBack", "拉筋运动 [胸背(A、B)]"],
    ["waist", "拉筋运动 [腰部(A、B)]"],
    ["leg", "拉筋运动 [腿部(一、二)]"],
    ["heel", "拉筋运动 [脚跟]"]
  ];
  const lines = labels
    .map(([key, label]) => {
      const value = exercise[key].trim();
      return value ? `${label}：${value} 次` : "";
    })
    .filter(Boolean);

  return lines.length ? ["【10】耆力 / 防跌运动次数", ...lines].join("\n") : "";
}

export function buildCombinedTranscriptFromResults(results: ModuleRecognitionResult[]): string {
  return results
    .map((result) => {
      const careModule = getCareModuleById(result.moduleId);
      const text = (result.manualText || result.extractedText || result.transcript).trim();
      return text ? `【${careModule.number}】${careModule.title}\n${text}` : "";
    })
    .filter(Boolean)
    .join("\n\n");
}
