"use client";

import { useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";

interface VoiceReportFormProps {
  elderId: string;
}

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

  if (typeof MediaRecorder.isTypeSupported !== "function") {
    return null;
  }

  for (const mimeType of preferredMimeTypes) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
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

export function VoiceReportForm({ elderId }: VoiceReportFormProps) {
  const [noteText, setNoteText] = useState("");
  const [createdBy, setCreatedBy] = useState("护工A");
  const [orgPin, setOrgPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const canSubmit = useMemo(() => Boolean(noteText.trim() || recordedBlob), [noteText, recordedBlob]);

  const startRecording = async () => {
    setError(null);
    setSuccess(null);

    try {
      if (typeof MediaRecorder === "undefined") {
        throw new Error("当前浏览器不支持录音，请改用 Chrome/Edge，或先手工输入备注。");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const supportedMimeType = getSupportedAudioMimeType();
      const recorder = supportedMimeType
        ? new MediaRecorder(stream, { mimeType: supportedMimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || supportedMimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (recordingError) {
      setError(
        recordingError instanceof Error
          ? recordingError.message
          : "麦克风启动失败，请检查浏览器权限。"
      );
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) {
      return;
    }

    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const clearRecording = () => {
    setRecordedBlob(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      setError("请填写文本或录制语音。");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.set("elderId", elderId);
      formData.set("createdBy", createdBy);
      formData.set("noteText", noteText);
      if (orgPin) {
        formData.set("orgPin", orgPin);
      }

      if (recordedBlob) {
        const mimeType = recordedBlob.type || "application/octet-stream";
        const extension = extensionFromMimeType(mimeType);
        const file = new File([recordedBlob], `care-${Date.now()}.${extension}`, {
          type: mimeType
        });
        formData.set("audio", file);
      }

      const response = await fetch("/api/reports", {
        method: "POST",
        body: formData,
        headers: orgPin ? { "x-org-pin": orgPin } : undefined
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "提交失败");
      }

      setSuccess("报告已生成并入库。可在下方历史记录查看。");
      setNoteText("");
      setRecordedBlob(null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "提交失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h3 style={styles.heading}>新增照护记录</h3>

      <label style={styles.label}>
        录入人
        <input
          style={styles.input}
          value={createdBy}
          onChange={(event) => setCreatedBy(event.target.value)}
          placeholder="例如：护工A"
        />
      </label>

      <label style={styles.label}>
        机构 PIN（可选）
        <input
          style={styles.input}
          value={orgPin}
          onChange={(event) => setOrgPin(event.target.value)}
          placeholder="若配置了 PIN 则必填"
        />
      </label>

      <label style={styles.label}>
        手工备注（可选）
        <textarea
          style={styles.textarea}
          value={noteText}
          onChange={(event) => setNoteText(event.target.value)}
          placeholder="例如：今天午餐吃了七成，夜间有轻微咳嗽。"
        />
      </label>

      <div style={styles.recorderRow}>
        {!isRecording ? (
          <button type="button" style={styles.secondaryButton} onClick={startRecording}>
            开始录音
          </button>
        ) : (
          <button type="button" style={styles.warningButton} onClick={stopRecording}>
            停止录音
          </button>
        )}

        {recordedBlob ? (
          <>
            <span style={styles.hint}>已录制 {Math.round(recordedBlob.size / 1024)} KB</span>
            <button type="button" style={styles.secondaryButton} onClick={clearRecording}>
              清除录音
            </button>
          </>
        ) : (
          <span style={styles.hint}>未录制音频</span>
        )}
      </div>

      <button type="submit" style={styles.primaryButton} disabled={isSubmitting || !canSubmit}>
        {isSubmitting ? "处理中..." : "提交并生成报告"}
      </button>

      {error ? <p style={styles.error}>{error}</p> : null}
      {success ? <p style={styles.success}>{success}</p> : null}
    </form>
  );
}

const styles: Record<string, CSSProperties> = {
  form: {
    background: "#ffffff",
    borderRadius: 12,
    border: "1px solid #dde5f0",
    padding: 20,
    display: "grid",
    gap: 12
  },
  heading: {
    margin: 0,
    fontSize: 18
  },
  label: {
    display: "grid",
    gap: 6,
    fontSize: 14,
    color: "#34495e"
  },
  input: {
    borderRadius: 8,
    border: "1px solid #c6d2e3",
    padding: "10px 12px",
    fontSize: 14
  },
  textarea: {
    borderRadius: 8,
    border: "1px solid #c6d2e3",
    padding: "10px 12px",
    fontSize: 14,
    minHeight: 100,
    resize: "vertical"
  },
  recorderRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap"
  },
  primaryButton: {
    border: "none",
    borderRadius: 8,
    background: "#0d6efd",
    color: "#fff",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 600
  },
  secondaryButton: {
    border: "1px solid #c6d2e3",
    borderRadius: 8,
    background: "#fff",
    color: "#123",
    padding: "8px 12px",
    cursor: "pointer"
  },
  warningButton: {
    border: "none",
    borderRadius: 8,
    background: "#ff7a00",
    color: "#fff",
    padding: "8px 12px",
    cursor: "pointer"
  },
  hint: {
    fontSize: 13,
    color: "#607089"
  },
  error: {
    margin: 0,
    color: "#d92d20",
    fontSize: 14
  },
  success: {
    margin: 0,
    color: "#0f8f4b",
    fontSize: 14
  }
};
