import { z } from "zod";

export const reportStructuredSchema = z.object({
  mood: z.enum(["stable", "anxious", "depressed", "unknown"]),
  appetite: z.enum(["good", "normal", "poor", "unknown"]),
  sleep: z.enum(["good", "normal", "poor", "unknown"]),
  mobility: z.enum(["independent", "assisted", "bedridden", "unknown"]),
  symptoms: z.array(z.string()),
  riskFlags: z.array(z.string()),
  interventions: z.array(z.string()),
  handover: z.string(),
  summary: z.string()
});

export type StructuredReport = z.infer<typeof reportStructuredSchema>;

export interface AsrTranscription {
  transcript: string;
  model: string | null;
}

export interface GeneratedReport {
  elderId: string;
  transcript: string;
  sessionDate: string | null;
  reportStructured: StructuredReport;
  reportText: string;
  generatedAt: string;
  model: string | null;
}
