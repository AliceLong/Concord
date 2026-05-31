"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Keyboard, Mic, Square } from "lucide-react";
import { useSpeechmaticsRecorder } from "@/hooks/use-speechmatics-recorder";
import { getCareModulesByIds, serializeCareModuleIds, type CareModuleId } from "@/lib/care-modules";
import {
  buildReportSessionStorageKey,
  readPersistedReportSession,
  writePersistedReportSession
} from "@/lib/report-session-storage";
import type { ElderlyProfile } from "@/types/elderly";
import styles from "@/components/report-session.module.css";

interface ReportSessionProps {
  elder: ElderlyProfile;
  taskId?: string;
  selectedModules: CareModuleId[];
}

export function ReportSession({ elder, taskId, selectedModules }: ReportSessionProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const storageReadyRef = useRef(false);
  const [draft, setDraft] = useState("");
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const storageKey = buildReportSessionStorageKey(elder.id, selectedModules);
  const selectedModuleDefs = getCareModulesByIds(selectedModules);
  const recorder = useSpeechmaticsRecorder({
    onTranscript: (transcript) => {
      setDraft(transcript);
    },
    onError: setError
  });

  useEffect(() => {
    const persisted = readPersistedReportSession(storageKey);

    if (persisted) {
      setDraft(persisted.draft);
      setSessionDate(persisted.sessionDate || new Date().toISOString().slice(0, 10));
    }

    storageReadyRef.current = true;
  }, [selectedModules, storageKey]);

  useEffect(() => {
    if (!storageReadyRef.current) {
      return;
    }

    const existing = readPersistedReportSession(storageKey);

    writePersistedReportSession(storageKey, {
      draft,
      sessionDate,
      selectedModules,
      moduleDrafts: undefined,
      moduleResults: existing?.moduleResults,
      exerciseResult: existing?.exerciseResult,
      patientSnapshot: existing?.patientSnapshot,
      generatedReport: existing?.generatedReport ?? null,
      updatedAt: new Date().toISOString()
    });
  }, [draft, selectedModules, sessionDate, storageKey]);

  function handleStartRecording() {
    setError(null);
    void recorder.startRecording();
  }

  function handleToggleRecording() {
    if (recorder.isRecording) {
      recorder.stopRecording();
      return;
    }

    if (recorder.isStarting || recorder.isPending) {
      return;
    }

    handleStartRecording();
  }

  function handleNext() {
    if (!draft.trim()) {
      setError("请先录音或补充转录文字。");
      return;
    }

    setError(null);
    writePersistedReportSession(storageKey, {
      draft,
      sessionDate,
      selectedModules,
      moduleDrafts: undefined,
      generatedReport: null,
      updatedAt: new Date().toISOString()
    });

    router.push(
      `/report/${elder.id}/analysis?modules=${serializeCareModuleIds(selectedModules)}${taskId ? `&taskId=${encodeURIComponent(taskId)}` : ""}`
    );
  }

  const statusLabel = recorder.isRecording
    ? "停止录音"
    : recorder.isStarting
      ? "启动中..."
      : recorder.isPending
      ? "整理中..."
      : "开始录音";

  return (
    <section className={styles.wrapper}>
      <div className={styles.moduleList} aria-label="已选择模块">
        {selectedModuleDefs.map((careModule) => (
          <article key={careModule.id} className={styles.moduleCard}>
            <h2 className={styles.moduleTitle}>【{careModule.number}】{careModule.title}</h2>
            <p className={styles.moduleText}>{careModule.prompt}</p>
          </article>
        ))}
      </div>

      <div className={styles.textbox}>
        <p className={styles.textboxTitle}>开始汇总</p>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
          }}
          placeholder="点击开始录音后，识别文字会显示在这里，也可以手动输入。"
        />
        {error ? <div className={styles.error}>{error}</div> : null}
        {recorder.latencyLabel ? <div className={styles.latency}>{recorder.latencyLabel}</div> : null}
      </div>

      <div className={styles.bottomBar}>
        <button
          className={styles.keyboardButton}
          type="button"
          onClick={() => textareaRef.current?.focus()}
          aria-label="手动输入"
        >
          <Keyboard size={28} />
        </button>

        <button
          className={styles.recordButton}
          type="button"
          onClick={handleToggleRecording}
          disabled={!recorder.isSupported || recorder.isStarting || (recorder.isPending && !recorder.isRecording)}
          aria-label={statusLabel}
        >
          {recorder.isRecording ? <Square size={22} /> : <Mic size={24} />}
          {statusLabel}
        </button>

        <button
          className={styles.nextButton}
          onClick={handleNext}
          disabled={recorder.isRecording || recorder.isPending || !draft.trim()}
          aria-label="下一步分析"
        >
          <ArrowRight size={32} />
        </button>
      </div>
    </section>
  );
}
