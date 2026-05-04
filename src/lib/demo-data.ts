import type { ElderlyProfile } from "@/types/elderly";

export const demoElders: ElderlyProfile[] = [
  {
    id: "elder-chan",
    fullName: "陈伯",
    roomNo: "A-302",
    riskLevel: "medium",
    medicalNotes: "高血压，午后容易疲劳。",
    tips: "今天重点关注精神状态、进食情况和步态稳定性。",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "elder-wong",
    fullName: "黄婆婆",
    roomNo: "B-108",
    riskLevel: "high",
    medicalNotes: "夜间血氧需要重点观察。",
    tips: "记录呼吸情况、服药依从性，以及是否出现疲倦或咳嗽。",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "elder-lee",
    fullName: "李姨",
    roomNo: "C-215",
    riskLevel: "low",
    medicalNotes: "糖尿病饮食控制中。",
    tips: "优先记录运动配合度、食欲和情绪波动。",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
