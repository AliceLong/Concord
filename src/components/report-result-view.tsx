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
          <p className={styles.reportTitle}>模块化结果</p>
        </div>
        <div className={styles.moduleList}>
          <div className={styles.moduleBlock}>
            <p className={styles.moduleName}>【长者状态】</p>
            <p className={styles.moduleContent}>
              状态标签：{generatedReport.elderStatus.statusTags.length ? generatedReport.elderStatus.statusTags.join("、") : "未提及"}
            </p>
            <p className={styles.moduleContent}>互动表现：{generatedReport.elderStatus.interactionPerformance ?? "未提及"}</p>
            <p className={styles.moduleContent}>身体情况：{generatedReport.elderStatus.physicalCondition ?? "未提及"}</p>
          </div>
          <div className={styles.moduleBlock}>
            <p className={styles.moduleName}>【已完成服务】</p>
            <p className={styles.moduleContent}>
              服务项目：
              {generatedReport.completedServices.serviceItems.length
                ? generatedReport.completedServices.serviceItems.join("、")
                : "未提及"}
            </p>
            <p className={styles.moduleContent}>完成情况：{generatedReport.completedServices.completion ?? "未提及"}</p>
            <p className={styles.moduleContent}>长者表现：{generatedReport.completedServices.elderPerformance ?? "未提及"}</p>
          </div>
          {generatedReport.moduleReports.map((item) => (
            <div key={item.moduleId} className={styles.moduleBlock}>
              <p className={styles.moduleName}>【{item.moduleTitle}】</p>
              <p className={styles.moduleContent}>服务内容：{item.serviceContent ?? "未提及"}</p>
              <p className={styles.moduleContent}>长者反应：{item.elderResponse ?? "未提及"}</p>
              <p className={styles.moduleContent}>完成情况：{item.completion ?? "未提及"}</p>
              <p className={styles.moduleContent}>备注：{item.remarks ?? "未提及"}</p>
            </div>
          ))}
          <div className={styles.moduleBlock}>
            <p className={styles.moduleName}>【总结 / 特别事故 / 建议】</p>
            <p className={styles.moduleContent}>总结：{generatedReport.summaryAndRemarks.summary ?? "未提及"}</p>
            <p className={styles.moduleContent}>特别事故：{generatedReport.summaryAndRemarks.incident ?? "未提及"}</p>
            <p className={styles.moduleContent}>后续建议：{generatedReport.summaryAndRemarks.recommendation ?? "未提及"}</p>
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
