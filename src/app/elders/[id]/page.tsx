import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { ReportTimeline } from "@/components/report-timeline";
import { VoiceReportForm } from "@/components/voice-report-form";
import { getElderWithContext } from "@/server/repositories/elderly-repository";

export const dynamic = "force-dynamic";

export default async function ElderDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await getElderWithContext(id);

  if (!context) {
    notFound();
  }

  const { elder, reports, timeline } = context;

  return (
    <main style={styles.main}>
      <Link href="/elders" style={styles.backLink}>
        ← 返回老人列表
      </Link>

      <section style={styles.profileCard}>
        <h1 style={styles.name}>{elder.fullName}</h1>
        <div style={styles.profileGrid}>
          <p>房间：{elder.roomNo ?? "未配置"}</p>
          <p>性别：{elder.gender ?? "未配置"}</p>
          <p>出生日期：{elder.birthDate ?? "未配置"}</p>
          <p>风险等级：{elder.riskLevel}</p>
        </div>
        <p style={styles.notes}>医疗备注：{elder.medicalNotes ?? "无"}</p>
      </section>

      <section style={styles.section}>
        <VoiceReportForm elderId={elder.id} />
      </section>

      <section style={styles.section}>
        <ReportTimeline reports={reports} timeline={timeline} />
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  main: {
    maxWidth: 1040,
    margin: "0 auto",
    padding: "28px 16px"
  },
  backLink: {
    display: "inline-block",
    marginBottom: 16,
    color: "#2a5db0",
    textDecoration: "none"
  },
  profileCard: {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #dde5f0",
    padding: 20
  },
  name: {
    marginTop: 0,
    marginBottom: 12,
    fontSize: 28
  },
  profileGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 8,
    marginBottom: 10
  },
  notes: {
    marginBottom: 0,
    color: "#34495e"
  },
  section: {
    marginTop: 16
  }
};
