import type { CareReport } from "@/types/report";
import type { ElderlyProfile } from "@/types/elderly";

export type VisitStatus = "completed" | "in_progress" | "pending";

export interface DashboardVisit {
  elderId: string;
  elderName: string;
  roomNo: string | null;
  riskLevel: ElderlyProfile["riskLevel"];
  medicalNotes: string | null;
  slotLabel: string;
  slotStart: string;
  slotEnd: string;
  status: VisitStatus;
  latestReportAt: string | null;
}

export interface DashboardPayload {
  dateLabel: string;
  headline: string;
  completed: number;
  inProgress: number;
  pending: number;
  visits: DashboardVisit[];
}

export interface ElderOption {
  id: string;
  fullName: string;
  roomNo: string | null;
  riskLevel: ElderlyProfile["riskLevel"];
  medicalNotes: string | null;
}

export interface ReportListItem extends CareReport {
  elderName: string;
  elderRoomNo: string | null;
  elderRiskLevel: ElderlyProfile["riskLevel"];
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ChatReplyPayload {
  reply: string;
  suggestions: string[];
}
