import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { ReportResultPage } from "@/components/report-result-page";
import { parseCareModuleIds, serializeCareModuleIds } from "@/lib/care-modules";
import { getElderById } from "@/server/repositories/elder";
import styles from "@/app/report/report-page.module.css";

export default async function ReportResultRoute({
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
        <div className={styles.header}>
          <Link
            href={`/report/${id}/analysis?modules=${serializeCareModuleIds(selectedModules)}${taskId ? `&taskId=${encodeURIComponent(taskId)}` : ""}`}
            className={styles.backButton}
          >
            <Image src="/assets/icons/icon-back.svg" alt="" width={32} height={32} />
          </Link>
          <div className={styles.headerMain}>
            <h1 className={styles.title}>報告詳情</h1>
            <div className={styles.progress} aria-label="流程進度：第2步報告詳情">
              <span className={styles.progressActive} />
              <span className={styles.progressActive} />
              <span />
            </div>
          </div>
          <Link href="/" className={styles.closeButton} aria-label="關閉">
            <Image src="/assets/icons/icon-close.svg" alt="" width={24} height={24} />
          </Link>
        </div>

        <div className={styles.elderMeta}>
          <span className={styles.metaBadge}>風險 {elder.riskLevel}</span>
          {elder.medicalNotes ? <span className={styles.metaText}>{elder.medicalNotes}</span> : null}
        </div>

        <ReportResultPage elder={elder} taskId={taskId} selectedModules={selectedModules} />
      </section>
    </main>
  );
}
