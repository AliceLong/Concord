import { getCareModulesByIds, type CareModuleId } from "@/lib/care-modules";
import { generateLlmText } from "@/lib/llm-client";
import { buildModuleReportText } from "@/lib/report-format";
import {
  MODULE_ANALYSIS_SYSTEM_PROMPT,
  REPORT_GENERATION_RETRY_PROMPT,
  REPORT_GENERATION_SYSTEM_PROMPT,
  buildModuleAnalysisPrompt,
  buildReportGenerationPrompt
} from "@/lib/report-prompts";
import type { ElderlyProfile } from "@/types/elderly";
import type { ModuleRecognitionResult } from "@/lib/report-session-storage";
import type {
  CompletedServicesSection,
  ElderStatusSection,
  FormDraftSection,
  GeneratedReport,
  ModuleReportItem,
  SummaryRemarksSection
} from "@/types/report";

const MODULE_TITLE_PATTERN = /^(?:【|\[)\s*(.+?)\s*(?:】|\])$/;
const SERVICE_CONTENT_LABELS = ["服務內容", "服務內容", "服務內容", "服務內容", "服務內容摘要", "服務內容摘要"];
const ELDER_RESPONSE_LABELS = ["長者反應", "長者反應", "長者表現", "長者表現", "長者回應", "長者回應"];
const COMPLETION_LABELS = ["完成情況", "完成情況", "完成狀況", "完成狀況", "完成程度", "完成進度"];
const REMARKS_LABELS = ["備註", "備註", "備註說明", "備註說明", "原因/備註", "原因／備註", "原因/備註"];
const COGNITIVE_MODULE_IDS: CareModuleId[] = [
  "reality_orientation",
  "short_term_memory",
  "reminiscence_therapy",
  "delayed_recall",
  "verbal_fluency",
  "arithmetic_training",
  "association_training",
  "auditory_attention_training",
  "brain_training"
];

const FORM_DRAFT_FIELDS: Array<{ key: keyof FormDraftSection; labels: string[] }> = [
  { key: "attendanceCount", labels: ["在場人數", "在場人數"] },
  { key: "attendees", labels: ["在場人士", "在場人士"] },
  { key: "environmentIssue", labels: ["環境異常", "環境異常"] },
  { key: "bloodPressure", labels: ["血壓", "血壓"] },
  { key: "heartRate", labels: ["心跳"] },
  { key: "bloodOxygen", labels: ["血氧"] },
  { key: "basicServices", labels: ["基本服務", "基本服務"] },
  { key: "basicServiceReason", labels: ["基本服務未完成原因", "基本服務未完成原因"] },
  { key: "cognitiveTrainingProvided", labels: ["認知訓練提供", "認知訓練提供"] },
  { key: "realityOrientationSharing", labels: ["1.0現實導向", "1.0現實導向"] },
  { key: "realityOrientationQuestioning", labels: ["1.1現實導向", "1.1現實導向"] },
  { key: "shortTermMemoryObjects", labels: ["2.0短期記憶", "2.0短期記憶"] },
  { key: "shortTermMemoryCards", labels: ["2.1短期記憶", "2.1短期記憶"] },
  { key: "reminiscenceTherapy", labels: ["3.0懷緬治療", "3.0懷緬治療"] },
  { key: "delayedRecall", labels: ["4.0延遲迴憶", "4.0延遲回憶"] },
  { key: "verbalFluencyNaming", labels: ["5.1說話流暢度", "5.1說話流暢度"] },
  { key: "verbalFluencyRepeat", labels: ["5.2說話流暢度", "5.2說話流暢度"] },
  { key: "arithmeticTraining", labels: ["6.0運算", "6.0運算"] },
  { key: "associationTrainingChain", labels: ["7.1聯想訓練", "7.1聯想訓練"] },
  { key: "associationTrainingHint", labels: ["7.2聯想訓練", "7.2聯想訓練"] },
  { key: "auditoryAttentionDigits", labels: ["8.1聽覺/專注力訓練", "8.1聽覺/專注力訓練"] },
  { key: "auditoryAttentionMenu", labels: ["8.2聽覺/專注力訓練", "8.2聽覺/專注力訓練"] },
  { key: "auditoryAttentionSpotDifference", labels: ["8.3聽覺/專注力訓練", "8.3聽覺/專注力訓練"] },
  { key: "vitalSignsModule", labels: ["9.0生命徵象", "9.0生命徵象"] },
  { key: "cognitiveTrainingReason", labels: ["認知訓練未完成原因", "認知訓練未完成原因"] },
  { key: "motionTrainingProvided", labels: ["運動訓練提供", "運動訓練提供"] },
  { key: "motionTrainingReason", labels: ["運動訓練未完成原因", "運動訓練未完成原因"] },
  { key: "specialServiceProvided", labels: ["特約專項服務", "特約專項服務"] },
  { key: "specialServiceDetail", labels: ["特約專項服務內容", "特約專項服務內容"] },
  { key: "valueAddedService", labels: ["增值服務", "增值服務"] },
  { key: "brainTraining", labels: ["健腦八式", "健腦八式"] },
  { key: "trainingOther", labels: ["其他", "Others"] }
];

