import type { CareModuleId } from "@/lib/care-modules";
import type { GeneratedReport } from "@/types/report";

export interface ModuleRecognitionResult {
  moduleId: CareModuleId;
  transcript: string;
  recognized: boolean;
  extractedText: string;
  manualText?: string;
  suggestedReportText?: string;
  missingReason?: string;
}

export interface ExerciseResult {
  neck: string;
  shoulder: string;
  chestBack: string;
  waist: string;
  leg: string;
  heel: string;
}

export interface EditablePatientSnapshot {
  fullName: string;
  orderNo: string;
  bloodPressure: string;
  heartRate: string;
  bloodOxygen: string;
  statusTags: string[];
}

export interface PersistedReportSession {
  draft: string;
  sessionDate: string;
  selectedModules: CareModuleId[];
  moduleDrafts?: Partial<Record<CareModuleId, string>>;
  moduleResults?: ModuleRecognitionResult[];
  exerciseResult?: ExerciseResult;
  patientSnapshot?: EditablePatientSnapshot;
  generatedReport: GeneratedReport | null;
  updatedAt: string;
}

export function buildReportSessionStorageKey(elderId: string, selectedModules: CareModuleId[]): string {
  return `report-session:${elderId}:${selectedModules.join(",")}`;
}

export function readPersistedReportSession(storageKey: string): PersistedReportSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(storageKey);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as PersistedReportSession;
  } catch {
    return null;
  }
}

export function writePersistedReportSession(storageKey: string, session: PersistedReportSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(storageKey, JSON.stringify(session));
}

export function clearPersistedReportSession(storageKey: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(storageKey);
}
