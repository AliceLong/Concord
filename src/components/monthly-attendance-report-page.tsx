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
    const text = `${report.title} 已生成。完成率：${report.completionRate}，报告数量：${report.reportCount}。`;
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
        <h1>本月考勤表已发送</h1>
        <p>这个月真是辛苦啦!</p>
        <Link className={styles.homeButton} href="/">
          返回首页
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
        <h1>本月考勤报告</h1>
        <span />
      </header>

      <article className={styles.reportCard}>
        <h2>{report.title}</h2>
        <p>
          {report.period}，共 {report.reportCount} 份报告，完成率 {report.completionRate}。
        </p>
        <div className={styles.placeholder}>
          <Image className={styles.beeFlight} src="/assets/images/bee-flight.svg" alt="" width={152} height={137} />
          <Image src="/assets/images/image-gallery-placeholder.svg" alt="本月考勤报告预览" width={96} height={96} />
        </div>
        <p className={styles.shareHint}>电脑端会打开 WhatsApp 文字分享；手机端如支持系统分享，可直接选择 WhatsApp。</p>
      </article>

      <button className={styles.sendButton} type="button" onClick={handleSendWhatsApp}>
        发送至 WhatsApp
      </button>
    </section>
  );
}
