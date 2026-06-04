import { NextResponse } from "next/server";
import { z } from "zod";
import { isCareModuleId } from "@/lib/care-modules";
import { ElderNotFoundError, finalizeGeneratedReport } from "@/server/services/report";

const moduleResultSchema = z.object({
  moduleId: z.string().refine((value) => isCareModuleId(value), "照護模塊無效。"),
  transcript: z.string(),
  recognized: z.boolean(),
  extractedText: z.string(),
  manualText: z.string().optional()
});

const exerciseResultSchema = z.object({
  neck: z.string(),
  shoulder: z.string(),
  chestBack: z.string(),
  waist: z.string(),
  leg: z.string(),
  heel: z.string()
});

const requestSchema = z.object({
  elderId: z.string().min(1),
  sessionDate: z.string().optional(),
  selectedModules: z
    .array(z.string())
    .min(1, "請至少選擇一個照護模塊。")
    .refine((values) => values.every((value) => isCareModuleId(value)), "照護模塊無效。"),
  moduleResults: z.array(moduleResultSchema).min(1, "請先完成模塊分析。"),
  exerciseResult: exerciseResultSchema.optional()
});

export async function POST(request: Request) {
  try {
    const payload = requestSchema.parse(await request.json());
    const report = await finalizeGeneratedReport(payload);

    return NextResponse.json({ report }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
    }

    if (error instanceof ElderNotFoundError) {
      return NextResponse.json({ error: "Elder not found." }, { status: 404 });
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
