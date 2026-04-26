"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import {
  listCareModules,
  serializeCareModuleIds,
  type CareModuleDefinition,
  type CareModuleId
} from "@/lib/care-modules";
import styles from "@/components/care-module-picker.module.css";

interface CareModulePickerProps {
  elderId: string;
  initialSelected: CareModuleId[];
}

export function CareModulePicker({ elderId, initialSelected }: CareModulePickerProps) {
  const router = useRouter();
  const [selectedModules, setSelectedModules] = useState<CareModuleId[]>(initialSelected);
  const modules = useMemo(() => listCareModules(), []);

  function toggleModule(module: CareModuleDefinition) {
    setSelectedModules((current) =>
      current.includes(module.id) ? current.filter((item) => item !== module.id) : [...current, module.id]
    );
  }

  function handleNext() {
    if (selectedModules.length === 0) {
      return;
    }

    router.push(`/report/${elderId}?modules=${serializeCareModuleIds(selectedModules)}`);
  }

  return (
    <section className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <p className={styles.title}>选择本次照护模块</p>
          <p className={styles.helper}>请先勾选本次服务涉及的模块，后续录音页会按模块提示记录重点。</p>
        </div>
        <span className={styles.count}>{selectedModules.length} 已选</span>
      </div>

      <div className={styles.grid}>
        {modules.map((module) => {
          const selected = selectedModules.includes(module.id);

          return (
            <button
              key={module.id}
              type="button"
              className={selected ? `${styles.card} ${styles.cardActive}` : styles.card}
              onClick={() => toggleModule(module)}
            >
              <div className={styles.cardHeader}>
                <p className={styles.cardTitle}>{module.title}</p>
                <span className={selected ? `${styles.tag} ${styles.tagActive}` : styles.tag}>
                  {selected ? "已选择" : "点击选择"}
                </span>
              </div>
              <p className={styles.cardBody}>{module.examples}</p>
            </button>
          );
        })}
      </div>

      <button className={styles.nextButton} type="button" onClick={handleNext} disabled={selectedModules.length === 0}>
        <span>下一步</span>
        <ArrowRight size={16} />
      </button>
    </section>
  );
}
