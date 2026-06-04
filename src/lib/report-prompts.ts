import {
  buildCareModulePromptContext,
  getCareModulesByIds,
  type CareModuleId
} from "@/lib/care-modules";
import type { ElderlyProfile } from "@/types/elderly";

export const MODULE_ANALYSIS_SYSTEM_PROMPT = "你是長者照護記錄模塊分類器。只輸出 JSON，不輸出解釋。";

export const REPORT_GENERATION_SYSTEM_PROMPT =
  "你是一名長者認知訓練與照護服務報告整理助手。請嚴格按用戶要求輸出結構化中文報告。";

export const REPORT_GENERATION_RETRY_PROMPT = [
  "上一次輸出無法被系統解析。",
  "請嚴格糾正以下問題：",
  "1. 只輸出規定的分段文本，不要輸出 JSON、Markdown、解釋或前言。",
  "2. 必須為每一個已選模塊都輸出一個獨立模塊區塊，不得省略。",
  "3. 模塊標題必須逐字使用給定中文標題，不得替換、概括或加編號。",
  "4. 每個模塊區塊必須嚴格包含且僅包含以下四行字段：服務內容、長者反應、完成情況、備註。",
  "5. 必須輸出完整的【表單草稿】區塊，並保留所有字段名。",
  "6. 若無內容，請在對應字段寫“未提及”。",
  "7. 請直接從【長者狀態】開始輸出。"
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
    "你是長者認知訓練照護記錄分類器。只根據 ASR 文本判斷每個已選模塊是否真的執行。",
    "recognized=true 僅限 ASR 有具體證據：做了什麼訓練/提問、長者反應或結果、完成情況。",
    "recognized=false 用於：沒提及、明確沒做、只是計劃稍後做、只有模塊被選擇但無具體內容。",
    "同一段內容只歸入最匹配模塊。不要因為模塊名稱、提示詞或已選模塊列表而判定已做。不要編造。",
    "",
    "已選模塊資料：",
    buildCareModulePromptContext(params.selectedModules),
    "",
    "長者資料：",
    `- 姓名：${params.elder.fullName}`,
    `- 房間：${params.elder.roomNo ?? "未設定"}`,
    `- 風險等級：${params.elder.riskLevel}`,
    `- 醫療備註：${params.elder.medicalNotes ?? "無"}`,
    `- 服務日期：${params.sessionDate ?? "未提供"}`,
    "",
    "ASR 文本：",
    params.transcript,
    "",
    `輸出 JSON。moduleResults 必須包含所有已選模塊且每個只出現一次。moduleId 只能是：${moduleIds}。`,
    "recognized=false 時 extractedText 和 suggestedReportText 必須為空字符串，missingReason 說明原因。",
    "recognized=true 時 extractedText 寫 ASR 事實，suggestedReportText 寫簡短報告卡片內容。"
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
        [`【${title}】`, "服務內容：...", "長者反應：...", "完成情況：...", "備註：..."].join("\n")
    )
    .join("\n\n");

  return [
    "你是一名長者認知訓練與照護服務報告整理助手。用戶已經完成語音錄入，並選擇了本次訓練/照護涉及的模塊。請根據用戶最終確認的 ASR 文本，生成一份專業、簡潔、適合真實服務記錄的結構化報告。",
    "",
    "本報告的目標不是生成長篇總結，而是模擬真實志願者手動填寫的服務報告。請使用簡短、清晰、表單化、專業化的表達，重點體現訓練內容、長者反應、完成情況及後續留意事項。",
    "",
    "輸入：",
    `- 已選模塊：${selectedModulesText}`,
    `- ASR 文本：${params.transcript}`,
    `- 長者姓名：${params.elder.fullName}`,
    `- 服務日期：${params.sessionDate ?? "未提供"}`,
    "- 在場人士：未提供",
    "- 生命表徵信息：未提供",
    `- 長者資料：房間 ${params.elder.roomNo ?? "未設定"}；風險等級 ${params.elder.riskLevel}；醫療備註 ${params.elder.medicalNotes ?? "無"}`,
    "",
    "模塊說明：",
    buildCareModulePromptContext(params.selectedModules),
    "",
    "生成規則：",
    "1. 只根據 ASR 與已知資料生成報告，不得編造未提及的訓練內容、長者反應、風險或建議。",
    "2. 需要把口語化表述整理成專業、簡潔、適合服務記錄的書面表達，例如「長者反應較慢」「需提示下完成」「情緒平穩」等。",
    "3. 所有已選模塊都必須輸出，不得省略任何一個模塊。",
    "4. 若某個模塊在 ASR 文本中沒有明確內容，仍須保留該模塊標題，並將“服務內容 / 長者反應 / 完成情況 / 備註”四個字段統一寫為“未提及”。",
    "5. 模塊標題必須逐字使用給定中文標題，不得改寫、概括、替換、添加編號，也不得使用同義標題代替。",
    "6. 若同一內容涉及多個模塊，只歸入最匹配的一個模塊，避免重複記錄。",
    "7. 若出現異常情況、未完成原因、拒絕參與、情緒波動、身體不適或後續建議，必須寫入對應模塊備註或“總結 / 特別事故 / 建議”部分。",
    "8. 輸出應直接適合展示在報告結果頁，不能輸出 JSON、Markdown 代碼塊、解釋說明或額外前言。",
    "",
    "以下是本次允許使用的模塊標題，請逐字照抄：",
    moduleTitleList,
    "",
    "請嚴格按照以下文本格式輸出，不要輸出 JSON，不要輸出 Markdown 代碼塊，不要輸出格式說明：",
    "【長者狀態】",
    "狀態標籤：...",
    "互動表現：...",
    "身體情況：...",
    "",
    "【已完成服務】",
    "服務項目：...",
    "完成情況：...",
    "長者表現：...",
    "",
    "【模塊化記錄】",
    moduleOutputTemplate,
    "",
    "【總結 / 特別事故 / 建議】",
    "總結：...",
    "特別事故：...",
    "後續建議：...",
    "",
    "【表單草稿】",
    "在場人數：...",
    "在場人士：...",
    "環境異常：...",
    "血壓：...",
    "心跳：...",
    "血氧：...",
    "基本服務：...",
    "基本服務未完成原因：...",
    "認知訓練提供：...",
    "1.0現實導向：...",
    "1.1現實導向：...",
    "2.0短期記憶：...",
    "2.1短期記憶：...",
    "3.0懷緬治療：...",
    "4.0延遲迴憶：...",
    "5.1說話流暢度：...",
    "5.2說話流暢度：...",
    "6.0運算：...",
    "7.1聯想訓練：...",
    "7.2聯想訓練：...",
    "8.1聽覺/專注力訓練：...",
    "8.2聽覺/專注力訓練：...",
    "8.3聽覺/專注力訓練：...",
    "9.0生命徵象：...",
    "認知訓練未完成原因：...",
    "運動訓練提供：...",
    "運動訓練未完成原因：...",
    "特約專項服務：...",
    "特約專項服務內容：...",
    "增值服務：...",
    "健腦八式：...",
    "其他：...",
    "",
    "要求：",
    `1. 模塊標題只能使用這些已選模塊中文名：${selectedModuleTitles.join("、")}。`,
    "2. 未提及的字段必須寫“未提及”，不得留空。",
    "3. 若無特別事故，請寫“無”。",
    "4. 絕對不要省略任何已選模塊的模塊區塊。",
    "5. 表單草稿每一行都必須輸出；若沒有相關信息，請寫“未提及”。",
    "6. 表單草稿應儘量貼近真實 Google Form 回填語氣，保持簡短、字段化、可直接落格。",
    "7. 若同一內容涉及多個模塊，只歸到最匹配的模塊。"
  ].join("\n");
}
