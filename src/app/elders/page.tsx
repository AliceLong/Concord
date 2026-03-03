import Link from "next/link";
import type { CSSProperties } from "react";
import { listElders } from "@/server/repositories/elderly-repository";

export const dynamic = "force-dynamic";

export default async function EldersPage() {
  const elders = await listElders();

  return (
    <main style={styles.main}>
      <header style={styles.header}>
        <h1 style={styles.title}>Concord 老人列表</h1>
        <p style={styles.subtitle}>CRM 入口：选择老人后可查看历史并录入当日照护记录。</p>
      </header>

      <section style={styles.grid}>
        {elders.map((elder) => (
          <Link key={elder.id} href={`/elders/${elder.id}`} style={styles.card}>
            <h2 style={styles.cardTitle}>{elder.fullName}</h2>
            <p style={styles.cardMeta}>房间：{elder.roomNo ?? "未配置"}</p>
            <p style={styles.cardMeta}>风险等级：{elder.riskLevel}</p>
            <p style={styles.cardMeta}>更新时间：{new Date(elder.updatedAt).toLocaleString()}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  main: {
    maxWidth: 1040,
    margin: "0 auto",
    padding: "32px 16px"
  },
  header: {
    marginBottom: 20
  },
  title: {
    margin: 0,
    fontSize: 30
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 0,
    color: "#4d6177"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14
  },
  card: {
    borderRadius: 12,
    border: "1px solid #dde5f0",
    background: "#ffffff",
    textDecoration: "none",
    padding: 16,
    display: "block"
  },
  cardTitle: {
    marginTop: 0,
    marginBottom: 10,
    color: "#112033",
    fontSize: 20
  },
  cardMeta: {
    margin: "4px 0",
    color: "#4a5e74",
    fontSize: 14
  }
};
