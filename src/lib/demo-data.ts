import type { CareModuleId } from "@/lib/care-modules";
import type { ElderlyProfile } from "@/types/elderly";

const now = new Date().toISOString();

export const demoElders: ElderlyProfile[] = [
  {
    id: "elder-chan",
    fullName: "陈小丽",
    roomNo: "OR-0847",
    orderNo: "CLT-0847",
    riskLevel: "medium",
    medicalNotes: "反应迟缓，情绪低落，睡眠不良，高血压。",
    tips: "今天重点关注精神状态、认知训练参与度和防跌运动完成情况。",
    avatar: "sunflower",
    statusTags: ["反应迟缓", "情绪低落", "睡眠不良", "高血压"],
    vitals: {
      bloodPressure: "158/85",
      heartRate: "82",
      bloodOxygen: "95"
    },
    createdAt: now,
    updatedAt: now
  },
  {
    id: "elder-wong",
    fullName: "黄婆婆",
    roomNo: "B-108",
    orderNo: "CLT-0921",
    riskLevel: "high",
    medicalNotes: "夜间血氧需要重点观察。",
    tips: "记录呼吸情况、服药依从性，以及是否出现疲倦或咳嗽。",
    avatar: "daisy",
    statusTags: ["血氧观察", "容易疲倦", "服药提醒"],
    vitals: {
      bloodPressure: "142/78",
      heartRate: "76",
      bloodOxygen: "93"
    },
    createdAt: now,
    updatedAt: now
  },
  {
    id: "elder-lee",
    fullName: "李姨",
    roomNo: "C-215",
    orderNo: "CLT-1068",
    riskLevel: "low",
    medicalNotes: "糖尿病饮食控制中。",
    tips: "优先记录运动配合度、食欲和情绪波动。",
    avatar: "sakura",
    statusTags: ["饮食控制", "运动观察", "情绪平稳"],
    vitals: {
      bloodPressure: "128/76",
      heartRate: "74",
      bloodOxygen: "97"
    },
    createdAt: now,
    updatedAt: now
  }
];

export interface DemoModuleAssignment {
  elderId: string;
  requiredModuleIds: CareModuleId[];
  optionalModuleIds: CareModuleId[];
}

export const demoModuleAssignments: DemoModuleAssignment[] = [
  {
    elderId: "elder-chan",
    requiredModuleIds: ["reality_orientation", "short_term_memory"],
    optionalModuleIds: ["reminiscence_therapy", "verbal_fluency", "auditory_attention_training", "brain_training", "fall_prevention_exercise"]
  },
  {
    elderId: "elder-wong",
    requiredModuleIds: ["reality_orientation", "auditory_attention_training"],
    optionalModuleIds: ["short_term_memory", "arithmetic_training", "fall_prevention_exercise"]
  },
  {
    elderId: "elder-lee",
    requiredModuleIds: ["verbal_fluency", "brain_training"],
    optionalModuleIds: ["reality_orientation", "association_training", "fall_prevention_exercise"]
  }
];

export interface DemoCareTask {
  id: string;
  elderId: string;
  scheduledAt: string;
  dueAt: string;
}

export const demoCareTasks: DemoCareTask[] = [
  {
    id: "task-chan-noon",
    elderId: "elder-chan",
    scheduledAt: "2026-05-20T12:00:00+08:00",
    dueAt: "2026-05-21T12:00:00+08:00"
  },
  {
    id: "task-wong-noon",
    elderId: "elder-wong",
    scheduledAt: "2026-05-20T12:00:00+08:00",
    dueAt: "2026-05-21T12:00:00+08:00"
  },
  {
    id: "task-chan-overdue",
    elderId: "elder-chan",
    scheduledAt: "2026-05-18T09:00:00+08:00",
    dueAt: "2026-05-19T09:00:00+08:00"
  },
  {
    id: "task-lee-soon",
    elderId: "elder-lee",
    scheduledAt: "2026-05-20T09:00:00+08:00",
    dueAt: "2026-05-20T23:00:00+08:00"
  }
];

export function getModuleAssignment(elderId: string): DemoModuleAssignment {
  return (
    demoModuleAssignments.find((assignment) => assignment.elderId === elderId) ?? {
      elderId,
      requiredModuleIds: ["reality_orientation"],
      optionalModuleIds: ["short_term_memory", "reminiscence_therapy", "fall_prevention_exercise"]
    }
  );
}