function createEmptyFormDraft(): FormDraftSection {
  return {
    attendanceCount: null,
    attendees: null,
    environmentIssue: null,
    bloodPressure: null,
    heartRate: null,
    bloodOxygen: null,
    basicServices: null,
    basicServiceReason: null,
    cognitiveTrainingProvided: null,
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
    motionTrainingProvided: null,
    motionTrainingReason: null,
    specialServiceProvided: null,
    specialServiceDetail: null,
    valueAddedService: null,
    brainTraining: null,
    trainingOther: null
  };
}

function isReportParserDebugEnabled(): boolean {
  const value = process.env.DEBUG_REPORT_PARSER?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

function debugReportParser(label: string, value: unknown) {
  if (!isReportParserDebugEnabled()) {
    return;
  }

  console.info(`[report-parser] ${label}:`, value);
}

function extractJsonObject(rawText: string): unknown {
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("AI 服務返回了非 JSON 模塊分析結果。");
  }

  return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
}

function normalizeTextValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseModuleAnalysisResponse(rawText: string, selectedModules: CareModuleId[]): ModuleRecognitionResult[] {
  const parsed = extractJsonObject(rawText) as { moduleResults?: unknown };
  const selectedSet = new Set<CareModuleId>(selectedModules);
  const seen = new Set<CareModuleId>();
  const rawResults = Array.isArray(parsed.moduleResults) ? parsed.moduleResults : [];
  const normalizedResults: ModuleRecognitionResult[] = [];

  for (const rawResult of rawResults) {
    if (!rawResult || typeof rawResult !== "object") {
      continue;
    }

    const item = rawResult as Record<string, unknown>;
    const moduleId = item.moduleId as CareModuleId;

    if (!selectedSet.has(moduleId) || seen.has(moduleId)) {
      continue;
    }

    seen.add(moduleId);

    const recognized = item.recognized === true;
    const extractedText = recognized ? normalizeTextValue(item.extractedText) : "";
    const suggestedReportText = recognized ? normalizeTextValue(item.suggestedReportText) || extractedText : "";
    const missingReason = recognized
      ? undefined
      : normalizeTextValue(item.missingReason) || "ASR 未提及該模塊內容。";

    normalizedResults.push({
      moduleId,
      transcript: recognized ? extractedText || suggestedReportText : "",
      recognized,
      extractedText,
      suggestedReportText,
      missingReason
    });
  }

  for (const moduleId of selectedModules) {
    if (!seen.has(moduleId)) {
      normalizedResults.push({
        moduleId,
        transcript: "",
        recognized: false,
        extractedText: "",
        suggestedReportText: "",
        missingReason: "AI 服務未返回該模塊的分析結果。"
      });
    }
  }

  return normalizedResults;
}

function summarizeModuleForFormDraft(report: ModuleReportItem): string | null {
  return [report.serviceContent, report.elderResponse, report.completion, report.remarks]
    .filter((value): value is string => Boolean(value))
    .join("；") || null;
}

function assignIfEmpty(target: FormDraftSection, key: keyof FormDraftSection, value: string | null) {
  if (!target[key] && value) {
    target[key] = value;
  }
}

function isLowSignalFormValue(value: string): boolean {
  return ["是", "有", "已進行", "已進行", "已完成", "完成", "全部完成"].includes(value.trim());
}

function normalizeLineValue(value: string | null | undefined): string | null {
  const normalized = value?.trim();

  if (!normalized || normalized === "未提及") {
    return null;
  }

  return normalized;
}

