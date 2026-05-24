import {
  buildCareModulePromptContext,
  getCareModulesByIds,
  type CareModuleId
} from "@/lib/care-modules";
import type { ElderlyProfile } from "@/types/elderly";

export const MODULE_ANALYSIS_SYSTEM_PROMPT = "你是长者照护记录模块分类器。只输出 JSON，不输出解释。";

export const REPORT_GENERATION_SYSTEM_PROMPT =
  "你是一名长者认知训练与照护服务报告整理助手。请严格按用户要求输出结构化中文报告。";

export const REPORT_GENERATION_RETRY_PROMPT = [
  "上一次输出无法被系统解析。",
  "请严格纠正以下问题：",
  "1. 只输出规定的分段文本，不要输出 JSON、Markdown、解释或前言。",
  "2. 必须为每一个已选模块都输出一个独立模块块，不得省略。",
  "3. 模块标题必须逐字使用给定中文标题，不得替换、概括或加编号。",
  "4. 每个模块块必须严格包含且仅包含以下四行字段：服务内容、长者反应、完成情况、备注。",
  "5. 必须输出完整的【表单草稿】区块，并保留所有字段名。",
  "6. 若无内容，请在对应字段写“未提及”。",
  "7. 请直接从【长者状态】开始输出。"
].join("\n");

export function buildModuleAnalysisPrompt(params: {
  elder: ElderlyProfile;
  transcript: string;
  sessionDate?: string;
  selectedModules: CareModuleId[];
}): string {
  const selectedModules = getCareModulesByIds(params.selectedModules);
  const moduleIds = selectedModules.map((careModule) => careModule.id).join(", ");

  return [
    "你是长者认知训练照护记录分类器。只根据 ASR 文本判断每个已选模块是否真的执行。",
    "recognized=true 仅限 ASR 有具体证据：做了什么训练/提问、长者反应或结果、完成情况。",
    "recognized=false 用于：没提及、明确没做、只是计划稍后做、只有模块被选择但无具体内容。",
    "同一段内容只归入最匹配模块。不要因为模块名称、提示词或已选模块列表而判定已做。不要编造。",
    "",
    "已选模块资料：",
    buildCareModulePromptContext(params.selectedModules),
    "",
    "长者资料：",
    `- 姓名：${params.elder.fullName}`,
    `- 房间：${params.elder.roomNo ?? "未设定"}`,
    `- 风险等级：${params.elder.riskLevel}`,
    `- 医疗备注：${params.elder.medicalNotes ?? "无"}`,
    `- 服务日期：${params.sessionDate ?? "未提供"}`,
    "",
    "ASR 文本：",
    params.transcript,
    "",
    `输出 JSON。moduleResults 必须包含所有已选模块且每个只出现一次。moduleId 只能是：${moduleIds}。`,
    "recognized=false 时 extractedText 和 suggestedReportText 必须为空字符串，missingReason 说明原因。",
    "recognized=true 时 extractedText 写 ASR 事实，suggestedReportText 写简短报告卡片内容。"
  ].join("\n");
}

export function buildReportGenerationPrompt(params: {
  elder: ElderlyProfile;
  transcript: string;
  sessionDate?: string;
  selectedModules: CareModuleId[];
}): string {
  const selectedModules = getCareModulesByIds(params.selectedModules);
  const selectedModulesText = selectedModules.map((careModule) => `${careModule.title}（${careModule.examples}）`).join("、");
  const selectedModuleTitles = selectedModules.map((careModule) => careModule.title);
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
