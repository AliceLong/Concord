import { demoElders } from "@/lib/demo-data";
import type { ElderlyProfile } from "@/types/elderly";

export function listElders(): ElderlyProfile[] {
  return demoElders;
}

export function getElderById(elderId: string): ElderlyProfile | null {
  return demoElders.find((elder) => elder.id === elderId) ?? null;
}
