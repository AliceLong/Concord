"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import styles from "@/components/done-page.module.css";

interface DonePageProps {
  taskId?: string;
}

export function DonePage({ taskId }: DonePageProps) {
  useEffect(() => {
    if (taskId) {
      window.localStorage.setItem(`care-task-completed:${taskId}`, "1");
    }

    window.localStorage.setItem("achievement:first-report-completed", "1");
    window.localStorage.setItem("achievement:first-report-seen", "0");
  }, [taskId]);

  return (
    <section className={styles.wrapper}>
      <Image src="/assets/icons/icon-complete-large.svg" alt="" width={125} height={125} />
      <h1>考勤状态已更新</h1>
      <p>本次护理汇报流程已完成，返回首页后该任务会从待办中移除。</p>
      <Link href="/" className={styles.homeButton}>
        返回首页
      </Link>
    </section>
  );
}
