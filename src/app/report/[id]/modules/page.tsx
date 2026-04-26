import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { CareModulePicker } from "@/components/care-module-picker";
import { parseCareModuleIds } from "@/lib/care-modules";
import { getElderById } from "@/server/repositories/elder";
import styles from "@/app/report/report-page.module.css";

export default async function CareModulesPage({
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

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.header}>
          <Link href="/" className={styles.backButton}>
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

        <CareModulePicker elderId={elder.id} initialSelected={selectedModules} />
      </section>
    </main>
  );
}
