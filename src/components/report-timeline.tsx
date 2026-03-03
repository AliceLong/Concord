import type { CareReport } from "@/types/report";
import type { TimelineEvent } from "@/types/elderly";
import type { CSSProperties } from "react";

interface ReportTimelineProps {
  reports: CareReport[];
  timeline: TimelineEvent[];
}

export function ReportTimeline({ reports, timeline }: ReportTimelineProps) {
  return (
    <section style={styles.wrapper}>
      <h3 style={styles.heading}>历史记录时间线</h3>

      <div style={styles.grid}>
        <div style={styles.panel}>
          <h4 style={styles.subHeading}>时间线事件</h4>
          {timeline.length === 0 ? <p style={styles.empty}>暂无事件</p> : null}
          {timeline.map((item) => (
            <article key={item.id} style={styles.item}>
              <div style={styles.itemTitle}>{item.title}</div>
              <div style={styles.itemMeta}>{new Date(item.occurredAt).toLocaleString()}</div>
              {item.detail ? <p style={styles.itemDetail}>{item.detail}</p> : null}
            </article>
          ))}
        </div>

        <div style={styles.panel}>
          <h4 style={styles.subHeading}>报告列表</h4>
          {reports.length === 0 ? <p style={styles.empty}>暂无报告</p> : null}
          {reports.map((report) => (
            <article key={report.id} style={styles.item}>
              <div style={styles.itemTitle}>状态：{report.status}</div>
              <div style={styles.itemMeta}>{new Date(report.createdAt).toLocaleString()}</div>
              {report.reportText ? (
                <pre style={styles.pre}>{report.reportText.slice(0, 220)}...</pre>
              ) : (
                <p style={styles.itemDetail}>等待处理完成。</p>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  wrapper: {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #dde5f0",
    padding: 20
  },
  heading: {
    marginTop: 0,
    marginBottom: 12
  },
  subHeading: {
    marginTop: 0,
    marginBottom: 10
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 12
  },
  panel: {
    border: "1px solid #e5ecf6",
    borderRadius: 10,
    padding: 12,
    background: "#fbfdff"
  },
  item: {
    borderBottom: "1px solid #e9eef7",
    paddingBottom: 10,
    marginBottom: 10
  },
  itemTitle: {
    fontWeight: 600,
    color: "#1a2e44"
  },
  itemMeta: {
    fontSize: 12,
    color: "#5b7089",
    marginTop: 2
  },
  itemDetail: {
    marginBottom: 0,
    color: "#33475c",
    fontSize: 14
  },
  pre: {
    whiteSpace: "pre-wrap",
    fontSize: 12,
    color: "#2f4256",
    marginBottom: 0
  },
  empty: {
    color: "#607089",
    fontSize: 14
  }
};
