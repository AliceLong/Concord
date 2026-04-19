import { hasSupabaseEnv, isDemoFallbackEnabled } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  demoElders,
  demoTimelineStore,
  listDemoReports
} from "@/server/repositories/demo-store";
import type { CareReport } from "@/types/report";
import type { ElderlyProfile, TimelineEvent } from "@/types/elderly";

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
      reports: listDemoReports(elderId),
      timeline: demoTimelineStore
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
