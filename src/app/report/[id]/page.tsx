import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, X } from "lucide-react";
import { ReportSession } from "@/components/report-session";
import { parseCareModuleIds, serializeCareModuleIds } from "@/lib/care-modules";
import { getElderById } from "@/server/repositories/elder";
import styles from "@/app/report/[id]/voice-page.module.css";

export default async function ReportPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ modules?: string | string[]; taskId?: string }>;
}) {
  const { id } = await params;
  const { modules, taskId } = await searchParams;
  const elder = getElderById(id);

  if (!elder) {
    notFound();
  }

  const selectedModules = parseCareModuleIds(modules);

  if (selectedModules.length === 0) {
    redirect(`/report/${id}/modules`);
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.topBar}>
          <Link
            href={`/report/${id}/modules?modules=${serializeCareModuleIds(selectedModules)}${taskId ? `&taskId=${encodeURIComponent(taskId)}` : ""}`}
            className={styles.backButton}
          >
            <ChevronLeft size={36} strokeWidth={2.4} />
          </Link>
          <h1 className={styles.title}>语音录入</h1>
          <Link href="/" className={styles.closeButton}>
            <X size={36} strokeWidth={2.2} />
          </Link>
          <div className={styles.progress} aria-label="流程进度：第1步语音录入">
            <span className={`${styles.progressSegment} ${styles.progressSegmentActive}`} />
            <span className={styles.progressSegment} />
            <span className={styles.progressSegment} />
          </div>
        </div>

        <ReportSession
          elder={elder}
          taskId={taskId}
          selectedModules={selectedModules}
        />
      </section>
    </main>
  );
}
