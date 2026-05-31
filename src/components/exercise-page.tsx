"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { RefreshCcw } from "lucide-react";
import { serializeCareModuleIds, type CareModuleId } from "@/lib/care-modules";
import {
  buildReportSessionStorageKey,
  readPersistedReportSession,
  writePersistedReportSession,
  type ExerciseResult
} from "@/lib/report-session-storage";
import type { ElderlyProfile } from "@/types/elderly";
import type { GeneratedReport } from "@/types/report";
import styles from "@/components/exercise-page.module.css";

interface ExercisePageProps {
  elder: ElderlyProfile;
  taskId?: string;
  selectedModules: CareModuleId[];
}

const exerciseFields: Array<{ key: keyof ExerciseResult; label: string }> = [
  { key: "neck", label: "拉筋运动 [颈部]" },
  { key: "shoulder", label: "拉筋运动 [肩膊(A、B)]" },
  { key: "chestBack", label: "拉筋运动 [胸背(A、B)]" },
  { key: "waist", label: "拉筋运动 [腰部(A、B)]" },
  { key: "leg", label: "拉筋运动 [腿部(一、二)]" },
  { key: "heel", label: "拉筋运动 [脚跟]" }
];

const emptyExercise: ExerciseResult = {
  neck: "",
  shoulder: "",
  chestBack: "",
  waist: "",
  leg: "",
  heel: ""
};

async function readJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text) {
    throw new Error("服务端返回了空响应。");
  }

  return JSON.parse(text) as T;
}

export function ExercisePage({ elder, taskId, selectedModules }: ExercisePageProps) {
  const router = useRouter();
  const storageKey = buildReportSessionStorageKey(elder.id, selectedModules);
  const [exercise, setExercise] = useState<ExerciseResult>(emptyExercise);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const persisted = readPersistedReportSession(storageKey);
    setExercise(persisted?.exerciseResult ?? emptyExercise);
  }, [storageKey]);

  function updateField(key: keyof ExerciseResult, value: string) {
    setExercise((current) => ({
      ...current,
      [key]: value.replace(/[^\d]/g, "")
    }));
  }

  async function handleConfirm() {
    const persisted = readPersistedReportSession(storageKey);

    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/report/finalize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          elderId: elder.id,
          sessionDate: persisted?.sessionDate,
          selectedModules,
          moduleResults: persisted?.moduleResults ?? [],
          exerciseResult: exercise
        })
      });
      const body = await readJsonResponse<{ report?: GeneratedReport; error?: string }>(response);

      if (!response.ok || !body.report) {
        throw new Error(body.error ?? "生成报告失败");
      }

      writePersistedReportSession(storageKey, {
        draft: body.report.transcript,
        sessionDate: persisted?.sessionDate ?? new Date().toISOString().slice(0, 10),
        selectedModules,
        moduleDrafts: persisted?.moduleDrafts,
        moduleResults: persisted?.moduleResults,
        exerciseResult: exercise,
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
      setPending(false);
    }
  }

  return (
    <section className={styles.wrapper}>
      <div className={styles.heading}>
        <p>【10】</p>
        <h2>耆力 / 防跌运动</h2>
      </div>

      <div className={styles.list}>
        {exerciseFields.map((field) => (
          <label key={field.key} className={styles.field}>
            <span>{field.label}</span>
            <Image src="/assets/icons/icon-check.svg" alt="已完成" width={24} height={24} />
            <input
              value={exercise[field.key]}
              onChange={(event) => updateField(field.key, event.target.value)}
              inputMode="numeric"
              placeholder="请输入次数"
            />
          </label>
        ))}
      </div>

      {error ? <div className={styles.error}>{error}</div> : null}

      <button className={styles.confirmButton} type="button" onClick={handleConfirm} disabled={pending}>
        {pending ? <RefreshCcw size={16} className={styles.spin} /> : null}
        确认
      </button>
    </section>
  );
}
