"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "@/components/done-page.module.css";

interface DonePageProps {
  taskId?: string;
}

const DEMO_SHOW_ACHIEVEMENT_KEY = "demo:show-achievement";
const AUTO_RETURN_DELAY_MS = 1800;

export function DonePage({ taskId }: DonePageProps) {
  const router = useRouter();

  useEffect(() => {
    if (taskId) {
      window.localStorage.removeItem(`care-task-completed:${taskId}`);
    }

    window.localStorage.removeItem("demo:today-completed");
    window.localStorage.removeItem("demo:last-completed-task-id");
    window.localStorage.removeItem("demo:completed-at");
    window.localStorage.setItem(DEMO_SHOW_ACHIEVEMENT_KEY, "1");

    const timeoutId = window.setTimeout(() => {
      router.replace("/");
    }, AUTO_RETURN_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [router, taskId]);

  return (
    <section className={styles.wrapper}>
      <Image className={styles.transitionGif} src="/assets/gif/finish_once.gif" alt="" width={180} height={180} unoptimized />
      <h1>考勤狀態已更新</h1>
      <p>本次護理彙報流程已完成，正在返回首頁。</p>
      <Link href="/" className={styles.homeButton}>
        返回首頁
      </Link>
    </section>
  );
}
