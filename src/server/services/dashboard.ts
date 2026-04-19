import { listElders } from "@/server/repositories/elderly-repository";
import { listReports } from "@/server/repositories/report-repository";
import type { DashboardPayload, DashboardVisit, ElderOption, ReportListItem } from "@/types/workstation";

const visitSlots = [
  { start: "09:00", end: "10:30" },
  { start: "11:00", end: "12:30" },
  { start: "14:00", end: "15:30" },
  { start: "16:00", end: "17:30" },
  { start: "18:30", end: "19:30" }
] as const;

function sameLocalDay(left: string, right: Date): boolean {
  const date = new Date(left);

  return (
    date.getFullYear() === right.getFullYear() &&
    date.getMonth() === right.getMonth() &&
    date.getDate() === right.getDate()
  );
}

function buildVisitStatus(index: number, latestReportAt: string | null, now: Date): DashboardVisit["status"] {
  if (latestReportAt && sameLocalDay(latestReportAt, now)) {
    return "completed";
  }

  return index === 0 ? "in_progress" : "pending";
}

export async function getDashboardPayload(): Promise<DashboardPayload> {
  const [elders, reports] = await Promise.all([listElders(), listReports({ limit: 60 })]);
  const now = new Date();

  const visits = elders.map((elder, index) => {
    const slot = visitSlots[index % visitSlots.length];
    const latestReport = reports.find((report) => report.elderId === elder.id);
    const status = buildVisitStatus(index, latestReport?.createdAt ?? null, now);

    return {
      elderId: elder.id,
      elderName: elder.fullName,
      roomNo: elder.roomNo,
      riskLevel: elder.riskLevel,
      medicalNotes: elder.medicalNotes,
      slotLabel: `${slot.start} - ${slot.end}`,
      slotStart: slot.start,
      slotEnd: slot.end,
      status,
      latestReportAt: latestReport?.createdAt ?? null
    } satisfies DashboardVisit;
  });

  const completed = visits.filter((visit) => visit.status === "completed").length;
  const inProgress = visits.filter((visit) => visit.status === "in_progress").length;
  const pending = visits.filter((visit) => visit.status === "pending").length;

  return {
    dateLabel: new Intl.DateTimeFormat("zh-HK", {
      timeZone: "Asia/Hong_Kong",
      month: "long",
      day: "numeric",
      weekday: "long"
    }).format(now),
    headline: `今日共 ${visits.length} 位长者需要巡查与记录`,
    completed,
    inProgress,
    pending,
    visits
  };
}

export async function getElderOptions(): Promise<ElderOption[]> {
  const elders = await listElders();

  return elders.map((elder) => ({
    id: elder.id,
    fullName: elder.fullName,
    roomNo: elder.roomNo,
    riskLevel: elder.riskLevel,
    medicalNotes: elder.medicalNotes
  }));
}

export async function getReportList(params?: {
  elderId?: string;
  limit?: number;
}): Promise<ReportListItem[]> {
  const [elders, reports] = await Promise.all([listElders(), listReports(params)]);

  return reports.map((report) => {
    const elder = elders.find((item) => item.id === report.elderId);

    return {
      ...report,
      elderName: elder?.fullName ?? "未知长者",
      elderRoomNo: elder?.roomNo ?? null,
      elderRiskLevel: elder?.riskLevel ?? "low"
    };
  });
}
