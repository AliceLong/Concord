"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { demoAttendanceReports } from "@/lib/attendance-demo";
import styles from "@/components/attendance-report-list-page.module.css";

type ReportRange = "3m" | "6m" | "1y";

const rangeOptions: Array<{ id: ReportRange; label: string; reportIds: string[] }> = [
  { id: "3m", label: "最近3個月", reportIds: ["2026-10", "2026-11", "2026-12"] },
  { id: "6m", label: "最近6個月", reportIds: ["2026-07", "2026-08", "2026-09", "2026-10", "2026-11", "2026-12"] },
  { id: "1y", label: "最近1年", reportIds: ["2026-07", "2026-08", "2026-09", "2026-10", "2026-11", "2026-12"] }
];

export function AttendanceReportListPage() {
  const [activeRange, setActiveRange] = useState<ReportRange>("1y");
  const currentReport = demoAttendanceReports.find((report) => report.id === "2026-03") ?? demoAttendanceReports[0];
  const activeOption = rangeOptions.find((option) => option.id === activeRange) ?? rangeOptions[2];
  const reportRows = activeOption.reportIds
    .map((id) => demoAttendanceReports.find((report) => report.id === id))
    .filter((report): report is NonNullable<typeof report> => Boolean(report));

  return (
    <section className={styles.page}>
      <header className={styles.topBar}>
        <Link className={styles.backButton} href="/profile" aria-label="返回">
          <Image src="/assets/icons/icon-back.svg" alt="" width={32} height={32} />
        </Link>
        <h1>報告詳情</h1>
        <span />
      </header>

      <Link className={styles.featureCard} href={`/attendance-reports/${currentReport.id}`}>
        <div className={styles.featureHeader}>
          <Image src="/assets/images/bee-small.svg" alt="" width={36} height={32} />
          <strong>本月報告</strong>
        </div>
        <div className={styles.featureBody}>
          <div className={styles.featureDate}>
            <span>服務日期</span>
            <strong>{currentReport.month}</strong>
          </div>
          <span className={styles.featureName}>Doris</span>
          <span className={styles.chevron} aria-hidden="true" />
        </div>
      </Link>

      <div className={styles.filters} aria-label="報告範圍">
        {rangeOptions.map((option) => {
          const isActive = option.id === activeRange;

          return (
            <button
              key={option.id}
              className={isActive ? styles.activeFilter : undefined}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveRange(option.id)}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className={styles.list}>
        {reportRows.map((report) => (
          <Link key={report.id} className={styles.row} href={`/attendance-reports/${report.id}`}>
            <span>服務日期&nbsp;&nbsp;{report.month}</span>
            <strong>Doris</strong>
            <span className={styles.rowChevron} aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}
