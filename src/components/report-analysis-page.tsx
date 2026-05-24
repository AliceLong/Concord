"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, CheckCircle2, Mic, RefreshCcw, Square } from "lucide-react";
import { useSpeechmaticsRecorder } from "@/hooks/use-speechmatics-recorder";
import { buildCombinedTranscriptFromResults } from "@/lib/report-analysis";
import { getCareModuleById, serializeCareModuleIds, type CareModuleId } from "@/lib/care-modules";
import {
  buildReportSessionStorageKey,
  readPersistedReportSession,
  writePersistedReportSession,
  type ModuleRecognitionResult
} from "@/lib/report-session-storage";
import type { ElderlyProfile } from "@/types/elderly";
import type { GeneratedReport } from "@/types/report";
import styles from "@/components/report-analysis-page.module.css";

interface ReportAnalysisPageProps {
  elder: ElderlyProfile;
  taskId?: string;
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

function sortResults(results: ModuleRecognitionResult[]): ModuleRecognitionResult[] {
  return [...results].sort((a, b) => Number(a.recognized) - Number(b.recognized));
}

function getResultText(result: ModuleRecognitionResult): string {
  return result.manualText ?? result.extractedText ?? result.transcript ?? "";
}

export function ReportAnalysisPage({ elder, taskId, selectedModules }: ReportAnalysisPageProps) {
  const router = useRouter();
  const storageKey = buildReportSessionStorageKey(elder.id, selectedModules);
  const [results, setResults] = useState<ModuleRecognitionResult[]>([]);
  const [activeModuleId, setActiveModuleId] = useState<CareModuleId | null>(null);
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [analysisPending, setAnalysisPending] = useState(true);
  const [finalizePending, setFinalizePending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeModuleRef = useRef<CareModuleId | null>(null);
  const recordingBaseTextRef = useRef("");

  const recorder = useSpeechmaticsRecorder({
    resetOnStart: true,
    onError: setError,
    onTranscript: (transcript) => {
      const moduleId = activeModuleRef.current;

      if (!moduleId) {
        return;
      }

      const base = recordingBaseTextRef.current.trim();
      const nextText = [base, transcript.trim()].filter(Boolean).join("\n");
      updateResult(moduleId, nextText, false);
    }
  });

  useEffect(() => {
    activeModuleRef.current = activeModuleId;
  }, [activeModuleId]);

  useEffect(() => {
    let ignore = false;

    async function analyze() {
      const persisted = readPersistedReportSession(storageKey);
      setSessionDate(persisted?.sessionDate || new Date().toISOString().slice(0, 10));

      if (persisted?.moduleResults?.length) {
        const sorted = sortResults(persisted.moduleResults);
        setResults(sorted);
        setActiveModuleId(sorted.find((item) => !item.recognized)?.moduleId ?? sorted[0]?.moduleId ?? null);
        setAnalysisPending(false);
        return;
      }

      if (!persisted?.draft?.trim()) {
        setError("没有找到可分析的语音文本，请返回语音录入页。");
        setAnalysisPending(false);
        return;
      }

      setAnalysisPending(true);
      setError(null);

      try {
        const response = await fetch("/api/report/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            elderId: elder.id,
            transcript: persisted.draft,
            sessionDate: persisted.sessionDate,
            selectedModules
          })
        });
        const body = await readJsonResponse<{ moduleResults?: ModuleRecognitionResult[]; error?: string }>(response);

        if (!response.ok || !body.moduleResults) {
          throw new Error(body.error ?? "模块分析失败");
        }

        if (ignore) {
          return;
        }

        const sorted = sortResults(body.moduleResults);
        setResults(sorted);
        setActiveModuleId(sorted.find((item) => !item.recognized)?.moduleId ?? sorted[0]?.moduleId ?? null);
        writePersistedReportSession(storageKey, {
          ...persisted,
          moduleResults: sorted,
          generatedReport: null,
          updatedAt: new Date().toISOString()
        });
      } catch (currentError) {
        if (!ignore) {
          setError(currentError instanceof Error ? currentError.message : "模块分析失败");
        }
      } finally {
        if (!ignore) {
          setAnalysisPending(false);
        }
      }
    }

    void analyze();

    return () => {
      ignore = true;
    };
  }, [elder.id, selectedModules, storageKey]);

  const missingCount = useMemo(() => results.filter((result) => !result.recognized).length, [results]);
  const activeResult = activeModuleId ? results.find((result) => result.moduleId === activeModuleId) ?? null : null;

  function persistResults(nextResults: ModuleRecognitionResult[]) {
    const persisted = readPersistedReportSession(storageKey);
    const transcript = buildCombinedTranscriptFromResults(nextResults);

    writePersistedReportSession(storageKey, {
      draft: transcript,
      sessionDate,
      selectedModules,
      moduleDrafts: persisted?.moduleDrafts,
      moduleResults: nextResults,
      exerciseResult: persisted?.exerciseResult,
      patientSnapshot: persisted?.patientSnapshot,
      generatedReport: null,
      updatedAt: new Date().toISOString()
    });
  }

  function updateResult(moduleId: CareModuleId, value: string, shouldPersist = true) {
    setResults((current) => {
      const nextResults = current.map((result) =>
        result.moduleId === moduleId
          ? {
              ...result,
              manualText: value,
              extractedText: value,
              suggestedReportText: value,
              recognized: Boolean(value.trim()),
              missingReason: value.trim() ? undefined : result.missingReason
            }
          : result
      );

      if (shouldPersist) {
        persistResults(nextResults);
      }

      return nextResults;
    });
  }

  function handleSelect(moduleId: CareModuleId) {
    setActiveModuleId(moduleId);
    setError(null);
  }

  function handleStartModuleRecording() {
    if (!activeResult || !activeModuleId) {
      setError("请先点击选择一个模块。");
      return;
    }

    setError(null);
    recordingBaseTextRef.current = getResultText(activeResult);
    void recorder.startRecording();
  }

  async function finalizeAndGoToResult(nextResults: ModuleRecognitionResult[]) {
    setFinalizePending(true);
    setError(null);

    try {
      const persisted = readPersistedReportSession(storageKey);
      const response = await fetch("/api/report/finalize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          elderId: elder.id,
          sessionDate,
          selectedModules,
          moduleResults: nextResults,
          exerciseResult: persisted?.exerciseResult
        })
      });
      const body = await readJsonResponse<{ report?: GeneratedReport; error?: string }>(response);

      if (!response.ok || !body.report) {
        throw new Error(body.error ?? "生成报告失败");
      }

      writePersistedReportSession(storageKey, {
        draft: buildCombinedTranscriptFromResults(nextResults),
        sessionDate,
        selectedModules,
        moduleDrafts: persisted?.moduleDrafts,
        moduleResults: nextResults,
        exerciseResult: persisted?.exerciseResult,
        patientSnapshot: persisted?.patientSnapshot,
        generatedReport: body.report,
        updatedAt: new Date().toISOString()
      });

      router.push(
        `/report/${elder.id}/result?modules=${serializeCareModuleIds(selectedModules)}${taskId ? `&taskId=${encodeURIComponent(taskId)}` : ""}`
      );
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "生成报告失败");
    } finally {
      setFinalizePending(false);
    }
  }

  function handleNext() {
    const nextResults = sortResults(results);
    persistResults(nextResults);

    if (selectedModules.includes("fall_prevention_exercise")) {
      router.push(
        `/report/${elder.id}/exercise?modules=${serializeCareModuleIds(selectedModules)}${taskId ? `&taskId=${encodeURIComponent(taskId)}` : ""}`
      );
      return;
    }

    void finalizeAndGoToResult(nextResults);
  }

  const recordLabel = !activeModuleId
    ? "请选择模块"
    : recorder.isRecording
      ? "录音中"
      : activeResult?.recognized
        ? "按住追加"
        : "按住补充";

  return (
    <section className={styles.wrapper}>
      <div className={styles.summary}>
        <div>
          <p className={styles.kicker}>模块分析</p>
          <h2>识别结果</h2>
        </div>
        <span className={missingCount ? styles.missingBadge : styles.doneBadge}>
          {analysisPending ? "正在分析" : missingCount ? `${missingCount} 个模块需补充` : "全部已识别"}
        </span>
      </div>

      {analysisPending ? <div className={styles.loading}>正在分析模块内容...</div> : null}

      <div className={styles.list}>
        {sortResults(results).map((result) => {
          const careModule = getCareModuleById(result.moduleId);
          const value = getResultText(result);
          const active = result.moduleId === activeModuleId;

          return (
            <button
              key={result.moduleId}
              type="button"
              className={[
                result.recognized ? styles.cardDone : styles.cardMissing,
                active ? styles.cardActive : ""
              ].join(" ")}
              onClick={() => handleSelect(result.moduleId)}
            >
              <div className={styles.cardHeader}>
                <div>
                  <h3>【{careModule.number}】{careModule.title}</h3>
                  <p>{careModule.prompt}</p>
                  {!result.recognized && result.missingReason ? <span>{result.missingReason}</span> : null}
                </div>
                {result.recognized ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
              </div>
              {active ? (
                <textarea
                  value={value}
                  onClick={(event) => event.stopPropagation()}
                  onChange={(event) => updateResult(result.moduleId, event.target.value)}
                  placeholder="未识别到相关内容，请在这里手动补充。"
                />
              ) : value ? (
                <p className={styles.previewText}>{value}</p>
              ) : null}
            </button>
          );
        })}
      </div>

      {error ? <div className={styles.error}>{error}</div> : null}
      {recorder.latencyLabel ? <div className={styles.latency}>{recorder.latencyLabel}</div> : null}

      <div className={styles.bottomBar}>
        {!recorder.isRecording ? (
          <button
            className={activeModuleId ? styles.recordButtonActive : styles.recordButtonDisabled}
            type="button"
            onMouseDown={handleStartModuleRecording}
            onMouseUp={recorder.stopRecording}
            onMouseLeave={() => {
              if (recorder.isRecording) {
                recorder.stopRecording();
              }
            }}
            onTouchStart={handleStartModuleRecording}
            onTouchEnd={recorder.stopRecording}
            disabled={!activeModuleId || !recorder.isSupported || analysisPending}
          >
            <Mic size={16} />
            {recordLabel}
          </button>
        ) : (
          <button className={styles.recordButtonActive} type="button" onClick={recorder.stopRecording}>
            <Square size={16} />
            停止录音
          </button>
        )}

        <button
          className={styles.nextButton}
          type="button"
          onClick={handleNext}
          disabled={analysisPending || finalizePending || recorder.isRecording || recorder.isPending || results.length === 0}
        >
          {finalizePending ? <RefreshCcw size={16} className={styles.spin} /> : <ArrowRight size={16} />}
          {selectedModules.includes("fall_prevention_exercise") ? "下一步：运动次数" : "确认并生成报告"}
        </button>
      </div>
    </section>
  );
}
