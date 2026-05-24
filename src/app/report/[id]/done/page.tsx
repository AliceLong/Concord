import { notFound } from "next/navigation";
import { DonePage } from "@/components/done-page";
import { getElderById } from "@/server/repositories/elder";
import styles from "@/app/report/report-page.module.css";

export default async function DoneRoute({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ taskId?: string }>;
}) {
  const { id } = await params;
  const { taskId } = await searchParams;
  const elder = getElderById(id);

  if (!elder) {
    notFound();
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <DonePage taskId={taskId} />
      </section>
    </main>
  );
}
