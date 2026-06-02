import { notFound } from "next/navigation";
import { MonthlyAttendanceReportPage } from "@/components/monthly-attendance-report-page";
import { getAttendanceReportById } from "@/lib/attendance-demo";
import styles from "@/app/page.module.css";

export default async function MonthlyAttendanceReportRoute({ params }: { params: Promise<{ month: string }> }) {
  const { month } = await params;
  const report = getAttendanceReportById(month);

  if (!report) {
    notFound();
  }

  return (
    <main className={styles.page}>
      <MonthlyAttendanceReportPage report={report} />
    </main>
  );
}
