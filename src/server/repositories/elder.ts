import { demoCareTasks, demoElders, getModuleAssignment } from "@/lib/demo-data";
import type { CareModuleId } from "@/lib/care-modules";
import type { ElderlyProfile } from "@/types/elderly";

export function listElders(): ElderlyProfile[] {
  return demoElders;
}

export function getElderById(elderId: string): ElderlyProfile | null {
  return demoElders.find((elder) => elder.id === elderId) ?? null;
}

export function listCareTasks() {
  return demoCareTasks;
}

export function getCareTaskById(taskId: string) {
  return demoCareTasks.find((task) => task.id === taskId) ?? null;
}

export function getRequiredModulesForElder(elderId: string): CareModuleId[] {
  return getModuleAssignment(elderId).requiredModuleIds;
}

export function getOptionalModulesForElder(elderId: string): CareModuleId[] {
  return getModuleAssignment(elderId).optionalModuleIds;
}
