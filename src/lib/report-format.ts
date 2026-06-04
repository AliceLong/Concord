import type { ElderlyProfile } from "@/types/elderly";
import type {
  CompletedServicesSection,
  ElderStatusSection,
  ModuleReportItem,
  SummaryRemarksSection
} from "@/types/report";

export function buildModuleReportText(params: {
  elder: ElderlyProfile;
  sessionDate?: string;
  elderStatus: ElderStatusSection;
  completedServices: CompletedServicesSection;
  moduleReports: ModuleReportItem[];
  summaryAndRemarks: SummaryRemarksSection;
  transcript: string;
}): string {
  const sessionLine = params.sessionDate ? `記錄日期：${params.sessionDate}` : null;
  const moduleLines = params.moduleReports.flatMap((item) => [
    `【${item.moduleTitle}】`,
    `服務內容：${item.serviceContent ?? "未提及"}`,
    `長者反應：${item.elderResponse ?? "未提及"}`,
    `完成情況：${item.completion ?? "未提及"}`,
    `備註：${item.remarks ?? "未提及"}`,
    ""
  ]);

  return [
    "【服務報告】",
    `長者：${params.elder.fullName}（房間 ${params.elder.roomNo ?? "未設定"}）`,
    sessionLine,
    "",
    "【長者狀態】",
    `狀態標籤：${params.elderStatus.statusTags.length ? params.elderStatus.statusTags.join("、") : "未提及"}`,
    `互動表現：${params.elderStatus.interactionPerformance ?? "未提及"}`,
    `身體情況：${params.elderStatus.physicalCondition ?? "未提及"}`,
    "",
    "【已完成服務】",
    `服務項目：${params.completedServices.serviceItems.length ? params.completedServices.serviceItems.join("、") : "未提及"}`,
    `完成情況：${params.completedServices.completion ?? "未提及"}`,
    `長者表現：${params.completedServices.elderPerformance ?? "未提及"}`,
    "",
    "【模塊化記錄】",
    ...moduleLines,
    "【總結 / 特別事故 / 建議】",
    `總結：${params.summaryAndRemarks.summary ?? "未提及"}`,
    `特別事故：${params.summaryAndRemarks.incident ?? "未提及"}`,
    `後續建議：${params.summaryAndRemarks.recommendation ?? "未提及"}`,
    "",
    "【確認文本】",
    params.transcript
  ]
    .filter(Boolean)
    .join("\n");
}
