import { z } from "zod";

export const moduleReportItemSchema = z.object({
  moduleId: z.string().min(1),
  moduleTitle: z.string().min(1),
  serviceContent: z.string().nullable(),
  elderResponse: z.string().nullable(),
  completion: z.string().nullable(),
  remarks: z.string().nullable()
});

export const elderStatusSectionSchema = z.object({
  statusTags: z.array(z.string()),
  interactionPerformance: z.string().nullable(),
  physicalCondition: z.string().nullable()
});

export const completedServicesSectionSchema = z.object({
  serviceItems: z.array(z.string()),
  completion: z.string().nullable(),
  elderPerformance: z.string().nullable()
});

export const summaryRemarksSectionSchema = z.object({
  summary: z.string().nullable(),
  incident: z.string().nullable(),
  recommendation: z.string().nullable()
});

export const moduleStructuredReportSchema = z.object({
  elderStatus: elderStatusSectionSchema,
  completedServices: completedServicesSectionSchema,
  moduleReports: z.array(moduleReportItemSchema),
  summaryAndRemarks: summaryRemarksSectionSchema
});

export const generatedReportSchema = z.object({
  elderId: z.string().min(1),
  transcript: z.string().min(1),
  sessionDate: z.string().nullable(),
  selectedModules: z.array(z.string().min(1)),
  elderStatus: elderStatusSectionSchema,
  completedServices: completedServicesSectionSchema,
  moduleReports: z.array(moduleReportItemSchema),
  summaryAndRemarks: summaryRemarksSectionSchema,
  reportText: z.string().min(1),
  generatedAt: z.string().min(1),
  model: z.string().nullable()
});

export type ModuleReportItem = z.infer<typeof moduleReportItemSchema>;
export type ModuleStructuredReport = z.infer<typeof moduleStructuredReportSchema>;
export type GeneratedReport = z.infer<typeof generatedReportSchema>;
export type ElderStatusSection = z.infer<typeof elderStatusSectionSchema>;
export type CompletedServicesSection = z.infer<typeof completedServicesSectionSchema>;
export type SummaryRemarksSection = z.infer<typeof summaryRemarksSectionSchema>;

export interface AsrTranscription {
  transcript: string;
  model: string | null;
}

export interface AudioInputMetadata {
  mimeType?: string;
  sampleRateHertz?: number;
  audioChannelCount?: number;
}

export interface AsrStreamSession {
  sessionId: string;
  model: string | null;
}

export interface AsrStreamEvent {
  type: "transcript" | "done" | "error";
  transcript: string;
  interimTranscript?: string;
  finalTranscript?: string;
  isFinal?: boolean;
  model: string | null;
  message?: string;
  metrics?: {
    clientSentAt?: number;
    serverReceivedAt?: number;
    googleRespondedAt?: number;
    clientToServerMs?: number;
    serverToGoogleResultMs?: number;
    endToEndMs?: number;
  };
}
