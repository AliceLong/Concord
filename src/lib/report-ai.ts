import { buildCareModulePromptContext, getCareModulesByIds, type CareModuleId } from "@/lib/care-modules";
import { buildModuleReportText } from "@/lib/report-format";
import type { ElderlyProfile } from "@/types/elderly";
import { getGoogleGenAI, hasGoogleCloudConfig } from "@/lib/google-client";
import type {
  CompletedServicesSection,
  ElderStatusSection,
  GeneratedReport,
  ModuleReportItem,
  SummaryRemarksSection
} from "@/types/report";

function buildPrompt(params: {
  elder: ElderlyProfile;
  transcript: string;
  sessionDate?: string;
  selectedModules: CareModuleId[];
}): string {
  const selectedModulesText = getCareModulesByIds(params.selectedModules)
    .map((module) => `${module.title}（${module.examples}）`)
    .join("、");
  const selectedModuleTitles = getCareModulesByIds(params.selectedModules)
    .map((module) => module.title)
    .join("、");

  return [
    "你是一名长者照护服务报告整理助手。用户已经完成语音录入，并选择了本次照护涉及的服务模块。请根据用户最终确认的 ASR 文本，生成一份结构化照护服务报告。",
    "",
    "本报告的目标不是生成长篇总结，而是模拟真实志愿者手动填写的服务报告。请使用简短、清晰、表单化的表达。",
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
    "1. 只根据 ASR 和已知信息生成报告，不要编造未提及内容。",
    "2. 根据已选模块，将 ASR 内容分配到对应模块下。",
    "3. 没有涉及的模块不要强行生成内容。",
    "4. 用户口语化表达需要整理成简洁服务记录。",
    "5. 保留真实照护记录的风格，例如「長者較疲倦」「反應較慢」「有陪同傾談」「建議繼續留意情緒」。",
    "6. 如果有异常情况、未完成原因或后续建议，必须放入备注/建议部分。",
    "7. 输出应适合直接展示在报告生成结果页。",
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
    "按已选模块逐一输出；只有在文本确实涉及该模块时才输出。",
    "每个模块固定格式：",
    "【模块名称】",
    "服务内容：...",
    "长者反应：...",
    "完成情况：...",
    "备注：...",
    "",
    "【总结 / 特别事故 / 建议】",
    "总结：...",
    "特别事故：...",
    "后续建议：...",
    "",
    "要求：",
    `1. 模块名称只能使用这些已选模块中文名：${selectedModuleTitles}。`,
    "2. 未提及的字段请写“未提及”。",
    "3. 若无特别事故，请写“无”。",
    "4. 若同一内容涉及多个模块，只归到最匹配的模块。"
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

function parseModuleReports(section: string, selectedModules: CareModuleId[]): ModuleReportItem[] {
  const titleToId = new Map<string, CareModuleId>();

  for (const module of getCareModulesByIds(selectedModules)) {
    titleToId.set(module.title, module.id);

    for (const alias of module.examples.split(/[、，,\/]/).map((value) => value.trim()).filter(Boolean)) {
      titleToId.set(alias, module.id);
    }
  }

  const lines = section
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const reports: ModuleReportItem[] = [];
  let current: ModuleReportItem | null = null;

  for (const line of lines) {
    const labelMatch = line.match(/^(服务内容|服務內容|長者反應|长者反应|完成情況|完成情况|備註|备注)\s*[：:]\s*(.*)$/);

    if (labelMatch) {
      if (!current) {
        continue;
      }

      const [, label, value] = labelMatch;
      const normalizedValue = normalizeLineValue(value);

      if (label === "服务内容" || label === "服務內容") {
        current.serviceContent = normalizedValue;
      } else if (label === "長者反應" || label === "长者反应") {
        current.elderResponse = normalizedValue;
      } else if (label === "完成情況" || label === "完成情况") {
        current.completion = normalizedValue;
      } else if (label === "備註" || label === "备注") {
        current.remarks = normalizedValue;
      }
      continue;
    }

    const titleMatch = line.match(/^(?:【|\[)(.+?)(?:】|\])$/);

    if (titleMatch) {
      const moduleTitle = titleMatch[1]?.trim();
      const moduleId = moduleTitle ? titleToId.get(moduleTitle) : undefined;

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

  return reports;
}

function parseStructuredText(text: string, selectedModules: CareModuleId[]) {
  const cleaned = text.trim().replace(/^```[\s\S]*?\n/, "").replace(/```$/i, "").trim();
  const headings = [
    ["【长者状态】", "【長者狀態】"],
    ["【已完成服务】", "【已完成服務】"],
    ["【模块化记录】", "【模組化記錄】", "【模块化紀錄】"],
    ["【总结 / 特别事故 / 建议】", "【總結 / 特別事故 / 建議】"]
  ];
  const elderStatusSection = extractSectionByAliases(cleaned, headings);
  const completedServicesSection = extractSectionByAliases(cleaned, headings.slice(1));
  const moduleSection = extractSectionByAliases(cleaned, headings.slice(2));
  const summarySection = extractSectionByAliases(cleaned, headings.slice(3));

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

  return {
    elderStatus,
    completedServices,
    moduleReports,
    summaryAndRemarks
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
      maxOutputTokens: 2200
    }
  });

  const rawText = response.text?.trim();

  if (!rawText) {
    throw new Error("Gemini returned empty structured output.");
  }

  return parseStructuredText(rawText, params.selectedModules);
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
  let lastError: Error | null = null;

  const retryNotes = [
    undefined,
    "上一次输出格式不符合要求。请只输出规定的分段文本，保留所有标题和字段名，不要输出 JSON、Markdown 或任何解释。"
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
      break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown Gemini error");
    }
  }

  if (!elderStatus || !completedServices || !summaryAndRemarks) {
    if (lastError) {
      console.warn("Gemini structured report failed:", lastError.message);
    }

    throw new Error("生成失败请重试");
  }

  if (moduleReports.length === 0) {
    console.warn("Gemini structured report failed: no module reports parsed");
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
