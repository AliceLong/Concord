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
    id: "2026-03",
    month: "2026/03",
    title: "三月考勤報告",
    period: "2026/03/01 - 2026/03/31",
    completionRate: "96%",
    reportCount: 18,
    status: "ready"
  },
  {
    id: "2026-06",
    month: "2026/06",
    title: "六月考勤報告",
    period: "2026/06/01 - 2026/06/30",
    completionRate: "96%",
    reportCount: 18,
    status: "ready"
  },
  {
    id: "2026-05",
    month: "2026/05",
    title: "五月考勤報告",
    period: "2026/05/01 - 2026/05/31",
    completionRate: "92%",
    reportCount: 21,
    status: "sent"
  },
  {
    id: "2026-07",
    month: "2026/07",
    title: "七月考勤報告",
    period: "2026/07/01 - 2026/07/31",
    completionRate: "96%",
    reportCount: 18,
    status: "ready"
  },
  {
    id: "2026-08",
    month: "2026/08",
    title: "八月考勤報告",
    period: "2026/08/01 - 2026/08/31",
    completionRate: "96%",
    reportCount: 18,
    status: "ready"
  },
  {
    id: "2026-09",
    month: "2026/09",
    title: "九月考勤報告",
    period: "2026/09/01 - 2026/09/30",
    completionRate: "96%",
    reportCount: 18,
    status: "ready"
  },
  {
    id: "2026-10",
    month: "2026/10",
    title: "十月考勤報告",
    period: "2026/10/01 - 2026/10/31",
    completionRate: "96%",
    reportCount: 18,
    status: "ready"
  },
  {
    id: "2026-11",
    month: "2026/11",
    title: "十一月考勤報告",
    period: "2026/11/01 - 2026/11/30",
    completionRate: "96%",
    reportCount: 18,
    status: "ready"
  },
  {
    id: "2026-12",
    month: "2026/12",
    title: "十二月考勤報告",
    period: "2026/12/01 - 2026/12/31",
    completionRate: "96%",
    reportCount: 18,
    status: "ready"
  }
];

export function getAttendanceReportById(id: string): DemoAttendanceReport | null {
  return demoAttendanceReports.find((report) => report.id === id) ?? null;
}
