"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Download, RefreshCcw } from "lucide-react";
import { serializeCareModuleIds, type CareModuleId } from "@/lib/care-modules";
import {
  buildReportSessionStorageKey,
  readPersistedReportSession,
  type PersistedReportSession
} from "@/lib/report-session-storage";
import type { ElderlyProfile } from "@/types/elderly";
import { ReportResultView } from "@/components/report-result-view";
import styles from "@/components/report-result-page.module.css";

interface ReportResultPageProps {
  elder: ElderlyProfile;
  selectedModules: CareModuleId[];
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text) {
    throw new Error("服务端返回了空响应。");
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`服务端返回了非 JSON 响应：${text.slice(0, 200)}`);
  }
}

function parseFilename(disposition: string | null, fallback: string) {
  if (!disposition) {
    return fallback;
  }

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);

  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const plainMatch = disposition.match(/filename="?([^"]+)"?/i);
  return plainMatch?.[1] ?? fallback;
}

export function ReportResultPage({ elder, selectedModules }: ReportResultPageProps) {
  const [session, setSession] = useState<PersistedReportSession | null>(null);
  const [exportPending, setExportPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const storageKey = buildReportSessionStorageKey(elder.id, selectedModules);
  const asrHref = `/report/${elder.id}?modules=${serializeCareModuleIds(selectedModules)}`;

  useEffect(() => {
    setSession(readPersistedReportSession(storageKey));
  }, [storageKey]);

  async function handleExport() {
    if (!session?.generatedReport) {
      setError("未找到可导出的报告，请返回录音页重新生成。");
      return;
    }

    setExportPending(true);
    setError(null);

    try {
      const response = await fetch("/api/report/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          elderId: elder.id,
          report: session.generatedReport
        })
      });

      if (!response.ok) {
        const body = await readJsonResponse<{ error?: string }>(response);
        throw new Error(body.error ?? "导出失败");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const fallbackFilename = `${elder.fullName}-${session.generatedReport.sessionDate ?? "report"}-google-form-report.xlsx`;

      link.href = url;
      link.download = parseFilename(response.headers.get("Content-Disposition"), fallbackFilename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "导出失败");
    } finally {
      setExportPending(false);
    }
  }

  if (!session?.generatedReport) {
    return (
      <section className={styles.wrapper}>
        <div className={styles.emptyState}>
          <p>当前会话中没有可展示的报告，请返回录音页重新生成。</p>
          <Link className={styles.actionButton} href={asrHref}>
            返回录音页
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.wrapper}>
      <div className={styles.toolbar}>
        <p className={styles.status}>可返回录音页继续修改文本；已选模块和已录入文本会保留。</p>
        <div className={styles.actions}>
          <Link className={styles.actionButton} href={asrHref}>
            返回录音页
          </Link>
          <button className={styles.primaryButton} onClick={handleExport} disabled={exportPending}>
            {exportPending ? <RefreshCcw size={16} className={styles.spin} /> : <Download size={16} />}
            导出 Google Form 报告
          </button>
        </div>
      </div>

      {error ? <div className={styles.error}>{error}</div> : null}

      <ReportResultView generatedReport={session.generatedReport} />
    </section>
  );
}
