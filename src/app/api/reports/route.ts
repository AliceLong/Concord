import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/env";
import { verifyOrgPin } from "@/lib/security";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  createProcessingReport,
  getReportById
} from "@/server/repositories/report-repository";
import { processPendingReport } from "@/server/services/report-workflow";
import { transcribeUploadedAudio } from "@/server/services/transcription";

function getPinFromRequest(request: Request, formData: FormData): string | null {
  return (
    request.headers.get("x-org-pin") ??
    (typeof formData.get("orgPin") === "string" ? String(formData.get("orgPin")) : null)
  );
}

async function uploadAudioToStorage(file: File, elderId: string): Promise<string | null> {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const bucket = process.env.SUPABASE_STORAGE_AUDIO_BUCKET ?? "care-audio";
  const objectPath = `${elderId}/${Date.now()}-${file.name || "voice.webm"}`;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(bucket).upload(objectPath, file, {
    contentType: file.type || "audio/webm",
    upsert: false
  });

  if (error) {
    throw new Error(`Audio upload failed: ${error.message}`);
  }

  return objectPath;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const pin = getPinFromRequest(request, formData);

    if (!verifyOrgPin(pin)) {
      return NextResponse.json({ error: "Invalid organization pin." }, { status: 401 });
    }

    const elderIdRaw = formData.get("elderId");
    const createdByRaw = formData.get("createdBy");
    const noteTextRaw = formData.get("noteText");
    const audioRaw = formData.get("audio");

    const elderId = typeof elderIdRaw === "string" ? elderIdRaw.trim() : "";
    if (!elderId) {
      return NextResponse.json({ error: "elderId is required." }, { status: 400 });
    }

    const createdBy = typeof createdByRaw === "string" ? createdByRaw.trim() : null;
    const noteText = typeof noteTextRaw === "string" ? noteTextRaw.trim() : "";

    let transcriptionRaw: string | null = noteText || null;
    let audioPath: string | null = null;

    if (audioRaw instanceof File && audioRaw.size > 0) {
      audioPath = await uploadAudioToStorage(audioRaw, elderId);
      transcriptionRaw = await transcribeUploadedAudio({ file: audioRaw });
    }

    if (!transcriptionRaw) {
      return NextResponse.json({ error: "Either noteText or audio file is required." }, { status: 400 });
    }

    const report = await createProcessingReport({
      elderId,
      audioPath,
      transcriptionRaw,
      createdBy
    });

    await processPendingReport(report.id);
    const updated = await getReportById(report.id);

    return NextResponse.json(
      {
        report: updated ?? report
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
