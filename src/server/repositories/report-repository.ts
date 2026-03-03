import { randomUUID } from "node:crypto";
import { hasSupabaseEnv, isDemoFallbackEnabled } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { CareReport, ReportStatus, StructuredReport } from "@/types/report";

interface CreateReportInput {
  elderId: string;
  audioPath: string | null;
  transcriptionRaw: string | null;
  createdBy: string | null;
}

const demoReports = new Map<string, CareReport>();

function nowIso(): string {
  return new Date().toISOString();
}

function mapReport(row: Record<string, unknown>): CareReport {
  return {
    id: String(row.id),
    elderId: String(row.elder_id),
    status: String(row.status) as ReportStatus,
    audioPath: row.audio_path ? String(row.audio_path) : null,
    transcriptionRaw: row.transcription_raw ? String(row.transcription_raw) : null,
    reportStructured: (row.report_structured as StructuredReport) ?? null,
    reportText: row.report_text ? String(row.report_text) : null,
    createdBy: row.created_by ? String(row.created_by) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

export async function createProcessingReport(input: CreateReportInput): Promise<CareReport> {
  if (!hasSupabaseEnv() && isDemoFallbackEnabled()) {
    const report: CareReport = {
      id: randomUUID(),
      elderId: input.elderId,
      status: "processing",
      audioPath: input.audioPath,
      transcriptionRaw: input.transcriptionRaw,
      reportStructured: null,
      reportText: null,
      createdBy: input.createdBy,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };

    demoReports.set(report.id, report);
    return report;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("care_reports")
    .insert({
      elder_id: input.elderId,
      status: "processing",
      audio_path: input.audioPath,
      transcription_raw: input.transcriptionRaw,
      created_by: input.createdBy
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create report: ${error.message}`);
  }

  return mapReport(data as Record<string, unknown>);
}

export async function getReportById(reportId: string): Promise<CareReport | null> {
  if (!hasSupabaseEnv() && isDemoFallbackEnabled()) {
    return demoReports.get(reportId) ?? null;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("care_reports").select("*").eq("id", reportId).single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to read report: ${error.message}`);
  }

  return mapReport(data as Record<string, unknown>);
}

export async function markReportReady(params: {
  reportId: string;
  transcriptionRaw: string;
  reportStructured: StructuredReport;
  reportText: string;
}): Promise<void> {
  if (!hasSupabaseEnv() && isDemoFallbackEnabled()) {
    const existing = demoReports.get(params.reportId);
    if (!existing) {
      throw new Error(`Report not found: ${params.reportId}`);
    }

    demoReports.set(params.reportId, {
      ...existing,
      status: "ready",
      transcriptionRaw: params.transcriptionRaw,
      reportStructured: params.reportStructured,
      reportText: params.reportText,
      updatedAt: nowIso()
    });
    return;
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("care_reports")
    .update({
      status: "ready",
      transcription_raw: params.transcriptionRaw,
      report_structured: params.reportStructured,
      report_text: params.reportText
    })
    .eq("id", params.reportId);

  if (error) {
    throw new Error(`Failed to mark report ready: ${error.message}`);
  }
}

export async function markReportFailed(reportId: string, reason: string): Promise<void> {
  if (!hasSupabaseEnv() && isDemoFallbackEnabled()) {
    const existing = demoReports.get(reportId);
    if (!existing) {
      return;
    }

    demoReports.set(reportId, {
      ...existing,
      status: "failed",
      reportText: reason,
      updatedAt: nowIso()
    });
    return;
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("care_reports")
    .update({
      status: "failed",
      report_text: reason
    })
    .eq("id", reportId);

  if (error) {
    throw new Error(`Failed to mark report failed: ${error.message}`);
  }
}

export async function appendTimelineEvent(params: {
  elderId: string;
  eventType: string;
  title: string;
  detail: string | null;
}): Promise<void> {
  if (!hasSupabaseEnv() && isDemoFallbackEnabled()) {
    return;
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("timeline_events").insert({
    elder_id: params.elderId,
    event_type: params.eventType,
    title: params.title,
    detail: params.detail
  });

  if (error) {
    throw new Error(`Failed to append timeline event: ${error.message}`);
  }
}
