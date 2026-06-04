"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { serializeCareModuleIds, type CareModuleId } from "@/lib/care-modules";
import { buildReportSessionStorageKey, readPersistedReportSession } from "@/lib/report-session-storage";
import type { ElderlyProfile } from "@/types/elderly";
import type { GeneratedReport } from "@/types/report";
import styles from "@/components/whatsapp-report-page.module.css";

interface WhatsAppReportPageProps {
  elder: ElderlyProfile;
  taskId?: string;
  selectedModules: CareModuleId[];
}

function buildWhatsAppSummary(report: GeneratedReport | null, elder: ElderlyProfile): string {
  if (!report) {
    return `${elder.fullName} 今日服務記錄已完成，詳情請查看護理報告。`;
  }

  const moduleSummary = report.moduleReports
    .map((item) => {
      const parts = [item.serviceContent, item.elderResponse, item.completion, item.remarks].filter(Boolean);
      return parts.join("，");
    })
    .filter(Boolean)
    .join("。");

  return [
    `${elder.fullName} 今日已完成服務記錄。`,
    report.elderStatus.statusTags.length ? `觀察到：${report.elderStatus.statusTags.join("、")}。` : "",
    moduleSummary,
    report.summaryAndRemarks.recommendation ? `後續建議：${report.summaryAndRemarks.recommendation}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

export function WhatsAppReportPage({ elder, taskId, selectedModules }: WhatsAppReportPageProps) {
  const router = useRouter();
  const storageKey = buildReportSessionStorageKey(elder.id, selectedModules);
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [message, setMessage] = useState("");
  const [imageNames, setImageNames] = useState<string[]>([]);
  const [hasOpenedWhatsApp, setHasOpenedWhatsApp] = useState(false);
  const modulesQuery = serializeCareModuleIds(selectedModules);
  const doneHref = `/report/${elder.id}/done?modules=${modulesQuery}${taskId ? `&taskId=${encodeURIComponent(taskId)}` : ""}`;

  useEffect(() => {
    const persisted = readPersistedReportSession(storageKey);
    setReport(persisted?.generatedReport ?? null);
  }, [storageKey]);

  const defaultMessage = useMemo(() => buildWhatsAppSummary(report, elder), [elder, report]);

  useEffect(() => {
    setMessage(defaultMessage);
  }, [defaultMessage]);

  function handleOpenWhatsApp() {
    const normalizedMessage = message.trim();

    if (!normalizedMessage) {
      return;
    }

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(normalizedMessage)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setHasOpenedWhatsApp(true);
  }

  function handleConfirmSent() {
    router.push(doneHref);
  }

  return (
    <section className={styles.wrapper}>
      <div className={styles.uploadBlock}>
        <h2>上傳圖片</h2>
        <label className={styles.uploadBox}>
          <Image src="/assets/images/image-gallery-placeholder.svg" alt="" width={64} height={64} />
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => {
              setImageNames(Array.from(event.target.files ?? []).map((file) => file.name));
            }}
          />
        </label>
        {imageNames.length ? <p className={styles.imageNames}>{imageNames.join("、")}</p> : null}
        <p className={styles.uploadHint}>圖片會在此頁預覽文件名；WhatsApp 打開後請在聊天窗口中手動附加圖片。</p>
      </div>

      <div className={styles.messageBlock}>
        <h2>修飾後報告</h2>
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} />
      </div>

      {hasOpenedWhatsApp ? (
        <div className={styles.confirmPanel}>
          <p>已打開 WhatsApp。請在 WhatsApp 中選擇聯繫人，確認報告文字已帶入輸入框後手動發送。</p>
          {imageNames.length ? <p>如需發送圖片，請在 WhatsApp 中手動附加剛才選擇的圖片。</p> : null}
        </div>
      ) : null}

      <div className={styles.bottomActions}>
        <button className={styles.sendButton} type="button" onClick={handleOpenWhatsApp} disabled={!message.trim()}>
          {hasOpenedWhatsApp ? "重新打開 WhatsApp" : "發送至 WhatsApp"}
        </button>
        <button
          className={hasOpenedWhatsApp ? styles.confirmButton : styles.nextButton}
          type="button"
          onClick={hasOpenedWhatsApp ? handleConfirmSent : undefined}
          disabled={!hasOpenedWhatsApp}
          aria-label={hasOpenedWhatsApp ? "我已發送" : "請先打開 WhatsApp"}
          title={hasOpenedWhatsApp ? "我已發送" : "請先打開 WhatsApp"}
        >
          <Image
            src={hasOpenedWhatsApp ? "/assets/icons/icon-check.svg" : "/assets/icons/icon-arrow-circle-right.svg"}
            alt=""
            width={hasOpenedWhatsApp ? 24 : 44}
            height={hasOpenedWhatsApp ? 24 : 44}
          />
        </button>
      </div>
    </section>
  );
}
