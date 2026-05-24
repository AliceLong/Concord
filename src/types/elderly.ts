export interface ElderlyProfile {
  id: string;
  fullName: string;
  roomNo: string | null;
  riskLevel: "low" | "medium" | "high";
  medicalNotes: string | null;
  tips: string;
  orderNo?: string;
  avatar?: string;
  statusTags?: string[];
  vitals?: {
    bloodPressure: string;
    heartRate: string;
    bloodOxygen: string;
  };
  createdAt: string;
  updatedAt: string;
}
