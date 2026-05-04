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
  const sessionLine = params.sessionDate ? `记录日期：${params.sessionDate}` : null;
  const moduleLines = params.moduleReports.flatMap((item) => [
    `【${item.moduleTitle}】`,
    `服務內容：${item.serviceContent ?? "未提及"}`,
    `長者反應：${item.elderResponse ?? "未提及"}`,
    `完成情況：${item.completion ?? "未提及"}`,
    `備註：${item.remarks ?? "未提及"}`,
    ""
  ]);

  return [
    "【服务报告】",
    `长者：${params.elder.fullName}（房间 ${params.elder.roomNo ?? "未设定"}）`,
    sessionLine,
    "",
    "【长者状态】",
    `状态标签：${params.elderStatus.statusTags.length ? params.elderStatus.statusTags.join("、") : "未提及"}`,
    `互动表现：${params.elderStatus.interactionPerformance ?? "未提及"}`,
    `身体情况：${params.elderStatus.physicalCondition ?? "未提及"}`,
    "",
    "【已完成服务】",
    `服务项目：${params.completedServices.serviceItems.length ? params.completedServices.serviceItems.join("、") : "未提及"}`,
    `完成情况：${params.completedServices.completion ?? "未提及"}`,
    `长者表现：${params.completedServices.elderPerformance ?? "未提及"}`,
    "",
    "【模块化记录】",
    ...moduleLines,
    "【总结 / 特别事故 / 建议】",
    `总结：${params.summaryAndRemarks.summary ?? "未提及"}`,
    `特别事故：${params.summaryAndRemarks.incident ?? "未提及"}`,
    `后续建议：${params.summaryAndRemarks.recommendation ?? "未提及"}`,
    "",
    "【确认文本】",
    params.transcript
  ]
    .filter(Boolean)
    .join("\n");
}
