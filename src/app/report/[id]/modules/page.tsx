import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { CareModulePicker } from "@/components/care-module-picker";
import { parseCareModuleIds } from "@/lib/care-modules";
import { getElderById, getOptionalModulesForElder, getRequiredModulesForElder } from "@/server/repositories/elder";
import styles from "@/app/report/[id]/modules/modules-page.module.css";

export default async function CareModulesPage({
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

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.topBar}>
          <Link href="/" className={styles.backButton}>
            <ChevronLeft size={36} strokeWidth={2.4} />
          </Link>
          <h1 className={styles.title}>活动选择</h1>
        </div>

        <CareModulePicker
          elderId={elder.id}
          taskId={taskId}
          initialSelected={selectedModules}
          requiredModules={getRequiredModulesForElder(elder.id)}
          optionalModules={getOptionalModulesForElder(elder.id)}
        />
      </section>
    </main>
  );
}
