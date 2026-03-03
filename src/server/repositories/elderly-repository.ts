import { hasSupabaseEnv, isDemoFallbackEnabled } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { CareReport } from "@/types/report";
import type { ElderlyProfile, TimelineEvent } from "@/types/elderly";

const demoElders: ElderlyProfile[] = [
  {
    id: "demo-elder-1",
    fullName: "陈美玲",
    roomNo: "A-302",
    gender: "女",
    birthDate: "1941-06-12",
    riskLevel: "medium",
    medicalNotes: "高血压，需按时服药",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "demo-elder-2",
    fullName: "李志强",
    roomNo: "B-108",
    gender: "男",
    birthDate: "1938-11-04",
    riskLevel: "high",
    medicalNotes: "COPD，夜间血氧重点观察",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const demoTimeline: TimelineEvent[] = [
  {
    id: "demo-event-1",
    elderId: "demo-elder-1",
    eventType: "report_ready",
    title: "日常照护记录完成",
    detail: "今日精神稳定，午餐进食约7成。",
    occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString()
  }
];

const demoReports: CareReport[] = [];

function mapElder(row: Record<string, unknown>): ElderlyProfile {
  return {
    id: String(row.id),
    fullName: String(row.full_name),
    roomNo: row.room_no ? String(row.room_no) : null,
    gender: row.gender ? String(row.gender) : null,
    birthDate: row.birth_date ? String(row.birth_date) : null,
    riskLevel: (row.risk_level as ElderlyProfile["riskLevel"]) ?? "low",
    medicalNotes: row.medical_notes ? String(row.medical_notes) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function mapReport(row: Record<string, unknown>): CareReport {
  return {
    id: String(row.id),
    elderId: String(row.elder_id),
    status: String(row.status) as CareReport["status"],
    audioPath: row.audio_path ? String(row.audio_path) : null,
    transcriptionRaw: row.transcription_raw ? String(row.transcription_raw) : null,
    reportStructured: (row.report_structured as CareReport["reportStructured"]) ?? null,
    reportText: row.report_text ? String(row.report_text) : null,
    createdBy: row.created_by ? String(row.created_by) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function mapTimeline(row: Record<string, unknown>): TimelineEvent {
  return {
    id: String(row.id),
    elderId: String(row.elder_id),
    eventType: String(row.event_type),
    title: String(row.title),
    detail: row.detail ? String(row.detail) : null,
    occurredAt: String(row.occurred_at)
  };
}

export async function listElders(): Promise<ElderlyProfile[]> {
  if (!hasSupabaseEnv() && isDemoFallbackEnabled()) {
    return demoElders;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("elderly_profiles")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list elders: ${error.message}`);
  }

  return (data ?? []).map((row) => mapElder(row as Record<string, unknown>));
}

export async function getElderWithContext(elderId: string): Promise<{
  elder: ElderlyProfile;
  reports: CareReport[];
  timeline: TimelineEvent[];
} | null> {
  if (!hasSupabaseEnv() && isDemoFallbackEnabled()) {
    const elder = demoElders.find((item) => item.id === elderId);
    if (!elder) {
      return null;
    }

    return {
      elder,
      reports: demoReports.filter((item) => item.elderId === elderId),
      timeline: demoTimeline
        .filter((item) => item.elderId === elderId)
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    };
  }

  const supabase = getSupabaseAdmin();
  const [{ data: elderRow, error: elderError }, { data: reportRows, error: reportError }, { data: timelineRows, error: timelineError }] =
    await Promise.all([
      supabase.from("elderly_profiles").select("*").eq("id", elderId).single(),
      supabase.from("care_reports").select("*").eq("elder_id", elderId).order("created_at", { ascending: false }).limit(20),
      supabase.from("timeline_events").select("*").eq("elder_id", elderId).order("occurred_at", { ascending: false }).limit(50)
    ]);

  if (elderError) {
    if (elderError.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch elder profile: ${elderError.message}`);
  }

  if (reportError) {
    throw new Error(`Failed to fetch reports: ${reportError.message}`);
  }

  if (timelineError) {
    throw new Error(`Failed to fetch timeline events: ${timelineError.message}`);
  }

  return {
    elder: mapElder(elderRow as Record<string, unknown>),
    reports: (reportRows ?? []).map((row) => mapReport(row as Record<string, unknown>)),
    timeline: (timelineRows ?? []).map((row) => mapTimeline(row as Record<string, unknown>))
  };
}
