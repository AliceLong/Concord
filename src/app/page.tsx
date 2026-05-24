import { HomeTaskDashboard } from "@/components/home-task-dashboard";
import { listCareTasks, listElders } from "@/server/repositories/elder";
import styles from "@/app/page.module.css";

export default function HomePage() {
  return (
    <main className={styles.page}>
      <HomeTaskDashboard tasks={listCareTasks()} elders={listElders()} />
    </main>
  );
}
