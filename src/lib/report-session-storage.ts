import type { CareModuleId } from "@/lib/care-modules";
import type { GeneratedReport } from "@/types/report";

export interface PersistedReportSession {
  draft: string;
  sessionDate: string;
  selectedModules: CareModuleId[];
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
