import { getCareModulesByIds, type CareModuleId } from "@/lib/care-modules";
import { buildModuleReportText } from "@/lib/report-format";
import type { ElderlyProfile } from "@/types/elderly";
import type { GeneratedReport, ModuleReportItem } from "@/types/report";

function includesAny(text: string, keywords: readonly string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

function buildFallbackModuleReports(selectedModules: CareModuleId[], transcript: string): ModuleReportItem[] {
  const normalized = transcript.toLowerCase();
  const modules = getCareModulesByIds(selectedModules);

  const matchedModules = modules.filter(
    (module) => includesAny(normalized, module.keywords) || selectedModules.length === 1
  );
  const effectiveModules = matchedModules.length > 0 ? matchedModules : modules.slice(0, 1);
  const transcriptLine = transcript.trim().endsWith("。") ? transcript.trim() : `${transcript.trim()}。`;

  return effectiveModules.map((module) => ({
    moduleId: module.id,
    moduleTitle: module.title,
    serviceContent: `${module.fallbackLead}${transcriptLine}`,
    elderResponse: null,
    completion: "已记录",
    remarks: `建议后续继续围绕${module.focusPoints.slice(0, 2).join("、")}进行持续观察与记录。`
  }));
}

export function generateReport(
  elder: ElderlyProfile,
  transcript: string,
  options?: {
    sessionDate?: string;
    selectedModules: CareModuleId[];
    model?: string | null;
  }
): GeneratedReport {
  const moduleReports = buildFallbackModuleReports(options?.selectedModules ?? [], transcript);
  const elderStatus = {
    statusTags: [],
    interactionPerformance: null,
    physicalCondition: transcript.trim() ? "已根据确认文本整理" : null
  };
  const completedServices = {
    serviceItems: moduleReports.map((item) => item.moduleTitle),
    completion: transcript.trim() ? "已记录" : null,
    elderPerformance: null
  };
  const summaryAndRemarks = {
    summary: transcript.trim()
      ? `${elder.fullName} 本次照护记录已整理完成，重点涉及${moduleReports.map((item) => item.moduleTitle).join("、")}。`
      : `${elder.fullName} 本次照护未记录到有效文字内容。`,
    incident: null,
    recommendation: null
  };
  const reportText = buildModuleReportText({
    elder,
    sessionDate: options?.sessionDate,
    transcript,
    elderStatus,
    completedServices,
    moduleReports,
    summaryAndRemarks
  });

  return {
    elderId: elder.id,
    transcript,
    sessionDate: options?.sessionDate ?? null,
    selectedModules: options?.selectedModules ?? [],
    elderStatus,
    completedServices,
    moduleReports,
    summaryAndRemarks,
    reportText,
    generatedAt: new Date().toISOString(),
    model: options?.model ?? null
  };
}
