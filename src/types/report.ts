import { z } from "zod";

export const reportStructuredSchema = z.object({
  mood: z.enum(["stable", "anxious", "depressed", "unknown"]),
  appetite: z.enum(["good", "normal", "poor", "unknown"]),
  sleep: z.enum(["good", "normal", "poor", "unknown"]),
  mobility: z.enum(["independent", "assisted", "bedridden", "unknown"]),
  vitals: z.object({
    temperatureC: z.number().nullable(),
    bloodPressure: z.string().nullable(),
    heartRate: z.number().nullable(),
    bloodOxygen: z.number().nullable()
  }),
  symptoms: z.array(z.string()),
  riskFlags: z.array(z.string()),
  interventions: z.array(z.string()),
  handover: z.string()
});

export type StructuredReport = z.infer<typeof reportStructuredSchema>;

export type ReportStatus = "processing" | "ready" | "failed";

export interface CareReport {
  id: string;
  elderId: string;
  status: ReportStatus;
  audioPath: string | null;
  transcriptionRaw: string | null;
  reportStructured: StructuredReport | null;
  reportText: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}
