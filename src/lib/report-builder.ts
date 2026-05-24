import { getCareModulesByIds, type CareModuleId } from "@/lib/care-modules";
import { buildModuleReportText } from "@/lib/report-format";
import type { ElderlyProfile } from "@/types/elderly";
import type { FormDraftSection, GeneratedReport, ModuleReportItem } from "@/types/report";

function includesAny(text: string, keywords: readonly string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

function buildFallbackModuleReports(selectedModules: CareModuleId[], transcript: string): ModuleReportItem[] {
  const normalized = transcript.toLowerCase();
  const modules = getCareModulesByIds(selectedModules);
  const transcriptLine = transcript.trim().endsWith("。") ? transcript.trim() : `${transcript.trim()}。`;

  return modules.map((careModule) => {
    const matched = includesAny(normalized, careModule.keywords) || transcript.includes(`【${careModule.number}】`);

    return {
      moduleId: careModule.id,
      moduleTitle: careModule.title,
      serviceContent: matched ? `${careModule.fallbackLead}${transcriptLine}` : null,
      elderResponse: matched ? null : null,
      completion: matched ? "已记录" : null,
      remarks: matched ? `建议后续继续围绕${careModule.focusPoints.slice(0, 2).join("、")}进行持续观察与记录。` : null
    };
  });
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
  const formDraft: FormDraftSection = {
    attendanceCount: null,
    attendees: null,
    environmentIssue: "沒有",
    bloodPressure: null,
    heartRate: null,
    bloodOxygen: null,
    basicServices: completedServices.serviceItems.join("、") || null,
    basicServiceReason: completedServices.completion,
    cognitiveTrainingProvided: moduleReports.length > 0 ? "有" : "沒有",
    realityOrientationSharing: null,
    realityOrientationQuestioning: null,
    shortTermMemoryObjects: null,
    shortTermMemoryCards: null,
    reminiscenceTherapy: null,
    delayedRecall: null,
    verbalFluencyNaming: null,
    verbalFluencyRepeat: null,
    arithmeticTraining: null,
    associationTrainingChain: null,
    associationTrainingHint: null,
    auditoryAttentionDigits: null,
    auditoryAttentionMenu: null,
    auditoryAttentionSpotDifference: null,
    vitalSignsModule: null,
    cognitiveTrainingReason: null,
    motionTrainingProvided: options?.selectedModules.includes("fall_prevention_exercise") ? "有" : "沒有",
    motionTrainingReason: null,
    specialServiceProvided: "沒有",
    specialServiceDetail: null,
    valueAddedService: null,
    brainTraining: options?.selectedModules.includes("brain_training") ? transcript : null,
    trainingOther: null
  };

  return {
    elderId: elder.id,
    transcript,
    sessionDate: options?.sessionDate ?? null,
    selectedModules: options?.selectedModules ?? [],
    elderStatus,
    completedServices,
    moduleReports,
    summaryAndRemarks,
    formDraft,
    reportText,
    generatedAt: new Date().toISOString(),
    model: options?.model ?? null
  };
}
