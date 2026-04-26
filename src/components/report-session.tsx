"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, Check, Mic, RefreshCcw, Square, Sparkles } from "lucide-react";
import { concatInt16Arrays, downsampleToInt16Pcm, int16ArrayToUint8Array, PCM_FRAME_SAMPLES } from "@/lib/audio/pcm";
import type { ElderlyProfile } from "@/types/elderly";
import type { AsrStreamEvent, GeneratedReport } from "@/types/report";
import styles from "@/components/report-session.module.css";

interface ReportSessionProps {
  elder: ElderlyProfile;
}

type AsrSocketMessage =
  | { type: "ready"; model?: string | null }
  | AsrStreamEvent;

function getAsrWebSocketUrl(): string {
  const url = new URL(window.location.href);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws/asr";
  url.search = "";
  url.hash = "";
  return url.toString();
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

export function ReportSession({ elder }: ReportSessionProps) {
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const sinkNodeRef = useRef<GainNode | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const pcmBufferRef = useRef<Int16Array<ArrayBufferLike>>(new Int16Array(0));
  const autoSyncDraftRef = useRef(true);

  const [isSupported, setIsSupported] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [draft, setDraft] = useState("");
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [asrPending, setAsrPending] = useState(false);
  const [reportPending, setReportPending] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);
  const [latencyLabel, setLatencyLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      closeAsrSocket();
    };
  }, []);

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

  function closeAsrSocket() {
    if (!socketRef.current) {
      return;
    }

    if (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING) {
      socketRef.current.close();
    }

    socketRef.current = null;
  }

  function syncDraft(transcript: string) {
    if (!autoSyncDraftRef.current) {
      return;
    }

    setDraft(transcript);
  }

  function handleSocketMessage(event: MessageEvent<string>) {
    let payload: AsrSocketMessage;

    try {
      payload = JSON.parse(event.data) as AsrSocketMessage;
    } catch {
      setError(`ASR 返回了非 JSON 消息：${event.data.slice(0, 120)}`);
      setAsrPending(false);
      return;
    }

    if (payload.type === "ready") {
      return;
    }

    if (payload.type === "transcript") {
      const transcript = payload.transcript ?? "";
      syncDraft(transcript);
      setHasRecording(Boolean(transcript.trim()));

      if (payload.metrics?.endToEndMs != null) {
        const parts = [`端到端 ${payload.metrics.endToEndMs}ms`];

        if (payload.metrics.serverToGoogleResultMs != null) {
          parts.push(`Google ${payload.metrics.serverToGoogleResultMs}ms`);
        }

        if (payload.metrics.clientToServerMs != null) {
          parts.push(`上传 ${payload.metrics.clientToServerMs}ms`);
        }

        setLatencyLabel(parts.join(" · "));
      }

      return;
    }

    if (payload.type === "done") {
      const transcript = payload.transcript ?? "";
      syncDraft(transcript);
      setHasRecording(Boolean(transcript.trim()));
      setAsrPending(false);
      setLatencyLabel(null);
      closeAsrSocket();
      return;
    }

    setError(payload.message ?? "语音转写失败");
    setAsrPending(false);
    setLatencyLabel(null);
    closeAsrSocket();
  }

  async function openAsrSocket(): Promise<WebSocket> {
    return await new Promise<WebSocket>((resolve, reject) => {
      const socket = new WebSocket(getAsrWebSocketUrl());
      let settled = false;

      socket.onopen = () => {
        socketRef.current = socket;
        socket.send(
          JSON.stringify({
            type: "start",
            languageCode: "yue-Hant-HK"
          })
        );
        socket.onmessage = handleSocketMessage;
        settled = true;
        resolve(socket);
      };

      socket.onerror = () => {
        if (!settled) {
          reject(new Error("实时语音连接失败。"));
        } else {
          setError("实时语音连接失败。");
          setAsrPending(false);
        }
      };

      socket.onclose = () => {
        if (!settled) {
          reject(new Error("实时语音连接已关闭。"));
          return;
        }

        socketRef.current = null;
      };
    });
  }

  function flushPcmFrames(sendPartial: boolean) {
    const socket = socketRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    while (pcmBufferRef.current.length >= PCM_FRAME_SAMPLES) {
      const frame = pcmBufferRef.current.slice(0, PCM_FRAME_SAMPLES);
      pcmBufferRef.current = pcmBufferRef.current.slice(PCM_FRAME_SAMPLES);
      const frameBytes = int16ArrayToUint8Array(frame);
      const metadataBytes = new TextEncoder().encode(`TSMETA::${Date.now()}\n`);
      const payload = new Uint8Array(metadataBytes.length + frameBytes.length);
      payload.set(metadataBytes, 0);
      payload.set(frameBytes, metadataBytes.length);
      socket.send(payload);
    }

    if (sendPartial && pcmBufferRef.current.length > 0) {
      const frameBytes = int16ArrayToUint8Array(pcmBufferRef.current);
      const metadataBytes = new TextEncoder().encode(`TSMETA::${Date.now()}\n`);
      const payload = new Uint8Array(metadataBytes.length + frameBytes.length);
      payload.set(metadataBytes, 0);
      payload.set(frameBytes, metadataBytes.length);
      socket.send(payload);
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
    setGeneratedReport(null);

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

      await openAsrSocket();

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
      setLatencyLabel(null);

      workletNode.port.onmessage = (event: MessageEvent<Float32Array>) => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
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
      closeAsrSocket();
      setAsrPending(false);
      setIsRecording(false);
      setError(currentError instanceof Error ? currentError.message : "录音启动失败");
    }
  }

  function handleStopRecording() {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      teardownAudioPipeline();
      setIsRecording(false);
      setAsrPending(false);
      return;
    }

    flushPcmFrames(true);
    socketRef.current.send(JSON.stringify({ type: "stop" }));
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
          sessionDate
        })
      });
      const body = await readJsonResponse<{ report?: GeneratedReport; error?: string }>(response);

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
    teardownAudioPipeline();

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "stop" }));
    }

    closeAsrSocket();
    pcmBufferRef.current = new Int16Array(0);
    autoSyncDraftRef.current = true;

    setIsRecording(false);
    setHasRecording(false);
    setAsrPending(false);
    setDraft("");
    setGeneratedReport(null);
    setLatencyLabel(null);
    setError(null);
  }

  const statusLabel = isRecording ? "录音中" : asrPending ? "整理中" : hasRecording ? "准备生成" : "准备录音";

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
