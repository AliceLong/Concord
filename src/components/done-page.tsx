"use client";

import Link from "next/link";
import { useEffect } from "react";
import { CheckCircle2, Home } from "lucide-react";
import styles from "@/components/done-page.module.css";

interface DonePageProps {
  taskId?: string;
}

export function DonePage({ taskId }: DonePageProps) {
  useEffect(() => {
    if (taskId) {
      window.localStorage.setItem(`care-task-completed:${taskId}`, "1");
    }
  }, [taskId]);

  return (
    <section className={styles.wrapper}>
      <CheckCircle2 size={72} />
      <h1>考勤状态已更新</h1>
      <p>本次护理汇报流程已完成，返回首页后该任务会从待办中移除。</p>
      <Link href="/" className={styles.homeButton}>
        <Home size={18} />
        返回首页
      </Link>
    </section>
  );
}
