import Image from "next/image";
import Link from "next/link";
import styles from "@/components/profile-page.module.css";

const awardBadges = [
  { src: "/assets/award/1 264414742.png", label: "首次記錄任務勳章" },
  { src: "/assets/award/2 5267.png", label: "連續服務勳章" },
  { src: "/assets/award/3 81446.png", label: "考勤達成勳章" },
  { src: "/assets/award/4 44.png", label: "準時完成勳章" },
  { src: "/assets/award/Frame 1533211872 1.png", label: "月度報告勳章" }
];

export function ProfilePage() {
  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>我的</h1>
        <div className={styles.profileAvatar}>
          <Image src="/assets/images/bee-large.svg" alt="" width={158} height={228} />
        </div>
        <p>Joey</p>
      </header>

      <Link className={styles.reportLink} href="/attendance-reports">
        <div>
          <h2>
            考勤報告
            <Image src="/assets/icons/icon-check-gradient-square.svg" alt="" width={23} height={23} />
          </h2>
          <p>閣下的報告生成好啦！請點擊查看</p>
        </div>
        <Image src="/assets/icons/icon-arrow-circle-teal.svg" alt="" width={50} height={50} />
      </Link>

      <div className={styles.badgeGrid} aria-label="勳章列表">
        {awardBadges.map((badge) => (
          <Link key={badge.src} className={styles.badgeCard} href="/attendance-reports" aria-label={`${badge.label}，查看考勤報告`}>
            <Image src={badge.src} alt={badge.label} width={195} height={291} />
          </Link>
        ))}
      </div>

      <nav className={styles.bottomNav} aria-label="主導航">
        <Link href="/">
          <Image className={styles.navIcon} src="/assets/icons/home.svg" alt="" width={24} height={24} />
          首頁
        </Link>
        <Link href="/attendance-reports">
          <Image className={styles.navIcon} src="/assets/icons/report.svg" alt="" width={24} height={24} />
          報告
        </Link>
        <Link className={styles.navActive} href="/profile">
          <Image className={styles.navIcon} src="/assets/icons/me_selected.svg" alt="" width={24} height={24} />
          我的
        </Link>
      </nav>
    </section>
  );
}
