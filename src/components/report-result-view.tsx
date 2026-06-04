"use client";

import type { GeneratedReport } from "@/types/report";
import styles from "@/components/report-session.module.css";

interface ReportResultViewProps {
  generatedReport: GeneratedReport;
}

export function ReportResultView({ generatedReport }: ReportResultViewProps) {
  return (
    <section className={styles.reportSection}>
      <div className={styles.reportPreview}>
        <div className={styles.reportHeader}>
          <p className={styles.reportTitle}>模塊化結果</p>
        </div>
        <div className={styles.moduleList}>
          <div className={styles.moduleBlock}>
            <p className={styles.moduleName}>【長者狀態】</p>
            <p className={styles.moduleContent}>
              狀態標籤：{generatedReport.elderStatus.statusTags.length ? generatedReport.elderStatus.statusTags.join("、") : "未提及"}
            </p>
            <p className={styles.moduleContent}>互動表現：{generatedReport.elderStatus.interactionPerformance ?? "未提及"}</p>
            <p className={styles.moduleContent}>身體情況：{generatedReport.elderStatus.physicalCondition ?? "未提及"}</p>
          </div>
          <div className={styles.moduleBlock}>
            <p className={styles.moduleName}>【已完成服務】</p>
            <p className={styles.moduleContent}>
              服務項目：
              {generatedReport.completedServices.serviceItems.length
                ? generatedReport.completedServices.serviceItems.join("、")
                : "未提及"}
            </p>
            <p className={styles.moduleContent}>完成情況：{generatedReport.completedServices.completion ?? "未提及"}</p>
            <p className={styles.moduleContent}>長者表現：{generatedReport.completedServices.elderPerformance ?? "未提及"}</p>
          </div>
          {generatedReport.moduleReports.map((item) => (
            <div key={item.moduleId} className={styles.moduleBlock}>
              <p className={styles.moduleName}>【{item.moduleTitle}】</p>
              <p className={styles.moduleContent}>服務內容：{item.serviceContent ?? "未提及"}</p>
              <p className={styles.moduleContent}>長者反應：{item.elderResponse ?? "未提及"}</p>
              <p className={styles.moduleContent}>完成情況：{item.completion ?? "未提及"}</p>
              <p className={styles.moduleContent}>備註：{item.remarks ?? "未提及"}</p>
            </div>
          ))}
          <div className={styles.moduleBlock}>
            <p className={styles.moduleName}>【總結 / 特別事故 / 建議】</p>
            <p className={styles.moduleContent}>總結：{generatedReport.summaryAndRemarks.summary ?? "未提及"}</p>
            <p className={styles.moduleContent}>特別事故：{generatedReport.summaryAndRemarks.incident ?? "未提及"}</p>
            <p className={styles.moduleContent}>後續建議：{generatedReport.summaryAndRemarks.recommendation ?? "未提及"}</p>
          </div>
        </div>
      </div>

      <div className={styles.reportPreview}>
        <p className={styles.reportTitle}>Report 文本</p>
        <pre className={styles.pre}>{generatedReport.reportText}</pre>
      </div>
    </section>
  );
}
