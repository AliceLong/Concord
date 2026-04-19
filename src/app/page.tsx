import Link from "next/link";
import { ArrowRight, Mic } from "lucide-react";
import { listElders } from "@/server/repositories/elder";
import styles from "@/app/page.module.css";

export default function HomePage() {
  const elders = listElders();

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.hero}>
          <div className={styles.heroMain}>
            <div className={styles.heroIcon}>
              <Mic size={18} />
            </div>
            <div>
              <p className={styles.kicker}>Concord</p>
              <h1 className={styles.title}>选择长者</h1>
            </div>
          </div>
          <span className={styles.countBadge}>{elders.length} 位</span>
        </header>

        <p className={styles.helper}>开始一次新的语音记录</p>

        <section className={styles.list}>
          {elders.map((elder) => (
            <Link key={elder.id} href={`/report/${elder.id}`} className={styles.card}>
              <div className={styles.cardMain}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardName}>{elder.fullName}</h2>
                  <span className={styles.cardRoom}>{elder.roomNo ?? "未设定房间"}</span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.riskBadge}>风险 {elder.riskLevel}</span>
                  {elder.medicalNotes ? <span className={styles.noteText}>{elder.medicalNotes}</span> : null}
                </div>
              </div>
              <span className={styles.cardArrow} aria-hidden="true">
                <ArrowRight size={16} />
              </span>
            </Link>
          ))}
        </section>
      </section>
    </main>
  );
}
