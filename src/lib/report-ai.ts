import { buildCareModulePromptContext, getCareModulesByIds, type CareModuleId } from "@/lib/care-modules";
import { buildModuleReportText } from "@/lib/report-format";
import type { ElderlyProfile } from "@/types/elderly";
import { getGoogleGenAI, hasGoogleCloudConfig } from "@/lib/google-client";
import type {
  CompletedServicesSection,
  ElderStatusSection,
  FormDraftSection,
  GeneratedReport,
  ModuleReportItem,
  SummaryRemarksSection
} from "@/types/report";

const MODULE_TITLE_PATTERN = /^(?:【|\[)\s*(.+?)\s*(?:】|\])$/;
const SERVICE_CONTENT_LABELS = ["服务内容", "服務內容", "服務内容", "服务內容", "服务内容摘要", "服務內容摘要"];
const ELDER_RESPONSE_LABELS = ["长者反应", "長者反應", "长者表现", "長者表現", "长者回应", "長者回應"];
const COMPLETION_LABELS = ["完成情况", "完成情況", "完成状况", "完成狀況", "完成程度", "完成進度"];
const REMARKS_LABELS = ["备注", "備註", "备注说明", "備註說明", "原因/备注", "原因／备注", "原因/備註"];
const COGNITIVE_MODULE_IDS: CareModuleId[] = [
  "reality_orientation",
  "short_term_memory",
  "reminiscence_therapy",
  "delayed_recall",
  "verbal_fluency",
  "arithmetic_training",
  "association_training",
  "auditory_attention_training"
];

const FORM_DRAFT_FIELDS: Array<{ key: keyof FormDraftSection; labels: string[] }> = [
  { key: "attendanceCount", labels: ["在场人数", "在場人數"] },
  { key: "attendees", labels: ["在场人士", "在場人士"] },
  { key: "environmentIssue", labels: ["环境异常", "環境異常"] },
  { key: "bloodPressure", labels: ["血压", "血壓"] },
  { key: "heartRate", labels: ["心跳"] },
  { key: "bloodOxygen", labels: ["血氧"] },
  { key: "basicServices", labels: ["基本服务", "基本服務"] },
  { key: "basicServiceReason", labels: ["基本服务未完成原因", "基本服務未完成原因"] },
  { key: "cognitiveTrainingProvided", labels: ["认知训练提供", "認知訓練提供"] },
  { key: "realityOrientationSharing", labels: ["1.0现实导向", "1.0現實導向"] },
  { key: "realityOrientationQuestioning", labels: ["1.1现实导向", "1.1現實導向"] },
  { key: "shortTermMemoryObjects", labels: ["2.0短期记忆", "2.0短期記憶"] },
  { key: "shortTermMemoryCards", labels: ["2.1短期记忆", "2.1短期記憶"] },
  { key: "reminiscenceTherapy", labels: ["3.0怀缅治疗", "3.0懷緬治療"] },
  { key: "delayedRecall", labels: ["4.0延迟回忆", "4.0延遲回憶"] },
  { key: "verbalFluencyNaming", labels: ["5.1说话流畅度", "5.1說話流暢度"] },
  { key: "verbalFluencyRepeat", labels: ["5.2说话流畅度", "5.2說話流暢度"] },
  { key: "arithmeticTraining", labels: ["6.0运算", "6.0運算"] },
  { key: "associationTrainingChain", labels: ["7.1联想训练", "7.1聯想訓練"] },
  { key: "associationTrainingHint", labels: ["7.2联想训练", "7.2聯想訓練"] },
  { key: "auditoryAttentionDigits", labels: ["8.1听觉/专注力训练", "8.1聽覺/專注力訓練"] },
  { key: "auditoryAttentionMenu", labels: ["8.2听觉/专注力训练", "8.2聽覺/專注力訓練"] },
  { key: "auditoryAttentionSpotDifference", labels: ["8.3听觉/专注力训练", "8.3聽覺/專注力訓練"] },
  { key: "vitalSignsModule", labels: ["9.0生命徵象", "9.0生命征象"] },
  { key: "cognitiveTrainingReason", labels: ["认知训练未完成原因", "認知訓練未完成原因"] },
  { key: "motionTrainingProvided", labels: ["运动训练提供", "運動訓練提供"] },
  { key: "motionTrainingReason", labels: ["运动训练未完成原因", "運動訓練未完成原因"] },
  { key: "specialServiceProvided", labels: ["特约专项服务", "特約專項服務"] },
  { key: "specialServiceDetail", labels: ["特约专项服务内容", "特約專項服務內容"] },
  { key: "valueAddedService", labels: ["增值服务", "增值服務"] },
  { key: "brainTraining", labels: ["健脑八式", "健腦八式"] },
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
  return ["是", "有", "已进行", "已進行", "已完成", "完成", "全部完成"].includes(value.trim());
}

