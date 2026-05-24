"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  listCareModules,
  serializeCareModuleIds,
  type CareModuleDefinition,
  type CareModuleId
} from "@/lib/care-modules";
import styles from "@/components/care-module-picker.module.css";

interface CareModulePickerProps {
  elderId: string;
  taskId?: string;
  initialSelected: CareModuleId[];
  requiredModules: CareModuleId[];
  optionalModules: CareModuleId[];
}

export function CareModulePicker({
  elderId,
  taskId,
  initialSelected,
  requiredModules
}: CareModulePickerProps) {
  const router = useRouter();
  const defaultSelected = initialSelected.length ? initialSelected : requiredModules;
  const [selectedModules, setSelectedModules] = useState<CareModuleId[]>([
    ...new Set([...requiredModules, ...defaultSelected])
  ]);
  const modules = useMemo(() => [...listCareModules()].sort((a, b) => a.number - b.number), []);

  function toggleModule(module: CareModuleDefinition) {
    if (requiredModules.includes(module.id)) {
      return;
    }

    setSelectedModules((current) =>
      current.includes(module.id) ? current.filter((item) => item !== module.id) : [...current, module.id]
    );
  }

  function handleNext() {
    if (selectedModules.length === 0) {
      return;
    }

    const taskQuery = taskId ? `&taskId=${encodeURIComponent(taskId)}` : "";
    router.push(`/report/${elderId}?modules=${serializeCareModuleIds(selectedModules)}${taskQuery}`);
  }

  return (
    <section className={styles.wrapper}>
      <div className={styles.honeycomb} aria-label="活动模块">
        {modules.map((module) => {
          const selected = selectedModules.includes(module.id);
          const required = requiredModules.includes(module.id);

          return (
            <button
              key={module.id}
              type="button"
              className={[
                styles.hex,
                selected ? styles.cardActive : "",
                required ? styles.cardRequired : ""
              ].join(" ")}
              onClick={() => toggleModule(module)}
              aria-pressed={selected}
              title={required ? "必选项目，已强制勾选" : selected ? "已选择，点击取消" : "点击选择"}
            >
              <span className={styles.hexNumber}>【{module.number}】</span>
              <span className={styles.hexTitle}>{formatModuleTitle(module)}</span>
            </button>
          );
        })}
      </div>

      <button className={styles.nextButton} type="button" onClick={handleNext} disabled={selectedModules.length === 0}>
        <span>下一步</span>
      </button>
    </section>
  );
}

function formatModuleTitle(module: CareModuleDefinition): string {
  switch (module.id) {
    case "delayed_recall":
      return "问长者\n还记得...";
    case "auditory_attention_training":
      return "听觉/\n专注力训练";
    case "fall_prevention_exercise":
      return "耆力/\n防跌运动";
    default:
      return module.title;
  }
}
