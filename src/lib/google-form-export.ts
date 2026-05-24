import * as XLSX from "xlsx";
import type { ElderlyProfile } from "@/types/elderly";
import type { GeneratedReport, ModuleReportItem } from "@/types/report";

export const GOOGLE_FORM_HEADERS = [
  "Timestamp",
  "耆恩大使職員No.(AM-XXXXX )",
  "耆恩大使職員姓名",
  "服務日期",
  "訂單No.(OR-XXXXX )",
  "被服務長者之姓名",
  "在場人數(不包括耆恩職員)",
  "在場人士",
  "環境有異常現象嗎,  例如天冷仍開冷氣、地面濕滑等?",
  "長者狀態: ",
  "血壓(上壓/下壓)",
  "心跳",
  "血氧",
  "A. 基本服務(請剔有進行之項目)",
  "如沒有進行以上基本服務的原因, 請剔原因: 例如時間不足，長者能力， 長者身體不適，長者意願等等。",
  "有無提供B1.2 認知訓練 - 針對認知及記憶練習?",
  " [1.0 現實導向: 分享簡短新聞/ 資訊, 亦可按長者有興趣傾談的內容, 引導長者分享心得或睇法（5 分鐘）]",
  " [1.1 現實導向: 問長者今日是幾年、幾月 、幾日、星期幾、什麼季節 、 時間、地點、地區（1~2 次）（第2次可以在運動後做）]",
  " [2.0 短期記憶: 以圖片或實物顯示三樣不同类別的物件， 請長者重複說出2次， 做完下面第4項(约5~10 分鐘後), 再問長者是否記得三樣物件是什麼?]",
  " [2.1 短期記憶: 請長者記住相同啤牌的位置，反轉啤牌, 然後請長者揭開相同NO. 的啤牌.]",
  " [3.0  懷緬治療: 顯示長者後生时的日常物品/香港地標/ 明星/或播放懷舊歌曲（ 可參考 附件二B, C, E), 請長者講出並引導長者分享以上人、事 、物（ 5至10分鐘）]",
  " [4.0 問長者還記得2.0的三件物件是什麼 ， 並請長者讀出]",
  " [5.1 說話流暢度: 請長者說出十種蔬菜/小食/國家/酒樓點心/港鐵站/地區/廚房物品/廁所物品（亦可因应長者熟悉或喜歡的物品) （1～2題）]",
  " [5.2 說話流暢度: 耆恩大使先讀語句(附件三), 然後請長者跟你讀一次]",
  " [6.0 運算: 問長者5～8題加減數 (加減題各半, 或可用啤牌、骰子或想像到街市買餸找續, 但切忌用真錢) (參附件三)]",
  " [7.1 聯想訓練: 向長者說出一個2~3 個字的詞語 ,然後請長者接龍(eg. 深水埗=> 補衫=> 三楼.... )(做2~3次,每次用不同的詞語來開始)]",
  " [7.2 聯想訓練: 以不直接說出答案任何一個字為原則用各種語音提示引導長者說出答案( 參附件二G) (玩1-2個)]",
  " [8.1 聽觉/專注力訓練: 依附件二F,耆恩大使慢慢出5-8組數字, 請長者以順序或倒序讀出]",
  " [8.2 聽觉/專注力訓練: 幻想在酒樓或餐廳, 請長者記住你點的餐, eg. 「唔該我想要兩壺茶、 一籠蝦餃 一籠鹹水角」「 一碗麥皮, 一件餐蛋治, 一杯熱檸水」]",
  " [8.3 聽觉/專注力訓練: 請長者說出兩幅圖有何不同之處(於google輸入「找不同遊戲」)]",
  "沒有進行或未能完成以上認知訓練的原因: ",
  "有無提供以下服務?\n    B1.1 耆力運動 \n    B1.3 防跌運動",
  "拉筋運動 [頸部]",
  "拉筋運動 [肩膊(A)]",
  "拉筋運動 [肩膊(B)]",
  "拉筋運動 [胸背(A)]",
  "拉筋運動 [胸背(B)]",
  "拉筋運動 [腰部(A)]",
  "拉筋運動 [腰部(B)]",
  "拉筋運動 [腿部(一)]",
  "拉筋運動 [腿部(二)]",
  "拉筋運動 [腳跟]",
  "帶氧運動 [1. 肩膊肌群+三頭肌]",
  "帶氧運動 [2. 胸肌+肩膊]",
  "帶氧運動 [3. 背肌]",
  "帶氧運動 [4. 肩膊肌群+三頭肌]",
  "帶氧運動 [5. 腹部+坐姿抬腿]",
  "帶氧運動 [6. 大腿兩側肌肉]",
  "帶氧運動 [7. 小腿肌肉]",
  "沒有進行或完成全部運動的原因: ",
  "B2. 有無提供特約專項服務?",
  "如有, 請註明: ",
  "如果是次有因應個人才藝而提供了增值服務, 請填上: ",
  "總結 / 特別事故  / 備註 / 意見 / 建議等等(請同時whatsapp 此部份至84817000), 例如",
  " [健腦八式]",
  "沒有進行或未能完成以上訓練的原因: ",
  " [Others ]"
] as const;

function joinNonEmpty(values: Array<string | null | undefined>, separator = ", "): string {
  return values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .join(separator);
}

function cleanDraftValue(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  return value === "未提及" ? "" : value;
}

function normalizeChoiceValue(value: string | null | undefined, fallback = ""): string {
  if (!value || value === "未提及") {
    return fallback;
  }

  if (value === "无") {
    return "沒有";
  }

  return value;
}