function buildPrompt(params: {
  elder: ElderlyProfile;
  transcript: string;
  sessionDate?: string;
  selectedModules: CareModuleId[];
}): string {
  const selectedModules = getCareModulesByIds(params.selectedModules);
  const selectedModulesText = selectedModules.map((module) => `${module.title}（${module.examples}）`).join("、");
  const selectedModuleTitles = selectedModules.map((module) => module.title);
  const moduleTitleList = selectedModuleTitles.map((title) => `- ${title}`).join("\n");
  const moduleOutputTemplate = selectedModuleTitles
    .map(
      (title) =>
        [`【${title}】`, "服务内容：...", "长者反应：...", "完成情况：...", "备注：..."].join("\n")
    )
    .join("\n\n");

  return [
    "你是一名长者认知训练与照护服务报告整理助手。用户已经完成语音录入，并选择了本次训练/照护涉及的模块。请根据用户最终确认的 ASR 文本，生成一份专业、简洁、适合真实服务记录的结构化报告。",
    "",
    "本报告的目标不是生成长篇总结，而是模拟真实志愿者手动填写的服务报告。请使用简短、清晰、表单化、专业化的表达，重点体现训练内容、长者反应、完成情况及后续留意事项。",
    "",
    "输入：",
    `- 已选模块：${selectedModulesText}`,
    `- ASR 文本：${params.transcript}`,
    `- 长者姓名：${params.elder.fullName}`,
    `- 服务日期：${params.sessionDate ?? "未提供"}`,
    "- 在场人士：未提供",
    "- 生命表征信息：未提供",
    `- 长者资料：房间 ${params.elder.roomNo ?? "未设定"}；风险等级 ${params.elder.riskLevel}；医疗备注 ${params.elder.medicalNotes ?? "无"}`,
    "",
    "模块说明：",
    buildCareModulePromptContext(params.selectedModules),
    "",
    "生成规则：",
    "1. 只根据 ASR 与已知资料生成报告，不得编造未提及的训练内容、长者反应、风险或建议。",
    "2. 需要把口语化表述整理成专业、简洁、适合服务记录的书面表达，例如「长者反应较慢」「需提示下完成」「情绪平稳」等。",
    "3. 所有已选模块都必须输出，不得省略任何一个模块。",
    "4. 若某个模块在 ASR 文本中没有明确内容，仍须保留该模块标题，并将“服务内容 / 长者反应 / 完成情况 / 备注”四个字段统一写为“未提及”。",
    "5. 模块标题必须逐字使用给定中文标题，不得改写、概括、替换、添加编号，也不得使用同义标题代替。",
    "6. 若同一内容涉及多个模块，只归入最匹配的一个模块，避免重复记录。",
    "7. 若出现异常情况、未完成原因、拒绝参与、情绪波动、身体不适或后续建议，必须写入对应模块备注或“总结 / 特别事故 / 建议”部分。",
    "8. 输出应直接适合展示在报告结果页，不能输出 JSON、Markdown 代码块、解释说明或额外前言。",
    "",
    "以下是本次允许使用的模块标题，请逐字照抄：",
    moduleTitleList,
    "",
    "请严格按照以下文本格式输出，不要输出 JSON，不要输出 Markdown 代码块，不要输出格式说明：",
    "【长者状态】",
    "状态标签：...",
    "互动表现：...",
    "身体情况：...",
    "",
    "【已完成服务】",
    "服务项目：...",
    "完成情况：...",
    "长者表现：...",
    "",
    "【模块化记录】",
    moduleOutputTemplate,
    "",
    "【总结 / 特别事故 / 建议】",
    "总结：...",
    "特别事故：...",
    "后续建议：...",
    "",
    "【表单草稿】",
    "在场人数：...",
    "在场人士：...",
    "环境异常：...",
    "血压：...",
    "心跳：...",
    "血氧：...",
    "基本服务：...",
    "基本服务未完成原因：...",
    "认知训练提供：...",
    "1.0现实导向：...",
    "1.1现实导向：...",
    "2.0短期记忆：...",
    "2.1短期记忆：...",
    "3.0怀缅治疗：...",
    "4.0延迟回忆：...",
    "5.1说话流畅度：...",
    "5.2说话流畅度：...",
    "6.0运算：...",
    "7.1联想训练：...",
    "7.2联想训练：...",
    "8.1听觉/专注力训练：...",
    "8.2听觉/专注力训练：...",
    "8.3听觉/专注力训练：...",
    "9.0生命徵象：...",
    "认知训练未完成原因：...",
    "运动训练提供：...",
    "运动训练未完成原因：...",
    "特约专项服务：...",
    "特约专项服务内容：...",
    "增值服务：...",
    "健脑八式：...",
    "其他：...",
    "",
    "要求：",
    `1. 模块标题只能使用这些已选模块中文名：${selectedModuleTitles.join("、")}。`,
    "2. 未提及的字段必须写“未提及”，不得留空。",
    "3. 若无特别事故，请写“无”。",
    "4. 绝对不要省略任何已选模块的模块块。",
    "5. 表单草稿每一行都必须输出；若没有相关信息，请写“未提及”。",
    "6. 表单草稿应尽量贴近真实 Google Form 回填语气，保持简短、字段化、可直接落格。",
    "7. 若同一内容涉及多个模块，只归到最匹配的模块。"
  ].join("\n");
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
    .replace(/^模块\s*[：:]\s*/i, "")
    .replace(/^[0-9]+(?:\.[0-9]+)*\s*/u, "")
    .replace(/\s+/g, "")
    .replace(/（/g, "(")
    .replace(/）/g, ")")
    .replace(/／/g, "/")
    .replace(/[：:]/g, "");
}

