"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { getCareModuleById, serializeCareModuleIds, type CareModuleId } from "@/lib/care-modules";
import {
  buildReportSessionStorageKey,
  readPersistedReportSession,
  writePersistedReportSession,
  type EditablePatientSnapshot,
  type ModuleRecognitionResult,
  type PersistedReportSession
} from "@/lib/report-session-storage";
import type { ElderlyProfile } from "@/types/elderly";
import type { GeneratedReport, ModuleReportItem } from "@/types/report";
import styles from "@/components/report-result-page.module.css";

interface ReportResultPageProps {
  elder: ElderlyProfile;
  taskId?: string;
  selectedModules: CareModuleId[];
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text) {
    throw new Error("服務端返回了空響應。");
  }

  return JSON.parse(text) as T;
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

function buildPatientSnapshot(elder: ElderlyProfile): EditablePatientSnapshot {
  return {
    fullName: elder.fullName,
    orderNo: elder.orderNo ?? elder.roomNo ?? "未設定",
    bloodPressure: elder.vitals?.bloodPressure ?? "",
    heartRate: elder.vitals?.heartRate ?? "",
    bloodOxygen: elder.vitals?.bloodOxygen ?? "",
    statusTags: elder.statusTags ?? []
  };
}

function buildModuleText(item: ModuleReportItem): string {
  return [
    item.serviceContent ? `服務內容：${item.serviceContent}` : "",
    item.elderResponse ? `長者反應：${item.elderResponse}` : "",
    item.completion ? `完成情況：${item.completion}` : "",
    item.remarks ? `備註：${item.remarks}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

export function ReportResultPage({ elder, taskId, selectedModules }: ReportResultPageProps) {
  const storageKey = buildReportSessionStorageKey(elder.id, selectedModules);
  const [session, setSession] = useState<PersistedReportSession | null>(null);
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [moduleResults, setModuleResults] = useState<ModuleRecognitionResult[]>([]);
  const [patient, setPatient] = useState<EditablePatientSnapshot>(() => buildPatientSnapshot(elder));
  const [exportPending, setExportPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modulesQuery = serializeCareModuleIds(selectedModules);
  const asrHref = `/report/${elder.id}?modules=${modulesQuery}${taskId ? `&taskId=${encodeURIComponent(taskId)}` : ""}`;
  const whatsappHref = `/report/${elder.id}/whatsapp?modules=${modulesQuery}${taskId ? `&taskId=${encodeURIComponent(taskId)}` : ""}`;

  useEffect(() => {
    const persisted = readPersistedReportSession(storageKey);
    setSession(persisted);
    setReport(persisted?.generatedReport ?? null);
    setModuleResults(persisted?.moduleResults ?? []);
    setPatient(persisted?.patientSnapshot ?? buildPatientSnapshot(elder));
  }, [elder, storageKey]);

  const moduleCards = useMemo(
    () =>
      selectedModules.map((moduleId) => {
        const careModule = getCareModuleById(moduleId);
        const moduleReport = report?.moduleReports.find((item) => item.moduleId === moduleId) ?? null;
        const recognition = moduleResults.find((item) => item.moduleId === moduleId) ?? null;

        return {
          careModule,
          moduleReport,
          recognition,
          text: moduleReport ? buildModuleText(moduleReport) : recognition?.extractedText ?? ""
        };
      }),
    [moduleResults, report, selectedModules]
  );

  function persist(nextReport: GeneratedReport | null, nextPatient = patient) {
    if (!session) {
      return;
    }

    writePersistedReportSession(storageKey, {
      ...session,
      generatedReport: nextReport,
      patientSnapshot: nextPatient,
      updatedAt: new Date().toISOString()
    });
  }

  function updatePatient(field: keyof EditablePatientSnapshot, value: string) {
    const nextPatient =
      field === "statusTags"
        ? { ...patient, statusTags: value.split(/[、,，]/).map((item) => item.trim()).filter(Boolean) }
        : { ...patient, [field]: value };

    setPatient(nextPatient);
    persist(report, nextPatient);
  }

  function updateModule(moduleId: CareModuleId, value: string) {
    if (!report) {
      return;
    }

    const nextReport: GeneratedReport = {
      ...report,
      moduleReports: report.moduleReports.map((item) =>
        item.moduleId === moduleId
          ? {
              ...item,
              serviceContent: value || null,
              elderResponse: item.elderResponse,
              completion: value ? item.completion ?? "已補充" : null,
              remarks: item.remarks
            }
          : item
      )
    };

    setReport(nextReport);
    persist(nextReport);
  }

  async function handleExport() {
    if (!report) {
      setError("未找到可導出的報告，請返回錄音頁重新生成。");
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
          report
        })
      });

      if (!response.ok) {
        const body = await readJsonResponse<{ error?: string }>(response);
        throw new Error(body.error ?? "導出失敗");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const fallbackFilename = `${patient.fullName}-${report.sessionDate ?? "report"}-google-form-report.xlsx`;

      link.href = url;
      link.download = parseFilename(response.headers.get("Content-Disposition"), fallbackFilename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "導出失敗");
    } finally {
      setExportPending(false);
    }
  }

  if (!report) {
    return (
      <section className={styles.wrapper}>
        <div className={styles.emptyState}>
          <p>當前會話中沒有可展示的報告，請返回錄音頁重新生成。</p>
          <Link className={styles.actionButton} href={asrHref}>
            返回錄音頁
          </Link>
        </div>
      </section>
    );
  }

  const displayOrderNo = /^(OR|CLT)-/i.test(patient.orderNo) ? patient.orderNo : `OR-${patient.orderNo}`;

  return (
    <section className={styles.wrapper}>
      <div className={styles.patientPanel}>
        <div className={styles.avatar}>
          <Image src="/assets/images/elder-sunflower.svg" alt="" width={64} height={64} />
        </div>
        <div className={styles.patientMain}>
          <h2 className={styles.nameText}>{patient.fullName}</h2>
          <p className={styles.orderText}>{displayOrderNo}</p>
        </div>
        <label className={styles.dateField}>
          <Image src="/assets/icons/icon-calendar.svg" alt="" width={18} height={18} />
          <input
            type="date"
            value={report.sessionDate ?? new Date().toISOString().slice(0, 10)}
            onChange={(event) => {
              const nextReport = { ...report, sessionDate: event.target.value };
              setReport(nextReport);
              persist(nextReport);
            }}
          />
        </label>
      </div>

      <div className={styles.tagsList} aria-label="狀態標籤">
        {patient.statusTags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>

      <div className={styles.vitals}>
        <label>
          <span>血壓</span>
          <input value={patient.bloodPressure} onChange={(event) => updatePatient("bloodPressure", event.target.value)} />
        </label>
        <label>
          <span>心跳</span>
          <input value={patient.heartRate} onChange={(event) => updatePatient("heartRate", event.target.value)} />
        </label>
        <label>
          <span>血氧</span>
          <input value={patient.bloodOxygen} onChange={(event) => updatePatient("bloodOxygen", event.target.value)} />
        </label>
      </div>

      {error ? <div className={styles.error}>{error}</div> : null}

      <div className={styles.moduleList}>
        {moduleCards.map(({ careModule, recognition, text }) => {
          const ok = recognition?.recognized ?? Boolean(text.trim());

          return (
            <article key={careModule.id} className={ok ? styles.moduleCardOk : styles.moduleCardMissing}>
              <div className={styles.moduleHeader}>
                <h2>【{careModule.number}】{careModule.title}</h2>
                <Image
                  src={ok ? "/assets/icons/icon-check.svg" : "/assets/icons/icon-alert.svg"}
                  alt={ok ? "已完成" : "未識別"}
                  width={24}
                  height={24}
                />
              </div>
              <p>{careModule.prompt}</p>
              <textarea
                value={text}
                onChange={(event) => updateModule(careModule.id, event.target.value)}
                placeholder="點擊卡片後可在這裡手動輸入或修改。"
              />
            </article>
          );
        })}
      </div>

      <div className={styles.floatingActions}>
        <button className={styles.primaryButton} onClick={handleExport} disabled={exportPending}>
          {exportPending ? <RefreshCcw size={16} className={styles.spin} /> : null}
          上傳至 Google Form
        </button>
        <Link className={styles.whatsappButton} href={whatsappHref}>
          <Image src="/assets/icons/icon-arrow-circle-right.svg" alt="" width={44} height={44} />
          WhatsApp 報告
        </Link>
      </div>
    </section>
  );
}