function looksLikeCompletionReason(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }

  return /(未完成|未能|不足|不適|不适|拒絕|拒绝|時間不足|时间不足|中止|暫停|暂停)/u.test(value);
}

function collectModuleRemarks(moduleReports: ModuleReportItem[], moduleIds: string[]) {
  return joinNonEmpty(
    moduleReports
      .filter((item) => moduleIds.includes(item.moduleId))
      .flatMap((item) => [item.remarks, item.completion]),
    ", "
  );
}

function buildSummaryField(report: GeneratedReport): string {
  return joinNonEmpty(
    [
      report.summaryAndRemarks.summary ? `總結：${report.summaryAndRemarks.summary}` : null,
      report.summaryAndRemarks.incident ? `特別事故：${report.summaryAndRemarks.incident}` : null,
      report.summaryAndRemarks.recommendation ? `建議：${report.summaryAndRemarks.recommendation}` : null
    ],
    "；"
  );
}

function buildElderStatus(report: GeneratedReport): string {
  return joinNonEmpty(
    [
      report.elderStatus.statusTags.length ? report.elderStatus.statusTags.join(", ") : null,
      report.elderStatus.interactionPerformance,
      report.elderStatus.physicalCondition
    ],
    ", "
  );
}

function buildGoogleFormRow(elder: ElderlyProfile, report: GeneratedReport): unknown[] {
  const cognitiveModuleIds = [
    "reality_orientation",
    "short_term_memory",
    "reminiscence_therapy",
    "delayed_recall",
    "verbal_fluency",
    "arithmetic_training",
    "association_training",
    "auditory_attention_training"
  ];
  const hasCognitiveModule = report.moduleReports.some((item) => cognitiveModuleIds.includes(item.moduleId));
  const hasMotionModule = false;
  const cognitiveReason = collectModuleRemarks(report.moduleReports, cognitiveModuleIds);
  const motionReason = cleanDraftValue(report.formDraft.motionTrainingReason);
  const environmentStatus =
    normalizeChoiceValue(report.formDraft.environmentIssue, report.summaryAndRemarks.incident && report.summaryAndRemarks.incident !== "无" ? report.summaryAndRemarks.incident : "沒有");
  const basicServices =
    cleanDraftValue(report.formDraft.basicServices) || report.completedServices.serviceItems.join(", ");
  const basicServiceReason = looksLikeCompletionReason(report.formDraft.basicServiceReason)
    ? cleanDraftValue(report.formDraft.basicServiceReason)
    : "";
  const hasCognitiveModuleChoice =
    normalizeChoiceValue(
      report.formDraft.cognitiveTrainingProvided,
      hasCognitiveModule ? "有" : "沒有"
    );
  const hasMotionModuleChoice = normalizeChoiceValue(
    report.formDraft.motionTrainingProvided,
    hasMotionModule ? "有" : "沒有"
  );
  const specialServiceProvided = normalizeChoiceValue(report.formDraft.specialServiceProvided, "沒有");

  return [
    new Date(report.generatedAt),
    "",
    "",
    report.sessionDate ?? "",
    "",
    elder.fullName,
    cleanDraftValue(report.formDraft.attendanceCount),
    cleanDraftValue(report.formDraft.attendees),
    environmentStatus,
    buildElderStatus(report),
    cleanDraftValue(report.formDraft.bloodPressure),
    cleanDraftValue(report.formDraft.heartRate),
    cleanDraftValue(report.formDraft.bloodOxygen),
    basicServices,
    basicServiceReason,
    hasCognitiveModuleChoice,
    cleanDraftValue(report.formDraft.realityOrientationSharing),
    cleanDraftValue(report.formDraft.realityOrientationQuestioning),
    cleanDraftValue(report.formDraft.shortTermMemoryObjects),
    cleanDraftValue(report.formDraft.shortTermMemoryCards),
    cleanDraftValue(report.formDraft.reminiscenceTherapy),
    cleanDraftValue(report.formDraft.delayedRecall),
    cleanDraftValue(report.formDraft.verbalFluencyNaming),
    cleanDraftValue(report.formDraft.verbalFluencyRepeat),
    cleanDraftValue(report.formDraft.arithmeticTraining),
    cleanDraftValue(report.formDraft.associationTrainingChain),
    cleanDraftValue(report.formDraft.associationTrainingHint),
    cleanDraftValue(report.formDraft.auditoryAttentionDigits),
    cleanDraftValue(report.formDraft.auditoryAttentionMenu),
    cleanDraftValue(report.formDraft.auditoryAttentionSpotDifference),
    looksLikeCompletionReason(report.formDraft.cognitiveTrainingReason)
      ? cleanDraftValue(report.formDraft.cognitiveTrainingReason)
      : cognitiveReason,
    hasMotionModuleChoice,
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    motionReason,
    specialServiceProvided,
    cleanDraftValue(report.formDraft.specialServiceDetail),
    cleanDraftValue(report.formDraft.valueAddedService),
    buildSummaryField(report),
    cleanDraftValue(report.formDraft.brainTraining),
    cleanDraftValue(report.formDraft.trainingOther),
    ""
  ];
}

export function buildGoogleFormWorkbookBuffer(params: { elder: ElderlyProfile; report: GeneratedReport }): Buffer {
  const worksheet = XLSX.utils.aoa_to_sheet([[...GOOGLE_FORM_HEADERS], buildGoogleFormRow(params.elder, params.report)]);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Form Responses 1");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export function buildGoogleFormExportFilename(elder: ElderlyProfile, report: GeneratedReport): string {
  const datePart = report.sessionDate ?? report.generatedAt.slice(0, 10);
  return `${elder.fullName}-${datePart}-google-form-report.xlsx`;
}