function buildModuleTitleMap(selectedModules: CareModuleId[]): Map<string, CareModuleId> {
  const titleToId = new Map<string, CareModuleId>();

  for (const module of getCareModulesByIds(selectedModules)) {
    const candidates = [
      module.title,
      ...module.aliases,
      ...module.examples.split(/[、，,\/]/).map((value) => value.trim())
    ].filter(Boolean);

    for (const candidate of candidates) {
      titleToId.set(normalizeModuleKey(candidate), module.id);
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

  return getCareModulesByIds(selectedModules).map((module) => {
    const existing = byId.get(module.id);

    return (
      existing ?? {
        moduleId: module.id,
        moduleTitle: module.title,
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
    params.summaryAndRemarks.incident && params.summaryAndRemarks.incident !== "无"
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
    : "无";

  draft.bloodPressure =
    extractVitalPattern(transcript, [/(?:血压|血壓)[^\d]{0,6}(\d{2,3}\s*\/\s*\d{2,3})/i]) ?? null;
  draft.heartRate =
    extractVitalPattern(transcript, [/(?:心跳|脈搏|脉搏)[^\d]{0,6}(\d{2,3})/i]) ?? null;
  draft.bloodOxygen =
    extractVitalPattern(transcript, [/(?:血氧)[^\d]{0,6}(\d{2,3}%?)/i]) ?? null;

  for (const report of params.moduleReports) {
    const summary = summarizeModuleForFormDraft(report);
    const content = [report.serviceContent, report.elderResponse, report.remarks].filter(Boolean).join("；");

    switch (report.moduleId as CareModuleId) {
      case "reality_orientation":
        if (/新闻|資訊|资讯|分享/u.test(content)) {
          assignIfEmpty(draft, "realityOrientationSharing", summary);
        }
        if (/日期|時間|时间|星期|地點|地点|地區|地区/u.test(content)) {
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
        if (/朗读|朗讀|复述|複述|跟读|跟讀|短句/u.test(content)) {
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
        if (/接龙|接龍/u.test(content)) {
          assignIfEmpty(draft, "associationTrainingChain", summary);
        } else {
          assignIfEmpty(draft, "associationTrainingHint", summary);
        }
        assignIfEmpty(draft, "associationTrainingChain", summary);
        break;
      case "auditory_attention_training":
        if (/数字|數字|顺序|順序|倒序/u.test(content)) {
          assignIfEmpty(draft, "auditoryAttentionDigits", summary);
        }
        if (/餐|酒樓|酒楼|餐單|餐单/u.test(content)) {
          assignIfEmpty(draft, "auditoryAttentionMenu", summary);
        }
        if (/找不同|不同之處|不同之处/u.test(content)) {
          assignIfEmpty(draft, "auditoryAttentionSpotDifference", summary);
        }
        assignIfEmpty(draft, "auditoryAttentionDigits", summary);
        break;
      case "vital_signs":
        assignIfEmpty(draft, "vitalSignsModule", summary);
        break;
    }
  }

  if (draft.vitalSignsModule || draft.bloodPressure || draft.heartRate || draft.bloodOxygen) {
    draft.vitalSignsModule = draft.vitalSignsModule ?? "已量度生命徵象";
  }

  if (!draft.specialServiceProvided && lowerTranscript.includes("特约")) {
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
      /^(服务内容|服務內容|服務内容|服务內容|服务内容摘要|服務內容摘要|長者反應|长者反应|长者表现|長者表現|长者回应|長者回應|完成情況|完成情况|完成狀況|完成状况|完成程度|完成進度|備註|备注|備註說明|备注说明|原因\/备注|原因\/備註|原因／备注|原因／備註)\s*[：:]\s*(.*)$/
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
    ["【长者状态】", "【長者狀態】"],
    ["【已完成服务】", "【已完成服務】"],
    ["【模块化记录】", "【模組化記錄】", "【模块化紀錄】"],
    ["【总结 / 特别事故 / 建议】", "【總結 / 特別事故 / 建議】"],
    ["【表单草稿】", "【表單草稿】"]
  ];
  const elderStatusSection = extractSectionByAliases(cleaned, headings);
  const completedServicesSection = extractSectionByAliases(cleaned, headings.slice(1));
  const moduleSection = extractSectionByAliases(cleaned, headings.slice(2));
  const summarySection = extractSectionByAliases(cleaned, headings.slice(3));
  const formDraftSection = extractSectionByAliases(cleaned, headings.slice(4));

  const elderStatus: ElderStatusSection = {
    statusTags: parseCsvLikeList(extractLabeledValue(elderStatusSection, ["状态标签", "狀態標籤"])),
    interactionPerformance: extractLabeledValue(elderStatusSection, ["互动表现", "互動表現"]),
    physicalCondition: extractLabeledValue(elderStatusSection, ["身体情况", "身體情況"])
  };

  const completedServices: CompletedServicesSection = {
    serviceItems: parseCsvLikeList(extractLabeledValue(completedServicesSection, ["服务项目", "服務項目"])),
    completion: extractLabeledValue(completedServicesSection, ["完成情况", "完成情況"]),
    elderPerformance: extractLabeledValue(completedServicesSection, ["长者表现", "長者表現"])
  };

  const summaryAndRemarks: SummaryRemarksSection = {
    summary: extractLabeledValue(summarySection, ["总结", "總結"]),
    incident: extractLabeledValue(summarySection, ["特别事故", "特別事故"]),
    recommendation: extractLabeledValue(summarySection, ["后续建议", "後續建議"])
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
  model: string;
  retryNote?: string;
}) {
  const ai = getGoogleGenAI();
  const response = await ai.models.generateContent({
    model: params.model,
    contents: [buildPrompt(params), params.retryNote].filter(Boolean).join("\n\n"),
    config: {
      temperature: 0,
      maxOutputTokens: 3200
    }
  });

  const rawText = response.text?.trim();

  if (!rawText) {
    throw new Error("Gemini returned empty structured output.");
  }

  const parsed = parseStructuredText(rawText, params.selectedModules, params.transcript);
  debugReportParser("structured-result-summary", {
    moduleCount: parsed.moduleReports.length,
    modules: parsed.moduleReports.map((report) => report.moduleTitle),
    hasSummary: Boolean(parsed.summaryAndRemarks.summary),
    hasFormDraft: Boolean(parsed.formDraft.basicServices || parsed.formDraft.realityOrientationSharing)
  });
  return parsed;
}

export async function generateAiReport(params: {
  elder: ElderlyProfile;
  transcript: string;
  sessionDate?: string;
  selectedModules: CareModuleId[];
}): Promise<GeneratedReport> {
  if (!hasGoogleCloudConfig()) {
    throw new Error("生成失败请重试");
  }

  const model = process.env.GOOGLE_VERTEX_MODEL ?? "gemini-2.5-flash";
  let elderStatus: ElderStatusSection | null = null;
  let completedServices: CompletedServicesSection | null = null;
  let moduleReports: ModuleReportItem[] = [];
  let summaryAndRemarks: SummaryRemarksSection | null = null;
  let formDraft: FormDraftSection | null = null;
  let lastError: Error | null = null;

  const retryNotes = [
    undefined,
    [
      "上一次输出无法被系统解析。",
      "请严格纠正以下问题：",
      "1. 只输出规定的分段文本，不要输出 JSON、Markdown、解释或前言。",
      "2. 必须为每一个已选模块都输出一个独立模块块，不得省略。",
      "3. 模块标题必须逐字使用给定中文标题，不得替换、概括或加编号。",
      "4. 每个模块块必须严格包含且仅包含以下四行字段：服务内容、长者反应、完成情况、备注。",
      "5. 必须输出完整的【表单草稿】区块，并保留所有字段名。",
      "6. 若无内容，请在对应字段写“未提及”。",
      "7. 请直接从【长者状态】开始输出。"
    ].join("\n")
  ] as const;

  for (const retryNote of retryNotes) {
    try {
      const structured = await tryGenerateStructuredReport({
        ...params,
        model,
        retryNote
      });

      elderStatus = structured.elderStatus;
      completedServices = structured.completedServices;
      moduleReports = structured.moduleReports;
      summaryAndRemarks = structured.summaryAndRemarks;
      formDraft = structured.formDraft;
      break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown Gemini error");
    }
  }

  if (!elderStatus || !completedServices || !summaryAndRemarks || !formDraft) {
    if (lastError) {
      console.warn("Gemini structured report failed:", lastError.message);
    }

    throw new Error("生成失败请重试");
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
