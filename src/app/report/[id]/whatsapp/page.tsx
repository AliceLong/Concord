import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, X } from "lucide-react";
import { WhatsAppReportPage } from "@/components/whatsapp-report-page";
import { parseCareModuleIds, serializeCareModuleIds } from "@/lib/care-modules";
import { getElderById } from "@/server/repositories/elder";
import styles from "@/app/report/report-page.module.css";

export default async function WhatsAppRoute({
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
    redirect(`/report/${id}/modules${taskId ? `?taskId=${encodeURIComponent(taskId)}` : ""}`);
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.header}>
          <Link
            href={`/report/${id}/result?modules=${serializeCareModuleIds(selectedModules)}${taskId ? `&taskId=${encodeURIComponent(taskId)}` : ""}`}
            className={styles.backButton}
          >
            <ChevronLeft size={18} />
          </Link>
          <div className={styles.headerMain}>
            <h1 className={styles.title}>WhatsApp报告</h1>
            <div className={styles.progress} aria-label="流程进度：第3步 WhatsApp 报告">
              <span className={styles.progressActive} />
              <span className={styles.progressActive} />
              <span className={styles.progressActive} />
            </div>
          </div>
          <Link href="/" className={styles.closeButton} aria-label="关闭">
            <X size={18} />
          </Link>
        </div>

        <WhatsAppReportPage elder={elder} taskId={taskId} selectedModules={selectedModules} />
      </section>
    </main>
  );
}
