"use client";

import { startTransition, useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CircleDot,
  FileText,
  Home,
  MessageSquare,
  Mic,
  Play,
  RefreshCcw,
  Send,
  Sparkles,
  UserRound
} from "lucide-react";
import styles from "@/components/workstation-shell.module.css";
import type { CareReport } from "@/types/report";
import type {
  ChatReplyPayload,
  ChatTurn,
  DashboardPayload,
  ElderOption,
  ReportListItem
} from "@/types/workstation";

type TabKey = "home" | "chat" | "report";

const reportSuggestions = [
  "今天精神稳定，午餐吃了七成，步行需要轻扶。",
  "夜间有轻微咳嗽，血氧需要继续观察。",
  "已提醒按时服药，建议下个班次跟进食欲。"
] as const;

const chatSuggestions = [
  "帮我总结今天这位长者的观察重点",
  "把内容整理成交班用语",
  "有哪些风险要升级通知护士"
] as const;

const preferredMimeTypes = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/ogg"
] as const;

function getSupportedAudioMimeType(): string | null {
  if (typeof MediaRecorder === "undefined") {
    return null;
  }

  for (const mimeType of preferredMimeTypes) {
    if (typeof MediaRecorder.isTypeSupported === "function" && MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }

  return null;
}

function extensionFromMimeType(mimeType: string): string {
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("mp4")) return "m4a";
  return "bin";
}

function formatTime(value: string | null): string {
  if (!value) {
    return "未生成";
  }

  return new Date(value).toLocaleString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    month: "numeric",
    day: "numeric"
  });
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(body.error ?? "Request failed");
  }

  return body;
}

