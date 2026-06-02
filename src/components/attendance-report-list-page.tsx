"use client";

import Image from "next/image";
import Link from "next/link";
import { demoAttendanceReports } from "@/lib/attendance-demo";
import styles from "@/components/attendance-report-list-page.module.css";

export function AttendanceReportListPage() {
  return (
    <section className={styles.page}>
      <header className={styles.topBar}>
        <Link href="/profile" aria-label="返回">
          <Image src="/assets/icons/icon-back.svg" alt="" width={32} height={32} />
        </Link>
        <h1>考勤报告</h1>
        <span />
      </header>

      <div className={styles.summary}>
        <p>本月服务完成率</p>
        <strong>96%</strong>
      </div>

      <div className={styles.list}>
        {demoAttendanceReports.map((report) => (
          <Link key={report.id} className={styles.card} href={`/attendance-reports/${report.id}`}>
            <div className={styles.thumb}>
              <Image src="/assets/images/bee-report.svg" alt="" width={42} height={56} />
            </div>
            <div className={styles.content}>
              <h2>{report.title}</h2>
              <p>{report.period}</p>
              <div className={styles.meta}>
                <span>{report.reportCount} 份报告</span>
                <span>{report.completionRate}</span>
              </div>
            </div>
            <Image className={styles.arrow} src="/assets/icons/icon-arrow-circle-right.svg" alt="" width={44} height={44} />
          </Link>
        ))}
      </div>
    </section>
  );
}
