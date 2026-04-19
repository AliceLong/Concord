export interface ElderlyProfile {
  id: string;
  fullName: string;
  roomNo: string | null;
  riskLevel: "low" | "medium" | "high";
  medicalNotes: string | null;
  tips: string;
  createdAt: string;
  updatedAt: string;
}
