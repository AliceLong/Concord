import {
  appendTimelineEvent,
  getReportById,
  markReportFailed,
  markReportReady
} from "@/server/repositories/report-repository";
import { buildStructuredReport } from "@/server/services/report-generator";

export async function processPendingReport(reportId: string): Promise<void> {
  const report = await getReportById(reportId);
  if (!report) {
    throw new Error(`Report not found: ${reportId}`);
  }

  if (report.status === "ready") {
    return;
  }

  try {
    const transcriptionRaw = report.transcriptionRaw?.trim();
    if (!transcriptionRaw) {
      throw new Error("Report has no transcription content to process.");
    }

    const { structured, reportText } = buildStructuredReport(transcriptionRaw);

    await markReportReady({
      reportId,
      transcriptionRaw,
      reportStructured: structured,
      reportText
    });

    await appendTimelineEvent({
      elderId: report.elderId,
      eventType: "report_ready",
      title: "照护报告已生成",
      detail: reportText.slice(0, 120)
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown processing error";
    await markReportFailed(reportId, reason);
    throw error;
  }
}