export function WorkstationShell() {
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [elders, setElders] = useState<ElderOption[]>([]);
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [selectedElderId, setSelectedElderId] = useState<string>("");
  const [selectedReportId, setSelectedReportId] = useState<string>("");
  const [screenError, setScreenError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [chatMessages, setChatMessages] = useState<ChatTurn[]>([
    {
      role: "assistant",
      content: "我是 Concord 护理助手。你可以问我交班重点、风险提示，或者让我把观察内容整理成报告。"
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatPending, setChatPending] = useState(false);

  const [createdBy, setCreatedBy] = useState("护工A");
  const [orgPin, setOrgPin] = useState("");
  const [noteText, setNoteText] = useState("");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [reportPending, setReportPending] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const selectedReport = reports.find((item) => item.id === selectedReportId) ?? reports[0] ?? null;
  const selectedElder = elders.find((item) => item.id === selectedElderId) ?? null;

  async function refreshShellData() {
    const [dashboardResponse, elderResponse, reportResponse] = await Promise.all([
      fetchJson<{ dashboard: DashboardPayload }>("/api/dashboard"),
      fetchJson<{ elders: ElderOption[] }>("/api/elders"),
      fetchJson<{ reports: ReportListItem[] }>("/api/reports?limit=24")
    ]);

    startTransition(() => {
      setDashboard(dashboardResponse.dashboard);
      setElders(elderResponse.elders);
      setReports(reportResponse.reports);
      setSelectedElderId((current) => current || elderResponse.elders[0]?.id || "");
      setSelectedReportId((current) => current || reportResponse.reports[0]?.id || "");
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setScreenError(null);
        await refreshShellData();
      } catch (error) {
        if (!cancelled) {
          setScreenError(error instanceof Error ? error.message : "加载失败");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedReportId && reports[0]) {
      setSelectedReportId(reports[0].id);
    }
  }, [reports, selectedReportId]);

  async function handleChatSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const content = chatInput.trim();
    if (!content || chatPending) {
      return;
    }

    const nextMessages = [...chatMessages, { role: "user" as const, content }];
    setChatMessages(nextMessages);
    setChatInput("");
    setChatPending(true);

    try {
      const payload = await fetchJson<ChatReplyPayload>("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          elderId: selectedElderId || undefined,
          messages: nextMessages
        })
      });

      startTransition(() => {
        setChatMessages((current) => [...current, { role: "assistant", content: payload.reply }]);
      });
    } catch (error) {
      setChatMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: error instanceof Error ? error.message : "AI 助手暂时不可用。"
        }
      ]);
    } finally {
      setChatPending(false);
    }
  }

  async function startRecording() {
    setReportError(null);
    setReportSuccess(null);

    try {
      if (typeof MediaRecorder === "undefined") {
        throw new Error("当前浏览器不支持录音，请先使用文字记录或切换到 Chrome/Edge。");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const supportedMimeType = getSupportedAudioMimeType();
      const recorder = supportedMimeType
        ? new MediaRecorder(stream, { mimeType: supportedMimeType })
        : new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (currentEvent) => {
        if (currentEvent.data.size > 0) {
          chunks.push(currentEvent.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || supportedMimeType || "audio/webm";
        setRecordedBlob(new Blob(chunks, { type: mimeType }));
        stream.getTracks().forEach((track) => track.stop());
        setMediaRecorder(null);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      setReportError(error instanceof Error ? error.message : "录音启动失败");
    }
  }

  function stopRecording() {
    mediaRecorder?.stop();
    setIsRecording(false);
  }

  async function handleReportSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedElderId) {
      setReportError("请先选择长者。");
      return;
    }

    if (!noteText.trim() && !recordedBlob) {
      setReportError("请填写护理备注或录制语音。");
      return;
    }

    setReportPending(true);
    setReportError(null);
    setReportSuccess(null);

    try {
      const formData = new FormData();
      formData.set("elderId", selectedElderId);
      formData.set("createdBy", createdBy);
      formData.set("noteText", noteText);

      if (orgPin) {
        formData.set("orgPin", orgPin);
      }

      if (recordedBlob) {
        const mimeType = recordedBlob.type || "application/octet-stream";
        const extension = extensionFromMimeType(mimeType);
        formData.set(
          "audio",
          new File([recordedBlob], `care-${Date.now()}.${extension}`, {
            type: mimeType
          })
        );
      }

      const response = await fetchJson<{ report: CareReport }>("/api/reports", {
        method: "POST",
        headers: orgPin ? { "x-org-pin": orgPin } : undefined,
        body: formData
      });

      await refreshShellData();
      setSelectedReportId(response.report.id);
      setNoteText("");
      setRecordedBlob(null);
      setReportSuccess("报告已生成并同步到时间线。");
      setActiveTab("report");
    } catch (error) {
      setReportError(error instanceof Error ? error.message : "提交失败");
    } finally {
      setReportPending(false);
    }
  }

  function handleStartVisit(elderId: string) {
    setSelectedElderId(elderId);
    setActiveTab("report");
  }

  function renderHome() {
    if (!dashboard) {
      return <div className={styles.emptyState}>暂无今日排班数据。</div>;
    }

    return (
      <>
        <section className={styles.heroCard}>
          <div className={styles.heroDate}>
            <CalendarDays size={18} />
            <span>{dashboard.dateLabel}</span>
          </div>
          <h2 className={styles.heroTitle}>Today</h2>
          <p className={styles.heroText}>{dashboard.headline}</p>
          <div className={styles.legendRow}>
            <span className={styles.legendItem}>
              <span className={styles.legendSwatch} style={{ background: "#22c55e" }} />
              已完成
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendSwatch} style={{ background: "#f59e0b" }} />
              处理中
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendSwatch} style={{ background: "#94a3b8" }} />
              待处理
            </span>
          </div>
        </section>

        <section className={styles.timelineCard}>
          <h3 className={styles.sectionTitle}>
            <Sparkles size={18} />
            巡查节奏
          </h3>
          <div className={styles.timelineScale}>
            <span>09:00</span>
            <span>12:00</span>
            <span>15:00</span>
            <span>18:00</span>
          </div>
          <div className={styles.timelineTrack}>
            {dashboard.visits.map((visit, index) => {
              const left = `${12 + index * 24}%`;
              const markerClass =
                visit.status === "completed"
                  ? styles.statusCompleted
                  : visit.status === "in_progress"
                    ? styles.statusInProgress
                    : styles.statusPending;

              return (
                <span
                  key={visit.elderId}
                  className={`${styles.timelineMarker} ${markerClass}`}
                  style={{ left }}
                  title={`${visit.elderName} ${visit.slotLabel}`}
                />
              );
            })}
          </div>
        </section>

        <section className={styles.visitList}>
          {dashboard.visits.map((visit) => {
            const statusClass =
              visit.status === "completed"
                ? styles.statusCompleted
                : visit.status === "in_progress"
                  ? styles.statusInProgress
                  : styles.statusPending;

            return (
              <article key={visit.elderId} className={styles.visitCard}>
                <div className={styles.visitHeader}>
                  <div className={styles.visitIdentity}>
                    <div className={styles.avatar}>
                      <UserRound size={22} />
                    </div>
                    <div>
                      <h3 className={styles.visitName}>{visit.elderName}</h3>
                      <p className={styles.visitMeta}>
                        房间 {visit.roomNo ?? "未设定"} · {visit.slotLabel}
                      </p>
                    </div>
                  </div>
                  <span className={`${styles.statusBadge} ${statusClass}`}>
                    {visit.status === "completed"
                      ? "Completed"
                      : visit.status === "in_progress"
                        ? "In Progress"
                        : "Pending"}
                  </span>
                </div>
                <div className={styles.badges}>
                  <span className={styles.badge}>风险 {visit.riskLevel}</span>
                  <span className={styles.badgeOutline}>
                    最近报告 {formatTime(visit.latestReportAt)}
                  </span>
                </div>
                <p className={styles.visitNotes}>{visit.medicalNotes ?? "暂无额外护理备注。"}</p>
                <div className={styles.visitFooter}>
                  <span className={styles.subtleText}>点击开始可直接进入报告录入</span>
                  <button className={styles.primaryButton} onClick={() => handleStartVisit(visit.elderId)}>
                    <Play size={16} />
                    Start
                  </button>
                </div>
              </article>
            );
          })}
        </section>

        <section className={styles.statsGrid}>
          <article className={styles.statCard}>
            <p className={styles.statValue} style={{ color: "#16a34a" }}>
              {dashboard.completed}
            </p>
            <p className={styles.statLabel}>Completed</p>
          </article>
          <article className={styles.statCard}>
            <p className={styles.statValue} style={{ color: "#d97706" }}>
              {dashboard.inProgress}
            </p>
            <p className={styles.statLabel}>In Progress</p>
          </article>
          <article className={styles.statCard}>
            <p className={styles.statValue} style={{ color: "#64748b" }}>
              {dashboard.pending}
            </p>
            <p className={styles.statLabel}>Pending</p>
          </article>
        </section>
      </>
    );
  }

  function renderChat() {
    return (
      <>
        <section className={styles.chatCard}>
          <div className={styles.sectionHead}>
            <div>
              <h3 className={styles.sectionTitle}>
                <MessageSquare size={18} />
                AI Chat
              </h3>
              <p className={styles.sectionCopy}>对照当前长者上下文，快速生成交班话术、风险提示或报告字段。</p>
            </div>
          </div>

          <div className={styles.chipRow}>
            {elders.map((elder) => (
              <button
                key={elder.id}
                className={elder.id === selectedElderId ? styles.chipActive : styles.chip}
                onClick={() => setSelectedElderId(elder.id)}
              >
                {elder.fullName}
              </button>
            ))}
          </div>

          <div className={styles.messageList}>
            {chatMessages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={message.role === "user" ? styles.messageUser : styles.messageAssistant}
              >
                {message.content}
              </div>
            ))}
            {chatPending ? (
              <div className={styles.messageAssistant}>正在整理护理建议，请稍候。</div>
            ) : null}
          </div>

          <div className={styles.suggestions}>
            {chatSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                className={styles.suggestionButton}
                onClick={() => setChatInput(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>

          <form className={styles.composer} onSubmit={handleChatSubmit}>
            <textarea
              className={styles.textarea}
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="例如：帮我把今天这位长者的观察点整理成交班内容。"
            />
            <button className={styles.primaryButton} type="submit" disabled={chatPending}>
              {chatPending ? <span className={styles.spinner} /> : <Send size={16} />}
              发送给护理助手
            </button>
          </form>
        </section>
      </>
    );
  }

  function renderReport() {
    return (
      <div className={styles.reportLayout}>
        <section className={styles.reportCard}>
          <div className={styles.sectionHead}>
            <div>
              <h3 className={styles.sectionTitle}>
                <FileText size={18} />
                Report Composer
              </h3>
              <p className={styles.sectionCopy}>语音或文字输入都会走同一条后端接口，生成结构化报告并落库。</p>
            </div>
          </div>

          <div className={styles.chipRow}>
            {elders.map((elder) => (
              <button
                key={elder.id}
                className={elder.id === selectedElderId ? styles.chipActive : styles.chip}
                onClick={() => setSelectedElderId(elder.id)}
              >
                {elder.fullName}
              </button>
            ))}
          </div>

          <form className={styles.composer} onSubmit={handleReportSubmit}>
            <div className={styles.inlineGrid}>
              <input
                className={styles.input}
                value={createdBy}
                onChange={(event) => setCreatedBy(event.target.value)}
                placeholder="录入人"
              />
              <input
                className={styles.input}
                value={orgPin}
                onChange={(event) => setOrgPin(event.target.value)}
                placeholder="机构 PIN（可选）"
              />
            </div>

            <textarea
              className={styles.textarea}
              value={noteText}
              onChange={(event) => setNoteText(event.target.value)}
              placeholder="例如：今日精神稳定，午餐吃七成，步行需要轻扶，夜间建议再复查血氧。"
            />

            <div className={styles.suggestions}>
              {reportSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  className={styles.suggestionButton}
                  onClick={() => setNoteText(suggestion)}
                  type="button"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div className={styles.inlineGrid}>
              {!isRecording ? (
                <button className={styles.secondaryButton} onClick={startRecording} type="button">
                  <Mic size={16} />
                  开始录音
                </button>
              ) : (
                <button className={styles.ghostButton} onClick={stopRecording} type="button">
                  <CircleDot size={16} />
                  停止录音
                </button>
              )}

              <button
                className={styles.ghostButton}
                onClick={() => setRecordedBlob(null)}
                type="button"
                disabled={!recordedBlob}
              >
                <RefreshCcw size={16} />
                清除音频
              </button>
            </div>

            <div className={styles.muted}>
              {recordedBlob
                ? `已录制 ${(recordedBlob.size / 1024).toFixed(0)} KB 音频，可直接提交生成报告。`
                : "未录制音频时，也可以只用文字提交。"}
            </div>

            {selectedElder ? (
              <div className={styles.reportPreview}>
                <p className={styles.reportItemTitle}>{selectedElder.fullName}</p>
                <p className={styles.reportItemMeta}>
                  房间 {selectedElder.roomNo ?? "未设定"} · 风险 {selectedElder.riskLevel}
                </p>
                <p className={styles.reportItemMeta}>{selectedElder.medicalNotes ?? "暂无额外护理备注。"}</p>
              </div>
            ) : null}

            {reportError ? <div className={styles.errorText}>{reportError}</div> : null}
            {reportSuccess ? <div className={styles.successText}>{reportSuccess}</div> : null}

            <button className={styles.primaryButton} type="submit" disabled={reportPending}>
              {reportPending ? <span className={styles.spinner} /> : <Sparkles size={16} />}
              提交并生成报告
            </button>
          </form>
        </section>

        <section className={styles.surfaceCard}>
          <div className={styles.sectionHead}>
            <div>
              <h3 className={styles.sectionTitle}>
                <Sparkles size={18} />
                Recent Reports
              </h3>
              <p className={styles.sectionCopy}>选中任一报告，可在下方查看可读文本和结构化生成结果。</p>
            </div>
            <Link className={styles.ghostButton} href="/elders">
              老人列表
            </Link>
          </div>

          <div className={styles.reportList}>
            {reports.length === 0 ? (
              <div className={styles.emptyState}>还没有生成报告，先录入一条今日照护内容。</div>
            ) : (
              reports.map((report) => (
                <button
                  key={report.id}
                  className={`${styles.reportItem} ${report.id === selectedReport?.id ? styles.reportItemActive : ""}`}
                  onClick={() => setSelectedReportId(report.id)}
                  type="button"
                >
                  <p className={styles.reportItemTitle}>{report.elderName}</p>
                  <p className={styles.reportItemMeta}>
                    {formatTime(report.createdAt)} · {report.status} · 房间 {report.elderRoomNo ?? "未设定"}
                  </p>
                </button>
              ))
            )}
          </div>

          {selectedReport ? (
            <div className={styles.reportPreview}>
              <p className={styles.reportItemTitle}>{selectedReport.elderName}</p>
              <p className={styles.reportItemMeta}>
                录入人 {selectedReport.createdBy ?? "未记录"} · 风险 {selectedReport.elderRiskLevel}
              </p>
              <p className={styles.reportText}>
                {selectedReport.reportText ?? "报告仍在处理或尚未生成可读文本。"}
              </p>
            </div>
          ) : null}
        </section>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <div className={styles.brandMark}>C</div>
            <div>
              <p className={styles.brandTitle}>Concord</p>
              <p className={styles.brandCopy}>Care workflow workstation</p>
            </div>
          </div>

          <div className={styles.statusPill}>
            <span className={styles.dot} />
            {selectedElder ? `${selectedElder.fullName}` : "准备就绪"}
          </div>
        </header>

        {loading ? (
          <div className={styles.emptyState}>正在加载工作台数据。</div>
        ) : screenError ? (
          <div className={styles.emptyState}>{screenError}</div>
        ) : (
          <main className={styles.tabPanel}>
            {activeTab === "home" ? renderHome() : null}
            {activeTab === "chat" ? renderChat() : null}
            {activeTab === "report" ? renderReport() : null}
          </main>
        )}
      </div>

      <div className={styles.navWrap}>
        <nav className={styles.nav}>
          <button
            className={activeTab === "home" ? styles.navButtonActive : styles.navButton}
            onClick={() => setActiveTab("home")}
          >
            <Home size={18} />
            <span>Home</span>
          </button>
          <button
            className={activeTab === "chat" ? styles.navButtonActive : styles.navButton}
            onClick={() => setActiveTab("chat")}
          >
            <MessageSquare size={18} />
            <span>AI Chat</span>
          </button>
          <button
            className={activeTab === "report" ? styles.navButtonActive : styles.navButton}
            onClick={() => setActiveTab("report")}
          >
            <FileText size={18} />
            <span>Report</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
