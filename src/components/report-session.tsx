"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, Check, Mic, RefreshCcw, Square, Sparkles } from "lucide-react";
import type { ElderlyProfile } from "@/types/elderly";
import type { AsrStreamEvent, AsrStreamSession, GeneratedReport } from "@/types/report";
import styles from "@/components/report-session.module.css";

interface ReportSessionProps {
  elder: ElderlyProfile;
}

const preferredMimeTypes = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/ogg"
] as const;

const recordingChunkIntervalMs = 250;

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

export function ReportSession({ elder }: ReportSessionProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderMimeTypeRef = useRef("audio/webm");
  const streamSessionIdRef = useRef<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const uploadInFlightRef = useRef(false);
  const uploadQueueRef = useRef<Blob[]>([]);
  const stopAfterUploadsRef = useRef(false);
  const autoSyncDraftRef = useRef(true);
  const sampleRateHertzRef = useRef<number | null>(null);
  const audioChannelCountRef = useRef<number | null>(1);

  const [isSupported, setIsSupported] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [draft, setDraft] = useState("");
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [asrPending, setAsrPending] = useState(false);
  const [reportPending, setReportPending] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof MediaRecorder === "undefined") {
      setIsSupported(false);
    }

    return () => {
      mediaRecorderRef.current?.stop();
      mediaRecorderRef.current = null;
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, []);

  async function createStreamingSession() {
    const response = await fetch("/api/asr/stream/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mimeType: recorderMimeTypeRef.current,
        sampleRateHertz: sampleRateHertzRef.current,
        audioChannelCount: audioChannelCountRef.current
      })
    });
    const body = (await response.json()) as AsrStreamSession & { error?: string };

    if (!response.ok || !body.sessionId) {
      throw new Error(body.error ?? "语音流初始化失败");
    }

    return body;
  }

  function openStreamingEvents(sessionId: string) {
    eventSourceRef.current?.close();
    const source = new EventSource(`/api/asr/stream/events?sessionId=${encodeURIComponent(sessionId)}`);

    source.onmessage = (event) => {
      const payload = JSON.parse(event.data) as AsrStreamEvent;

      if (payload.type === "transcript") {
        if (autoSyncDraftRef.current) {
          setDraft(payload.transcript);
        }
        return;
      }

      if (payload.type === "done") {
        if (autoSyncDraftRef.current) {
          setDraft(payload.transcript);
        }
        setAsrPending(false);
        setHasRecording(Boolean(payload.transcript.trim()));
        source.close();
        eventSourceRef.current = null;
        return;
      }

      setError(payload.message ?? "语音转写失败");
      setAsrPending(false);
      source.close();
      eventSourceRef.current = null;
    };

    source.onerror = () => {
      source.close();
      eventSourceRef.current = null;
    };

    eventSourceRef.current = source;
  }

  async function uploadStreamingChunk(blob: Blob) {
    const mimeType = blob.type || "application/octet-stream";
    const extension = extensionFromMimeType(mimeType);
    const formData = new FormData();
    const sessionId = streamSessionIdRef.current;

    if (!sessionId) {
      throw new Error("语音流会话不存在。");
    }

    formData.set("sessionId", sessionId);
    formData.set(
      "audio",
      new File([blob], `session-${Date.now()}.${extension}`, {
        type: mimeType
      })
    );
    const response = await fetch("/api/asr/stream/chunk", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      throw new Error(body.error ?? "语音转写失败");
    }
  }

  function processUploadQueue() {
    if (uploadInFlightRef.current) {
      return;
    }

    const nextChunk = uploadQueueRef.current.shift();

    if (!nextChunk) {
      if (stopAfterUploadsRef.current) {
        void stopStreamingSession();
      }
      return;
    }

    uploadInFlightRef.current = true;

    void uploadStreamingChunk(nextChunk)
      .catch((currentError) => {
        setError(currentError instanceof Error ? currentError.message : "语音转写失败");
      })
      .finally(() => {
        uploadInFlightRef.current = false;

        if (uploadQueueRef.current.length > 0) {
          processUploadQueue();
          return;
        }

        if (stopAfterUploadsRef.current) {
          void stopStreamingSession();
        }
      });
  }

  function queueChunkUpload(chunk: Blob) {
    uploadQueueRef.current.push(chunk);
    processUploadQueue();
  }

  async function stopStreamingSession() {
    const sessionId = streamSessionIdRef.current;

    if (!sessionId) {
      setAsrPending(false);
      return;
    }

    stopAfterUploadsRef.current = false;

    const response = await fetch("/api/asr/stream/stop", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ sessionId })
    });

    streamSessionIdRef.current = null;

    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      throw new Error(body.error ?? "关闭语音流失败");
    }
  }

  async function handleStartRecording() {
    setError(null);
    setGeneratedReport(null);

    if (typeof MediaRecorder === "undefined") {
      setIsSupported(false);
      setError("当前浏览器不支持录音，请改用 Chrome 或 Edge。");
      return;
    }

    let stream: MediaStream | null = null;

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const primaryTrack = stream.getAudioTracks()[0];
      const trackSettings = primaryTrack?.getSettings();
      const supportedMimeType = getSupportedAudioMimeType();
      const mimeType = supportedMimeType ?? "audio/webm";
      const recorder = supportedMimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorderMimeTypeRef.current = recorder.mimeType || mimeType;
      uploadInFlightRef.current = false;
      uploadQueueRef.current = [];
      stopAfterUploadsRef.current = false;
      autoSyncDraftRef.current = true;
      sampleRateHertzRef.current = trackSettings?.sampleRate ?? 48000;
      audioChannelCountRef.current = trackSettings?.channelCount ?? 1;
      setAsrPending(true);

      const streamingSession = await createStreamingSession();
      streamSessionIdRef.current = streamingSession.sessionId;
      openStreamingEvents(streamingSession.sessionId);

      recorder.ondataavailable = (event) => {
        if (event.data.size === 0) {
          return;
        }

        queueChunkUpload(event.data);
      };

      recorder.onstop = () => {
        setIsRecording(false);
        mediaRecorderRef.current = null;
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;

        if (uploadInFlightRef.current || uploadQueueRef.current.length > 0) {
          stopAfterUploadsRef.current = true;
          return;
        }

        void stopStreamingSession().catch((currentError) => {
          setError(currentError instanceof Error ? currentError.message : "关闭语音流失败");
          setAsrPending(false);
        });
      };

      recorder.start(recordingChunkIntervalMs);
      mediaRecorderRef.current = recorder;
      mediaStreamRef.current = stream;
      setIsRecording(true);
      setHasRecording(false);
      setDraft("");
    } catch (currentError) {
      stream?.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      setAsrPending(false);
      setError(currentError instanceof Error ? currentError.message : "录音启动失败");
    }
  }

  function handleStopRecording() {
    mediaRecorderRef.current?.stop();
  }

  async function handleGenerateReport() {
    if (!draft.trim()) {
      setError("请先录音或补充转录文字。");
      return;
    }

    setReportPending(true);
    setError(null);

    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          elderId: elder.id,
          transcript: draft,
          sessionDate
        })
      });
      const body = (await response.json()) as { report?: GeneratedReport; error?: string };

      if (!response.ok || !body.report) {
        throw new Error(body.error ?? "生成报告失败");
      }

      setGeneratedReport(body.report);
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "生成报告失败");
    } finally {
      setReportPending(false);
    }
  }

  function handleReset() {
    mediaRecorderRef.current?.stop();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaRecorderRef.current = null;
    mediaStreamRef.current = null;
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    uploadInFlightRef.current = false;
    uploadQueueRef.current = [];
    stopAfterUploadsRef.current = false;
    autoSyncDraftRef.current = true;
    sampleRateHertzRef.current = null;
    audioChannelCountRef.current = 1;

    if (streamSessionIdRef.current) {
      void fetch("/api/asr/stream/stop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ sessionId: streamSessionIdRef.current })
      });
      streamSessionIdRef.current = null;
    }

    setIsRecording(false);
    setHasRecording(false);
    setAsrPending(false);
    setDraft("");
    setGeneratedReport(null);
    setError(null);
  }

  const statusLabel = isRecording ? "录音中" : asrPending ? "转写中" : hasRecording ? "准备生成" : "准备录音";

  return (
    <section className={styles.wrapper}>
      <div className={styles.composer}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionTitle}>护理记录</p>
            <p className={styles.sectionMeta}>{elder.tips}</p>
          </div>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.controls}>
            {!isRecording ? (
              <button className={styles.recordButton} onClick={handleStartRecording} disabled={!isSupported || reportPending}>
                <Mic size={16} />
                开始录音
              </button>
            ) : (
              <button className={styles.stopButton} onClick={handleStopRecording}>
                <Square size={16} />
                停止录音
              </button>
            )}

            <span className={isRecording ? styles.statusLive : styles.statusIdle}>{statusLabel}</span>
          </div>

          <div className={styles.actions}>
            <label className={styles.dateField}>
              <Calendar size={14} />
              <input
                className={styles.dateInput}
                type="date"
                value={sessionDate}
                onChange={(event) => setSessionDate(event.target.value)}
              />
            </label>

            <button className={styles.secondaryButton} onClick={handleReset} type="button">
              <RefreshCcw size={16} />
              <span>重置</span>
            </button>
          </div>
        </div>

        <textarea
          className={styles.textarea}
          value={draft}
          onChange={(event) => {
            autoSyncDraftRef.current = false;
            setDraft(event.target.value);
          }}
          placeholder="录音后，这里会实时出现转录文字。"
        />

        {error ? <div className={styles.error}>{error}</div> : null}

        <button
          className={styles.doneButton}
          onClick={handleGenerateReport}
          disabled={reportPending || isRecording || asrPending || !draft.trim()}
        >
          {reportPending ? <RefreshCcw size={16} className={styles.spin} /> : <Sparkles size={16} />}
          生成报告
        </button>
      </div>

      {generatedReport ? (
        <section className={styles.reportSection}>
          <div className={styles.reportPreview}>
            <div className={styles.reportHeader}>
              <p className={styles.reportTitle}>结构化结果</p>
              <span className={styles.statusDone}>
                <Check size={14} />
                已生成
              </span>
            </div>
            <pre className={styles.pre}>{JSON.stringify(generatedReport.reportStructured, null, 2)}</pre>
          </div>

          <div className={styles.reportPreview}>
            <p className={styles.reportTitle}>Report 文本</p>
            <pre className={styles.pre}>{generatedReport.reportText}</pre>
          </div>
        </section>
      ) : null}
    </section>
  );
}
