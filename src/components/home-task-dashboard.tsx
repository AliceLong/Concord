"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Box, ClipboardCheck, UserRound } from "lucide-react";
import type { DemoCareTask } from "@/lib/demo-data";
import type { ElderlyProfile } from "@/types/elderly";
import styles from "@/components/home-task-dashboard.module.css";

interface HomeTaskDashboardProps {
  tasks: DemoCareTask[];
  elders: ElderlyProfile[];
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(new Date(value));
}

function formatOverdueLabel(dueAt: string): { label: string; tone: "overdue" | "soon" | "normal" } {
  const now = new Date();
  const due = new Date(dueAt);
  const diffMs = due.getTime() - now.getTime();
  const diffHours = Math.round(Math.abs(diffMs) / 36e5);

  if (diffMs < 0) {
    return { label: `已逾期${Math.max(diffHours, 1)}h`, tone: "overdue" };
  }

  if (diffMs <= 4 * 36e5) {
    return { label: `逾期剩余${Math.max(diffHours, 1)}h`, tone: "soon" };
  }

  return { label: "待完成", tone: "normal" };
}

function completionKey(taskId: string): string {
  return `care-task-completed:${taskId}`;
}

export function HomeTaskDashboard({ tasks, elders }: HomeTaskDashboardProps) {
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [showFirstAchievement, setShowFirstAchievement] = useState(false);
  const [selectedDateIndex, setSelectedDateIndex] = useState(3);
  const weekDays = useMemo(
    () => ["五", "六", "日", "一", "二", "三", "四"].map((day, index) => ({ day, date: 18 + index })),
    []
  );

  useEffect(() => {
    const completed = tasks
      .filter((task) => window.localStorage.getItem(completionKey(task.id)) === "1")
      .map((task) => task.id);

    setCompletedTaskIds(completed);

    setShowFirstAchievement(
      window.localStorage.getItem("achievement:first-report-completed") === "1" &&
        window.localStorage.getItem("achievement:first-report-seen") !== "1"
    );
  }, [tasks]);

  function handleCloseAchievement() {
    window.localStorage.setItem("achievement:first-report-seen", "1");
    setShowFirstAchievement(false);
  }

  const taskItems = useMemo(
    () =>
      tasks
        .filter((task) => !completedTaskIds.includes(task.id))
        .map((task) => ({
          task,
          elder: elders.find((item) => item.id === task.elderId) ?? null,
          status: formatOverdueLabel(task.dueAt)
        }))
        .filter((item): item is { task: DemoCareTask; elder: ElderlyProfile; status: ReturnType<typeof formatOverdueLabel> } =>
          Boolean(item.elder)
        ),
    [completedTaskIds, elders, tasks]
  );

  const todayTasks = taskItems.filter((item) => item.status.tone === "normal");
  const unfinishedTasks = taskItems.filter((item) => item.status.tone !== "normal");

  return (
    <section className={styles.dashboard}>
      <header className={styles.hero}>
        <div>
          <p className={styles.greeting}>早晨，Doris!</p>
          <div className={styles.weekRow} aria-label="本周日期">
            {weekDays.map(({ day, date }, index) => (
              <button
                key={`${day}-${date}`}
                type="button"
                className={index === selectedDateIndex ? styles.dayActive : styles.day}
                onClick={() => setSelectedDateIndex(index)}
                aria-pressed={index === selectedDateIndex}
                aria-label={`选择 ${date} 日，星期${day}`}
              >
                <small>{day}</small>
                <strong>{date}</strong>
              </button>
            ))}
          </div>
        </div>
        <span className={styles.summaryBadge}>
          <ClipboardCheck size={16} />
          {taskItems.length} 项待处理
        </span>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>今日的任务</h2>
        <div className={styles.primaryList}>
          {todayTasks.length ? (
            todayTasks.map(({ task, elder }) => (
              <Link key={task.id} className={styles.taskCard} href={`/report/${elder.id}/modules?taskId=${task.id}`}>
                <div className={styles.avatar}>
                  <Image src="/assets/images/elder-sunflower.svg" alt="" width={76} height={76} />
                </div>
                <div className={styles.taskMain}>
                  <div className={styles.taskTop}>
                    <h3>{elder.fullName}</h3>
                    <span>单号: {elder.orderNo ?? elder.roomNo}</span>
                  </div>
                  <p>{formatTime(task.scheduledAt)}</p>
                </div>
                <ArrowRight size={18} />
              </Link>
            ))
          ) : (
            <div className={styles.emptyCard}>
              <UserRound size={18} />
              今日任务已完成
            </div>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>未完成事项</h2>
        <div className={styles.secondaryList}>
          {unfinishedTasks.map(({ task, elder, status }) => (
            <Link key={task.id} className={styles.miniCard} href={`/report/${elder.id}/modules?taskId=${task.id}`}>
              <div className={styles.miniAvatar}>
                <Image src="/assets/images/elder-sunflower.svg" alt="" width={64} height={64} />
              </div>
              <div className={styles.miniMain}>
                <strong>{elder.fullName}</strong>
                <span>{status.label}</span>
              </div>
              <span className={status.tone === "overdue" ? styles.overduePill : styles.soonPill}>
                {status.tone === "overdue" ? "已逾期" : "即将逾期"}
              </span>
            </Link>
          ))}
          {!unfinishedTasks.length ? <div className={styles.emptyCard}>暂无未完成事项</div> : null}
        </div>
      </section>

      {showFirstAchievement ? (
        <div className={styles.achievementOverlay} role="dialog" aria-modal="true" aria-labelledby="first-achievement-title">
          <div className={styles.achievementDialog}>
            <div className={styles.speechWrap}>
              <Image className={styles.speechBubble} src="/assets/images/speech-bubble.svg" alt="" width={240} height={137} />
              <p id="first-achievement-title">恭喜你完成第一次记录任务!</p>
            </div>

            <div className={styles.gifWrap}>
              <Image
                className={styles.achievementGif}
                src="/assets/gif/award_once.gif"
                alt=""
                width={266}
                height={276}
                unoptimized
              />
            </div>

            <div className={styles.achievementCard}>
              <p className={styles.achievementText}>可以去我的查看勋章获得情况哦</p>
              <button type="button" onClick={handleCloseAchievement}>
                知道啦
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <nav className={styles.bottomNav} aria-label="主导航">
        <Link className={styles.navActive} href="/">
          <Box size={20} />
          首页
        </Link>
        <Link href="/attendance-reports">
          <ClipboardCheck size={20} />
          报告
        </Link>
        <Link href="/profile">
          <UserRound size={20} />
          我的
        </Link>
      </nav>
    </section>
  );
}
