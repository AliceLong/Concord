import { ProfilePage } from "@/components/profile-page";
import styles from "@/app/page.module.css";

export default function ProfileRoute() {
  return (
    <main className={styles.page}>
      <ProfilePage />
    </main>
  );
}
