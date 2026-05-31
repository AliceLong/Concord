import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { ExercisePage } from "@/components/exercise-page";
import { parseCareModuleIds, serializeCareModuleIds } from "@/lib/care-modules";
import { getElderById } from "@/server/repositories/elder";
import styles from "@/app/report/report-page.module.css";

export default async function ExerciseRoute({
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

  if (!selectedModules.includes("fall_prevention_exercise")) {
    redirect(`/report/${id}/result?modules=${serializeCareModuleIds(selectedModules)}${taskId ? `&taskId=${encodeURIComponent(taskId)}` : ""}`);
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
            <h1 className={styles.title}>语音录入</h1>
            <div className={styles.progress} aria-label="流程进度：第1步语音录入">
              <span className={styles.progressActive} />
              <span />
              <span />
            </div>
          </div>
          <Link href="/" className={styles.closeButton} aria-label="关闭">
            <Image src="/assets/icons/icon-close.svg" alt="" width={24} height={24} />
          </Link>
        </div>

        <ExercisePage elder={elder} taskId={taskId} selectedModules={selectedModules} />
      </section>
    </main>
  );
}
