export interface ElderlyProfile {
  id: string;
  fullName: string;
  roomNo: string | null;
  gender: string | null;
  birthDate: string | null;
  riskLevel: "low" | "medium" | "high";
  medicalNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEvent {
  id: string;
  elderId: string;
  eventType: string;
  title: string;
  detail: string | null;
  occurredAt: string;
}
