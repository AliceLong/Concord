"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { type DemoAttendanceReport } from "@/lib/attendance-demo";
import styles from "@/components/monthly-attendance-report-page.module.css";

interface MonthlyAttendanceReportPageProps {
  report: DemoAttendanceReport;
}

export function MonthlyAttendanceReportPage({ report }: MonthlyAttendanceReportPageProps) {
  const [sent, setSent] = useState(false);

  async function handleSendWhatsApp() {
    const text = `${report.title} 已生成，請查看本月考勤表。`;
    const shareData: ShareData = {
      title: report.title,
      text
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setSent(true);
        return;
      } catch {
        // Fall back to WhatsApp link if native sharing is unavailable or cancelled.
      }
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    setSent(true);
  }

  if (sent) {
    return (
      <section className={styles.successPage}>
        <Image
          className={styles.successGif}
          src="/assets/gif/finish_once.gif"
          alt=""
          width={256}
          height={384}
          unoptimized
        />
        <h1>本月考勤表已發送</h1>
        <p>這個月真是辛苦啦!</p>
        <Link className={styles.homeButton} href="/">
          返回首頁
        </Link>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <header className={styles.topBar}>
        <Link href="/attendance-reports" aria-label="返回">
          <Image src="/assets/icons/icon-back.svg" alt="" width={32} height={32} />
        </Link>
        <h1>本月考勤報告</h1>
        <span />
      </header>

      <article className={styles.reportCard}>
        <Image
          className={styles.reportImage}
          src="/assets/images/monthly-attendance-report.png"
          alt="本月考勤報告"
          width={1363}
          height={2026}
          priority
        />
      </article>

      <button className={styles.sendButton} type="button" onClick={handleSendWhatsApp}>
        發送至 WhatsApp
      </button>
    </section>
  );
}
