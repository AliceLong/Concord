import Image from "next/image";
import Link from "next/link";
import styles from "@/components/profile-page.module.css";

export function ProfilePage() {
  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>我的</h1>
        <div className={styles.profileAvatar}>
          <Image src="/assets/images/bee-large.svg" alt="" width={158} height={228} />
        </div>
        <p>Doris</p>
      </header>

      <Link className={styles.reportLink} href="/attendance-reports">
        <div>
          <h2>
            考勤报告
            <Image src="/assets/icons/icon-check-gradient-square.svg" alt="" width={23} height={23} />
          </h2>
          <p>阁下的报告生成好啦！请点击查看</p>
        </div>
        <Image src="/assets/icons/icon-arrow-circle-teal.svg" alt="" width={50} height={50} />
      </Link>

      <div className={styles.badgeGrid}>
        <article className={styles.badgeCard}>
          <Image src="/assets/images/bee-report.svg" alt="首次报告徽章" width={109} height={145} />
        </article>
        {Array.from({ length: 5 }).map((_, index) => (
          <article key={index} className={styles.lockedBadge}>
            <div className={styles.lockShape}>
              <span />
            </div>
          </article>
        ))}
      </div>

      <nav className={styles.bottomNav} aria-label="主导航">
        <Link href="/">
          <Image className={styles.navIcon} src="/assets/icons/home.svg" alt="" width={24} height={24} />
          首页
        </Link>
        <Link href="/attendance-reports">
          <Image className={styles.navIcon} src="/assets/icons/report.svg" alt="" width={24} height={24} />
          报告
        </Link>
        <Link className={styles.navActive} href="/profile">
          <Image className={styles.navIcon} src="/assets/icons/me_selected.svg" alt="" width={24} height={24} />
          我的
        </Link>
      </nav>
    </section>
  );
}
