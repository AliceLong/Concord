import { AttendanceReportListPage } from "@/components/attendance-report-list-page";
import styles from "@/app/page.module.css";

export default function AttendanceReportsRoute() {
  return (
    <main className={styles.page}>
      <AttendanceReportListPage />
    </main>
  );
}
