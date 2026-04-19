import type { ElderlyProfile, TimelineEvent } from "@/types/elderly";
import type { CareReport } from "@/types/report";

const now = new Date();

export const demoElders: ElderlyProfile[] = [
  {
    id: "demo-elder-1",
    fullName: "陈美玲",
    roomNo: "A-302",
    gender: "女",
    birthDate: "1941-06-12",
    riskLevel: "medium",
    medicalNotes: "高血压，需按时服药",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  },
  {
    id: "demo-elder-2",
    fullName: "李志强",
    roomNo: "B-108",
    gender: "男",
    birthDate: "1938-11-04",
    riskLevel: "high",
    medicalNotes: "COPD，夜间血氧重点观察",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  },
  {
    id: "demo-elder-3",
    fullName: "黄淑芬",
    roomNo: "C-215",
    gender: "女",
    birthDate: "1944-03-29",
    riskLevel: "low",
    medicalNotes: "糖尿病饮食控制中",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  },
  {
    id: "demo-elder-4",
    fullName: "吴家伟",
    roomNo: "D-119",
    gender: "男",
    birthDate: "1936-08-17",
    riskLevel: "medium",
    medicalNotes: "步态不稳，转移时建议搀扶",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  }
];

export const demoReportsStore = new Map<string, CareReport>();

export const demoTimelineStore: TimelineEvent[] = [
  {
    id: "demo-event-1",
    elderId: "demo-elder-1",
    eventType: "report_ready",
    title: "日常照护记录完成",
    detail: "今日精神稳定，午餐进食约七成，已完成交班。",
    occurredAt: new Date(now.getTime() - 1000 * 60 * 90).toISOString()
  },
  {
    id: "demo-event-2",
    elderId: "demo-elder-2",
    eventType: "observation",
    title: "夜间风险提醒",
    detail: "血氧偏低，建议今夜加强巡视频次。",
    occurredAt: new Date(now.getTime() - 1000 * 60 * 240).toISOString()
  }
];

export function listDemoReports(elderId?: string): CareReport[] {
  const reports = Array.from(demoReportsStore.values());

  return reports
    .filter((report) => (elderId ? report.elderId === elderId : true))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function appendDemoTimelineEvent(event: TimelineEvent): void {
  demoTimelineStore.unshift(event);
}
