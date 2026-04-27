import { NextResponse } from "next/server";
import { z } from "zod";
import { buildGoogleFormExportFilename, buildGoogleFormWorkbookBuffer } from "@/lib/google-form-export";
import { generatedReportSchema } from "@/types/report";
import { getElderById } from "@/server/repositories/elder";

const requestSchema = z.object({
  elderId: z.string().min(1),
  report: generatedReportSchema
});

export async function POST(request: Request) {
  try {
    const payload = requestSchema.parse(await request.json());
    const elder = getElderById(payload.elderId);

    if (!elder) {
      return NextResponse.json({ error: "Elder not found." }, { status: 404 });
    }

    const buffer = buildGoogleFormWorkbookBuffer({
      elder,
      report: payload.report
    });
    const filename = encodeURIComponent(buildGoogleFormExportFilename(elder, payload.report));

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${filename}`,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
