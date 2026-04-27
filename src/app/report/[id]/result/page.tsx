import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ReportResultPage } from "@/components/report-result-page";
import { parseCareModuleIds, serializeCareModuleIds } from "@/lib/care-modules";
import { getElderById } from "@/server/repositories/elder";
import styles from "@/app/report/report-page.module.css";

export default async function ReportResultRoute({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ modules?: string | string[] }>;
}) {
  const { id } = await params;
  const { modules } = await searchParams;
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
          <Link href={`/report/${id}?modules=${serializeCareModuleIds(selectedModules)}`} className={styles.backButton}>
            <ChevronLeft size={18} />
          </Link>
          <div className={styles.headerMain}>
            <p className={styles.kicker}>Concord</p>
            <h1 className={styles.title}>{elder.fullName}</h1>
          </div>
          <span className={styles.roomChip}>{elder.roomNo ?? "未设定房间"}</span>
        </div>

        <div className={styles.elderMeta}>
          <span className={styles.metaBadge}>风险 {elder.riskLevel}</span>
          {elder.medicalNotes ? <span className={styles.metaText}>{elder.medicalNotes}</span> : null}
        </div>

        <ReportResultPage elder={elder} selectedModules={selectedModules} />
      </section>
    </main>
  );
}
