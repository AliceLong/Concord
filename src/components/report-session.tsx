"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RealtimeClient, type RealtimeServerMessage } from "@speechmatics/real-time-client";
import { Calendar, Mic, RefreshCcw, Square, Sparkles } from "lucide-react";
import { concatInt16Arrays, downsampleToInt16Pcm, int16ArrayToUint8Array, PCM_FRAME_SAMPLES } from "@/lib/audio/pcm";
import { serializeCareModuleIds, type CareModuleId } from "@/lib/care-modules";
import {
  buildReportSessionStorageKey,
  clearPersistedReportSession,
  readPersistedReportSession,
  writePersistedReportSession
} from "@/lib/report-session-storage";
import type { ElderlyProfile } from "@/types/elderly";
import type { GeneratedReport } from "@/types/report";
import styles from "@/components/report-session.module.css";

interface ReportSessionProps {
  elder: ElderlyProfile;
  selectedModules: CareModuleId[];
  selectedModuleTip: string;
}

interface SpeechmaticsTokenResponse {
  token: string;
  url: string;
  language: string;
  maxDelay: number;
  ttlSeconds: number;
  operatingPoint: "standard" | "enhanced" | null;
}

function buildTranscript(finalSegments: string[], partialTranscript: string) {
  return [...finalSegments, partialTranscript].filter(Boolean).join("").trim();
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

export function ReportSession({ elder, selectedModules, selectedModuleTip }: ReportSessionProps) {
  const router = useRouter();
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const sinkNodeRef = useRef<GainNode | null>(null);
  const speechmaticsClientRef = useRef<RealtimeClient | null>(null);
  const pcmBufferRef = useRef<Int16Array<ArrayBufferLike>>(new Int16Array(0));
  const autoSyncDraftRef = useRef(true);
  const recordingStartedAtRef = useRef<number | null>(null);
  const firstTranscriptAtRef = useRef<number | null>(null);
  const finalSegmentsRef = useRef<string[]>([]);
  const partialTranscriptRef = useRef("");
  const storageReadyRef = useRef(false);

  const [isSupported, setIsSupported] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [draft, setDraft] = useState("");
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [asrPending, setAsrPending] = useState(false);
  const [reportPending, setReportPending] = useState(false);
  const [latencyLabel, setLatencyLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const storageKey = buildReportSessionStorageKey(elder.id, selectedModules);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof navigator === "undefined" ||
      typeof AudioContext === "undefined" ||
      typeof WebSocket === "undefined"
    ) {
      setIsSupported(false);
    }

    return () => {
      teardownAudioPipeline();
      closeSpeechmaticsClient();
    };
  }, []);

  useEffect(() => {
    const persisted = readPersistedReportSession(storageKey);

    if (persisted) {
      autoSyncDraftRef.current = false;
      setDraft(persisted.draft);
      setSessionDate(persisted.sessionDate || new Date().toISOString().slice(0, 10));
      setHasRecording(Boolean(persisted.draft.trim()));
    }

    storageReadyRef.current = true;
  }, [storageKey]);

  useEffect(() => {
    if (!storageReadyRef.current) {
      return;
    }

    const existing = readPersistedReportSession(storageKey);
    const generatedReport =
      existing?.generatedReport &&
      existing.generatedReport.transcript === draft &&
      existing.generatedReport.sessionDate === (sessionDate || null)
        ? existing.generatedReport
        : null;

    writePersistedReportSession(storageKey, {
      draft,
      sessionDate,
      selectedModules,
      generatedReport,
      updatedAt: new Date().toISOString()
    });
  }, [draft, elder.id, selectedModules, sessionDate, storageKey]);

  useEffect(() => {
    if (!isRecording && !asrPending) {
      setHasRecording(Boolean(draft.trim()));
    }
  }, [asrPending, draft, isRecording]);

  function teardownAudioPipeline() {
    workletNodeRef.current?.port.close();
    workletNodeRef.current?.disconnect();
    sinkNodeRef.current?.disconnect();
    sourceNodeRef.current?.disconnect();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());

    workletNodeRef.current = null;
    sinkNodeRef.current = null;
    sourceNodeRef.current = null;
    mediaStreamRef.current = null;

    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }

  function closeSpeechmaticsClient() {
    if (!speechmaticsClientRef.current) {
      return;
    }

    speechmaticsClientRef.current = null;
  }

  function syncDraft(transcript: string) {
    if (!autoSyncDraftRef.current) {
      return;
    }

    setDraft(transcript);
  }

  function updateLatencyLabel(finalized = false) {
    const startedAt = recordingStartedAtRef.current;

    if (!startedAt) {
      return;
    }

    const now = Date.now();

    if (firstTranscriptAtRef.current == null) {
      firstTranscriptAtRef.current = now;
    }

    const firstLatencyMs = firstTranscriptAtRef.current - startedAt;
    const parts = [`首条转写 ${firstLatencyMs}ms`];

    if (finalized) {
      parts.push(`最终定稿 ${now - startedAt}ms`);
    }

    setLatencyLabel(parts.join(" · "));
  }

  function handleSpeechmaticsMessage(message: RealtimeServerMessage) {
    if (message.message === "AddPartialTranscript") {
      partialTranscriptRef.current = message.metadata.transcript.trim();
      const transcript = buildTranscript(finalSegmentsRef.current, partialTranscriptRef.current);
      syncDraft(transcript);
      setHasRecording(Boolean(transcript.trim()));
      updateLatencyLabel(false);
      return;
    }

    if (message.message === "AddTranscript") {
      const segmentTranscript = message.metadata.transcript.trim();

      if (segmentTranscript) {
        finalSegmentsRef.current = [...finalSegmentsRef.current, segmentTranscript];
      }

      partialTranscriptRef.current = "";
      const transcript = buildTranscript(finalSegmentsRef.current, partialTranscriptRef.current);
      syncDraft(transcript);
      setHasRecording(Boolean(transcript.trim()));
      updateLatencyLabel(true);
      return;
    }

    if (message.message === "EndOfTranscript") {
      const transcript = buildTranscript(finalSegmentsRef.current, partialTranscriptRef.current);
      syncDraft(transcript);
      setHasRecording(Boolean(transcript.trim()));
      setAsrPending(false);
      closeSpeechmaticsClient();
      return;
    }

    if (message.message === "Warning") {
      return;
    }

    if (message.message === "Error") {
      setError(message.reason || "语音转写失败");
      setAsrPending(false);
      closeSpeechmaticsClient();
    }
  }

  async function openSpeechmaticsClient(): Promise<RealtimeClient> {
    const response = await fetch("/api/speechmatics/token");
    const payload = await readJsonResponse<SpeechmaticsTokenResponse & { error?: string }>(response);

    if (!response.ok || !payload.token) {
      throw new Error(payload.error ?? "获取 Speechmatics token 失败。");
    }

    const client = new RealtimeClient({
      url: payload.url,
      appId: "concord-demo"
    });

    client.addEventListener("receiveMessage", (event) => {
      handleSpeechmaticsMessage(event.data);
    });

    await client.start(payload.token, {
      audio_format: {
        type: "raw",
        encoding: "pcm_s16le",
        sample_rate: 16000
      },
      transcription_config: {
        language: payload.language,
        enable_partials: true,
        max_delay: payload.maxDelay,
        operating_point: payload.operatingPoint ?? undefined
      }
    });

    speechmaticsClientRef.current = client;
    return client;
  }

  function flushPcmFrames(sendPartial: boolean) {
    const client = speechmaticsClientRef.current;

    if (!client) {
      return;
    }

    while (pcmBufferRef.current.length >= PCM_FRAME_SAMPLES) {
      const frame = pcmBufferRef.current.slice(0, PCM_FRAME_SAMPLES);
      pcmBufferRef.current = pcmBufferRef.current.slice(PCM_FRAME_SAMPLES);
      client.sendAudio(int16ArrayToUint8Array(frame));
    }

    if (sendPartial && pcmBufferRef.current.length > 0) {
      client.sendAudio(int16ArrayToUint8Array(pcmBufferRef.current));
      pcmBufferRef.current = new Int16Array(0);
    }
  }

  function handleAudioChunk(input: Float32Array, inputSampleRate: number) {
    const pcmChunk = downsampleToInt16Pcm(input, inputSampleRate);
    pcmBufferRef.current = concatInt16Arrays(pcmBufferRef.current, pcmChunk);
    flushPcmFrames(false);
  }

  async function handleStartRecording() {
    setError(null);

    if (
      !isSupported ||
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof AudioWorkletNode === "undefined"
    ) {
      setIsSupported(false);
      setError("当前浏览器不支持低延迟录音，请改用最新版 Chrome。");
      return;
    }

    let stream: MediaStream | null = null;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      await openSpeechmaticsClient();

      const audioContext = new AudioContext();
      await audioContext.audioWorklet.addModule("/audio-worklet-recorder.js");
      await audioContext.resume();

      const sourceNode = audioContext.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioContext, "recorder-processor", {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        channelCount: 1,
        channelCountMode: "explicit"
      });
      const sinkNode = audioContext.createGain();
      sinkNode.gain.value = 0;

      pcmBufferRef.current = new Int16Array(0);
      autoSyncDraftRef.current = true;
      finalSegmentsRef.current = [];
      partialTranscriptRef.current = "";
      recordingStartedAtRef.current = Date.now();
      firstTranscriptAtRef.current = null;
      setLatencyLabel(null);

      workletNode.port.onmessage = (event: MessageEvent<Float32Array>) => {
        if (!speechmaticsClientRef.current) {
          return;
        }

        const chunk = event.data instanceof Float32Array ? event.data : new Float32Array(event.data);
        handleAudioChunk(chunk, audioContext.sampleRate);
      };

      sourceNode.connect(workletNode);
      workletNode.connect(sinkNode);
      sinkNode.connect(audioContext.destination);

      mediaStreamRef.current = stream;
      audioContextRef.current = audioContext;
      sourceNodeRef.current = sourceNode;
      workletNodeRef.current = workletNode;
      sinkNodeRef.current = sinkNode;

      setDraft("");
      setHasRecording(false);
      setAsrPending(true);
      setIsRecording(true);
    } catch (currentError) {
      stream?.getTracks().forEach((track) => track.stop());
      teardownAudioPipeline();
      closeSpeechmaticsClient();
      setAsrPending(false);
      setIsRecording(false);
      setError(currentError instanceof Error ? currentError.message : "录音启动失败");
    }
  }

  function handleStopRecording() {
    if (!speechmaticsClientRef.current) {
      teardownAudioPipeline();
      setIsRecording(false);
      setAsrPending(false);
      return;
    }

    flushPcmFrames(true);
    void speechmaticsClientRef.current.stopRecognition().catch((currentError: unknown) => {
      setError(currentError instanceof Error ? currentError.message : "结束实时转写失败");
      setAsrPending(false);
      closeSpeechmaticsClient();
    });
    teardownAudioPipeline();
    setIsRecording(false);
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
          sessionDate,
          selectedModules
        })
      });
      const body = await readJsonResponse<{ report?: GeneratedReport; error?: string }>(response);

      if (!response.ok || !body.report) {
        throw new Error(body.error ?? "生成报告失败");
      }

      writePersistedReportSession(storageKey, {
        draft,
        sessionDate,
        selectedModules,
        generatedReport: body.report,
        updatedAt: new Date().toISOString()
      });
      router.push(`/report/${elder.id}/result?modules=${serializeCareModuleIds(selectedModules)}`);
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "生成报告失败");
    } finally {
      setReportPending(false);
    }
  }

  function handleReset() {
    teardownAudioPipeline();

    if (speechmaticsClientRef.current) {
      void speechmaticsClientRef.current.stopRecognition({ noTimeout: true }).catch(() => {});
    }

    closeSpeechmaticsClient();
    pcmBufferRef.current = new Int16Array(0);
    autoSyncDraftRef.current = true;
    finalSegmentsRef.current = [];
    partialTranscriptRef.current = "";
    recordingStartedAtRef.current = null;
    firstTranscriptAtRef.current = null;

    setIsRecording(false);
    setHasRecording(false);
    setAsrPending(false);
    setDraft("");
    setLatencyLabel(null);
    setError(null);
    clearPersistedReportSession(storageKey);
  }

  const statusLabel = isRecording ? "录音中" : asrPending ? "整理中" : hasRecording ? "准备生成" : "准备录音";

  return (
    <section className={styles.wrapper}>
      <div className={styles.composer}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionTitle}>护理记录</p>
            <p className={styles.sectionMeta}>{elder.tips}</p>
            <p className={styles.moduleTip}>{selectedModuleTip}</p>
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
        {latencyLabel ? <div className={styles.latency}>{latencyLabel}</div> : null}

        <button
          className={styles.doneButton}
          onClick={handleGenerateReport}
          disabled={reportPending || isRecording || asrPending || !draft.trim()}
        >
          {reportPending ? <RefreshCcw size={16} className={styles.spin} /> : <Sparkles size={16} />}
          生成报告
        </button>
      </div>

    </section>
  );
}
