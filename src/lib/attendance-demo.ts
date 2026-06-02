export interface DemoAttendanceReport {
  id: string;
  month: string;
  title: string;
  period: string;
  completionRate: string;
  reportCount: number;
  status: "ready" | "sent";
}

export const demoAttendanceReports: DemoAttendanceReport[] = [
  {
    id: "2026-06",
    month: "2026/06",
    title: "六月考勤报告",
    period: "2026/06/01 - 2026/06/30",
    completionRate: "96%",
    reportCount: 18,
    status: "ready"
  },
  {
    id: "2026-05",
    month: "2026/05",
    title: "五月考勤报告",
    period: "2026/05/01 - 2026/05/31",
    completionRate: "92%",
    reportCount: 21,
    status: "sent"
  }
];

export function getAttendanceReportById(id: string): DemoAttendanceReport | null {
  return demoAttendanceReports.find((report) => report.id === id) ?? null;
}