function parseCsvLikeList(value: string | undefined | null): string[] {
  const normalized = normalizeLineValue(value);

  if (!normalized) {
    return [];
  }

  return normalized
    .split(/[、，,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractSection(text: string, heading: string, nextHeadings: string[]): string {
  const start = text.indexOf(heading);

  if (start === -1) {
    return "";
  }

  const contentStart = start + heading.length;
  const candidates = nextHeadings
    .map((nextHeading) => text.indexOf(nextHeading, contentStart))
    .filter((index) => index !== -1);

  const end = candidates.length > 0 ? Math.min(...candidates) : text.length;
  return text.slice(contentStart, end).trim();
}

function extractSectionByAliases(text: string, headings: string[][]): string {
  let matchedIndex = -1;
  let matchedHeading: string | null = null;
  let matchedStart = -1;

  for (const [index, aliases] of headings.entries()) {
    for (const alias of aliases) {
      const start = text.indexOf(alias);

      if (start !== -1 && (matchedStart === -1 || start < matchedStart)) {
        matchedIndex = index;
        matchedHeading = alias;
        matchedStart = start;
      }
    }
  }

  if (matchedIndex === -1 || !matchedHeading) {
    return "";
  }

  const nextAliases = headings.slice(matchedIndex + 1).flat();
  return extractSection(text, matchedHeading, nextAliases);
}

function extractLabeledValue(section: string, labels: string | string[]): string | null {
  const labelList = Array.isArray(labels) ? labels : [labels];

  for (const label of labelList) {
    const pattern = new RegExp(`${label}\\s*[：:]\\s*(.+)`);
    const match = section.match(pattern);
    const normalized = normalizeLineValue(match?.[1]);

    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function normalizeModuleKey(value: string): string {
  return value
    .trim()
    .replace(/^[【\[]|[】\]]$/g, "")
    .replace(/^模塊\s*[：:]\s*/i, "")
    .replace(/^[0-9]+(?:\.[0-9]+)*\s*/u, "")
    .replace(/\s+/g, "")
    .replace(/（/g, "(")
    .replace(/）/g, ")")
    .replace(/／/g, "/")
    .replace(/[：:]/g, "");
}

function buildModuleTitleMap(selectedModules: CareModuleId[]): Map<string, CareModuleId> {
  const titleToId = new Map<string, CareModuleId>();

  for (const careModule of getCareModulesByIds(selectedModules)) {
    const candidates = [
      careModule.title,
      ...careModule.aliases,
      ...careModule.examples.split(/[、，,\/]/).map((value) => value.trim())
    ].filter(Boolean);

    for (const candidate of candidates) {
      titleToId.set(normalizeModuleKey(candidate), careModule.id);
    }
  }

  return titleToId;
}

function fillMissingModuleReports(reports: ModuleReportItem[], selectedModules: CareModuleId[]): ModuleReportItem[] {
  const byId = new Map<CareModuleId, ModuleReportItem>();

  for (const report of reports) {
    const reportModuleId = report.moduleId as CareModuleId;

    if (selectedModules.includes(reportModuleId)) {
      byId.set(reportModuleId, report);
    }
  }

  return getCareModulesByIds(selectedModules).map((careModule) => {
    const existing = byId.get(careModule.id);

    return (
      existing ?? {
        moduleId: careModule.id,
        moduleTitle: careModule.title,
        serviceContent: null,
        elderResponse: null,
        completion: null,
        remarks: null
      }
    );
  });
}

function extractVitalPattern(text: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return null;
}

function buildFallbackFormDraft(params: {
  transcript: string;
  selectedModules: CareModuleId[];
  completedServices: CompletedServicesSection;
  moduleReports: ModuleReportItem[];
  summaryAndRemarks: SummaryRemarksSection;
}): FormDraftSection {
  const draft = createEmptyFormDraft();
  const transcript = params.transcript;
  const lowerTranscript = transcript.toLowerCase();

  draft.environmentIssue =
    params.summaryAndRemarks.incident && params.summaryAndRemarks.incident !== "無"
      ? params.summaryAndRemarks.incident
      : "沒有";
  draft.basicServices = params.completedServices.serviceItems.length
    ? params.completedServices.serviceItems.join("、")
    : null;
  draft.basicServiceReason = params.completedServices.completion;
  draft.cognitiveTrainingProvided = params.selectedModules.some((moduleId) => COGNITIVE_MODULE_IDS.includes(moduleId)) ? "有" : "沒有";
  draft.motionTrainingProvided = "沒有";
  draft.specialServiceProvided = "沒有";
  draft.motionTrainingReason = "未提及";
  draft.specialServiceDetail = "未提及";
  draft.valueAddedService = "未提及";
  draft.brainTraining = "未提及";
  draft.trainingOther = "未提及";
  draft.cognitiveTrainingReason = params.moduleReports.some((item) => item.remarks || item.completion)
    ? params.moduleReports
        .map((item) => [item.completion, item.remarks].filter(Boolean).join("；"))
        .filter(Boolean)
        .join("；")
    : "無";

  draft.bloodPressure =
    extractVitalPattern(transcript, [/(?:血壓|血壓)[^\d]{0,6}(\d{2,3}\s*\/\s*\d{2,3})/i]) ?? null;
  draft.heartRate =
    extractVitalPattern(transcript, [/(?:心跳|脈搏|脈搏)[^\d]{0,6}(\d{2,3})/i]) ?? null;
  draft.bloodOxygen =
    extractVitalPattern(transcript, [/(?:血氧)[^\d]{0,6}(\d{2,3}%?)/i]) ?? null;

  for (const report of params.moduleReports) {
    const summary = summarizeModuleForFormDraft(report);
    const content = [report.serviceContent, report.elderResponse, report.remarks].filter(Boolean).join("；");

    switch (report.moduleId as CareModuleId) {
      case "reality_orientation":
        if (/新聞|資訊|資訊|分享/u.test(content)) {
          assignIfEmpty(draft, "realityOrientationSharing", summary);
        }
        if (/日期|時間|時間|星期|地點|地點|地區|地區/u.test(content)) {
          assignIfEmpty(draft, "realityOrientationQuestioning", summary);
        }
        assignIfEmpty(draft, "realityOrientationSharing", summary);
        assignIfEmpty(draft, "realityOrientationQuestioning", summary);
        break;
      case "short_term_memory":
        if (/位置|啤牌|卡/u.test(content)) {
          assignIfEmpty(draft, "shortTermMemoryCards", summary);
        } else {
          assignIfEmpty(draft, "shortTermMemoryObjects", summary);
        }
        assignIfEmpty(draft, "shortTermMemoryObjects", summary);
        break;
      case "reminiscence_therapy":
        assignIfEmpty(draft, "reminiscenceTherapy", summary);
        break;
      case "delayed_recall":
        assignIfEmpty(draft, "delayedRecall", summary);
        break;
      case "verbal_fluency":
        if (/朗讀|朗讀|複述|複述|跟讀|跟讀|短句/u.test(content)) {
          assignIfEmpty(draft, "verbalFluencyRepeat", summary);
        } else {
          assignIfEmpty(draft, "verbalFluencyNaming", summary);
        }
        assignIfEmpty(draft, "verbalFluencyNaming", summary);
        break;
      case "arithmetic_training":
        assignIfEmpty(draft, "arithmeticTraining", summary);
        break;
      case "association_training":
        if (/接龍|接龍/u.test(content)) {
          assignIfEmpty(draft, "associationTrainingChain", summary);
        } else {
          assignIfEmpty(draft, "associationTrainingHint", summary);
        }
        assignIfEmpty(draft, "associationTrainingChain", summary);
        break;
      case "auditory_attention_training":
        if (/數字|數字|順序|順序|倒序/u.test(content)) {
          assignIfEmpty(draft, "auditoryAttentionDigits", summary);
        }
        if (/餐|酒樓|酒樓|餐單|餐單/u.test(content)) {
          assignIfEmpty(draft, "auditoryAttentionMenu", summary);
        }
        if (/找不同|不同之處|不同之處/u.test(content)) {
          assignIfEmpty(draft, "auditoryAttentionSpotDifference", summary);
        }
        assignIfEmpty(draft, "auditoryAttentionDigits", summary);
        break;
      case "brain_training":
        assignIfEmpty(draft, "brainTraining", summary);
        break;
      case "fall_prevention_exercise":
        draft.motionTrainingProvided = "有";
        assignIfEmpty(draft, "motionTrainingReason", summary);
        break;
    }
  }

  if (draft.vitalSignsModule || draft.bloodPressure || draft.heartRate || draft.bloodOxygen) {
    draft.vitalSignsModule = draft.vitalSignsModule ?? "已量度生命徵象";
  }

  if (!draft.specialServiceProvided && lowerTranscript.includes("特約")) {
    draft.specialServiceProvided = "有";
  }

  return draft;
}

function parseFormDraftSection(
  section: string,
  fallback: FormDraftSection
): FormDraftSection {
  const parsed = { ...fallback };

  for (const field of FORM_DRAFT_FIELDS) {
    const value = extractLabeledValue(section, field.labels);

    if (value) {
      parsed[field.key] = isLowSignalFormValue(value) && fallback[field.key] ? fallback[field.key] : value;
    }
  }

  return parsed;
}

function parseModuleReports(section: string, selectedModules: CareModuleId[]): ModuleReportItem[] {
  const titleToId = buildModuleTitleMap(selectedModules);

  const lines = section
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const reports: ModuleReportItem[] = [];
  let current: ModuleReportItem | null = null;

  for (const line of lines) {
    const labelMatch = line.match(
      /^(服務內容|服務內容|服務內容|服務內容|服務內容摘要|服務內容摘要|長者反應|長者反應|長者表現|長者表現|長者回應|長者回應|完成情況|完成情況|完成狀況|完成狀況|完成程度|完成進度|備註|備註|備註說明|備註說明|原因\/備註|原因\/備註|原因／備註|原因／備註)\s*[：:]\s*(.*)$/
    );

    if (labelMatch) {
      if (!current) {
        continue;
      }

      const [, label, value] = labelMatch;
      const normalizedValue = normalizeLineValue(value);

      if (SERVICE_CONTENT_LABELS.includes(label)) {
        current.serviceContent = normalizedValue;
      } else if (ELDER_RESPONSE_LABELS.includes(label)) {
        current.elderResponse = normalizedValue;
      } else if (COMPLETION_LABELS.includes(label)) {
        current.completion = normalizedValue;
      } else if (REMARKS_LABELS.includes(label)) {
        current.remarks = normalizedValue;
      }
      continue;
    }

    const titleMatch = line.match(MODULE_TITLE_PATTERN);

    if (titleMatch) {
      const moduleTitle = titleMatch[1]?.trim();
      const moduleId = moduleTitle ? titleToId.get(normalizeModuleKey(moduleTitle)) : undefined;

      if (!moduleId) {
        current = null;
        continue;
      }

      current = {
        moduleId,
        moduleTitle,
        serviceContent: null,
        elderResponse: null,
        completion: null,
        remarks: null
      };
      reports.push(current);
      continue;
    }
  }

  debugReportParser(
    "parsed-module-lines",
    reports.map((report) => ({
      moduleId: report.moduleId,
      moduleTitle: report.moduleTitle,
      hasServiceContent: Boolean(report.serviceContent),
      hasElderResponse: Boolean(report.elderResponse),
      hasCompletion: Boolean(report.completion),
      hasRemarks: Boolean(report.remarks)
    }))
  );

  return fillMissingModuleReports(reports, selectedModules);
}

function parseStructuredText(text: string, selectedModules: CareModuleId[], transcript: string) {
  const cleaned = text.trim().replace(/^```[\s\S]*?\n/, "").replace(/```$/i, "").trim();
  const headings = [
    ["【長者狀態】", "【長者狀態】"],
    ["【已完成服務】", "【已完成服務】"],
    ["【模塊化記錄】", "【模組化記錄】", "【模塊化紀錄】"],
    ["【總結 / 特別事故 / 建議】", "【總結 / 特別事故 / 建議】"],
    ["【表單草稿】", "【表單草稿】"]
  ];
  const elderStatusSection = extractSectionByAliases(cleaned, headings);
  const completedServicesSection = extractSectionByAliases(cleaned, headings.slice(1));
  const moduleSection = extractSectionByAliases(cleaned, headings.slice(2));
  const summarySection = extractSectionByAliases(cleaned, headings.slice(3));
  const formDraftSection = extractSectionByAliases(cleaned, headings.slice(4));

  const elderStatus: ElderStatusSection = {
    statusTags: parseCsvLikeList(extractLabeledValue(elderStatusSection, ["狀態標籤", "狀態標籤"])),
    interactionPerformance: extractLabeledValue(elderStatusSection, ["互動表現", "互動表現"]),
    physicalCondition: extractLabeledValue(elderStatusSection, ["身體情況", "身體情況"])
  };

  const completedServices: CompletedServicesSection = {
    serviceItems: parseCsvLikeList(extractLabeledValue(completedServicesSection, ["服務項目", "服務項目"])),
    completion: extractLabeledValue(completedServicesSection, ["完成情況", "完成情況"]),
    elderPerformance: extractLabeledValue(completedServicesSection, ["長者表現", "長者表現"])
  };

  const summaryAndRemarks: SummaryRemarksSection = {
    summary: extractLabeledValue(summarySection, ["總結", "總結"]),
    incident: extractLabeledValue(summarySection, ["特別事故", "特別事故"]),
    recommendation: extractLabeledValue(summarySection, ["後續建議", "後續建議"])
  };

  const moduleReports = parseModuleReports(moduleSection, selectedModules);
  const formDraft = parseFormDraftSection(
    formDraftSection,
    buildFallbackFormDraft({
      transcript,
      selectedModules,
      completedServices,
      moduleReports,
      summaryAndRemarks
    })
  );

  debugReportParser("raw-structured-text", cleaned);
  debugReportParser("parsed-headings", {
    elderStatusSection,
    completedServicesSection,
    moduleSection,
    summarySection,
    formDraftSection
  });

  return {
    elderStatus,
    completedServices,
    moduleReports,
    summaryAndRemarks,
    formDraft
  };
}

async function tryGenerateStructuredReport(params: {
  elder: ElderlyProfile;
  transcript: string;
  sessionDate?: string;
  selectedModules: CareModuleId[];
  retryNote?: string;
}) {
  const response = await generateLlmText({
    task: "report",
    system: REPORT_GENERATION_SYSTEM_PROMPT,
    user: [buildReportGenerationPrompt(params), params.retryNote].filter(Boolean).join("\n\n"),
    temperature: 0,
    maxTokens: 3200
  });

  const rawText = response.text.trim();

  if (!rawText) {
    throw new Error("AI 服務返回空報告。");
  }

  const parsed = parseStructuredText(rawText, params.selectedModules, params.transcript);
  debugReportParser("structured-result-summary", {
    moduleCount: parsed.moduleReports.length,
    modules: parsed.moduleReports.map((report) => report.moduleTitle),
    hasSummary: Boolean(parsed.summaryAndRemarks.summary),
    hasFormDraft: Boolean(parsed.formDraft.basicServices || parsed.formDraft.realityOrientationSharing)
  });
  return { ...parsed, model: response.model };
}

export async function analyzeModulesWithLlm(params: {
  elder: ElderlyProfile;
  transcript: string;
  sessionDate?: string;
  selectedModules: CareModuleId[];
}): Promise<ModuleRecognitionResult[]> {
  const response = await generateLlmText({
    task: "analysis",
    system: MODULE_ANALYSIS_SYSTEM_PROMPT,
    user: buildModuleAnalysisPrompt(params),
    temperature: 0,
    maxTokens: 1200,
    jsonMode: true
  });
  const rawText = response.text.trim();

  if (!rawText) {
    throw new Error("阿里百鍊連接失敗：模塊分析返回空內容。");
  }

  return parseModuleAnalysisResponse(rawText, params.selectedModules);
}

export async function generateAiReport(params: {
  elder: ElderlyProfile;
  transcript: string;
  sessionDate?: string;
  selectedModules: CareModuleId[];
}): Promise<GeneratedReport> {
  let elderStatus: ElderStatusSection | null = null;
  let completedServices: CompletedServicesSection | null = null;
  let moduleReports: ModuleReportItem[] = [];
  let summaryAndRemarks: SummaryRemarksSection | null = null;
  let formDraft: FormDraftSection | null = null;
  let model: string | null = null;
  let lastError: Error | null = null;

  const retryNotes = [
    undefined,
    REPORT_GENERATION_RETRY_PROMPT
  ] as const;

  for (const retryNote of retryNotes) {
    try {
      const structured = await tryGenerateStructuredReport({
        ...params,
        retryNote
      });

      elderStatus = structured.elderStatus;
      completedServices = structured.completedServices;
      moduleReports = structured.moduleReports;
      summaryAndRemarks = structured.summaryAndRemarks;
      formDraft = structured.formDraft;
      model = structured.model;
      break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown AI report error");
    }
  }

  if (!elderStatus || !completedServices || !summaryAndRemarks || !formDraft) {
    const message = lastError?.message ?? "報告生成失敗。";
    throw new Error(message.startsWith("阿里百鍊連接失敗") ? message : `阿里百鍊連接失敗：${message}`);
  }

  return {
    elderId: params.elder.id,
    transcript: params.transcript,
    sessionDate: params.sessionDate ?? null,
    selectedModules: params.selectedModules,
    elderStatus,
    completedServices,
    moduleReports,
    summaryAndRemarks,
    formDraft,
    reportText: buildModuleReportText({
      elder: params.elder,
      transcript: params.transcript,
      sessionDate: params.sessionDate,
      elderStatus,
      completedServices,
      moduleReports,
      summaryAndRemarks
    }),
    generatedAt: new Date().toISOString(),
    model
  };
}
