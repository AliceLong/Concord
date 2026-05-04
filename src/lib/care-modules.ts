export const careModules = [
  {
    id: "respectful_companionship",
    title: "观赏尊卑",
    examples: "情绪陪伴、日常互动",
    focusPoints: ["情绪状态", "互动表现", "陪伴内容", "交流反馈"],
    keywords: ["情绪", "陪伴", "互动", "聊天", "交流", "安抚", "开心", "稳定"],
    fallbackLead: "本次照护围绕陪伴互动与情绪观察展开。"
  },
  {
    id: "short_term_memory",
    title: "短期记忆",
    examples: "记忆训练、认知引导",
    focusPoints: ["记忆训练表现", "回忆能力", "认知反应", "训练配合度"],
    keywords: ["记忆", "回忆", "认知", "训练", "专注", "回答", "反应"],
    fallbackLead: "本次照护涉及短期记忆训练与认知引导。"
  },
  {
    id: "emotional_healing",
    title: "领域治愈",
    examples: "情绪安抚、心理支持",
    focusPoints: ["情绪安抚方式", "心理状态", "安抚后反馈", "异常情绪表现"],
    keywords: ["安抚", "焦虑", "紧张", "低落", "情绪", "心理", "支持", "平复"],
    fallbackLead: "本次照护重点记录了情绪安抚与心理支持情况。"
  },
  {
    id: "medication_compliance",
    title: "问患者遵医嘱",
    examples: "用药提醒、健康询问",
    focusPoints: ["服药情况", "遵医嘱表现", "身体反馈", "不适或异常状态"],
    keywords: ["服药", "用药", "药", "遵医嘱", "医生", "提醒", "不适", "反馈"],
    fallbackLead: "本次照护重点关注长者是否按时服药及遵医嘱情况。"
  },
  {
    id: "condition_tracking",
    title: "跟踪病患",
    examples: "状态观察、异常记录",
    focusPoints: ["生命体征或状态变化", "异常表现", "观察结论", "后续跟进点"],
    keywords: ["观察", "状态", "异常", "记录", "跟进", "变化", "咳嗽", "气喘", "疼痛"],
    fallbackLead: "本次照护以状态观察与异常记录为主。"
  },
  {
    id: "light_interaction",
    title: "逗弄",
    examples: "轻松互动、陪伴娱乐",
    focusPoints: ["娱乐互动内容", "参与度", "情绪反馈", "互动效果"],
    keywords: ["娱乐", "互动", "玩", "笑", "轻松", "陪伴", "回应"],
    fallbackLead: "本次照护包含轻松互动与陪伴娱乐内容。"
  },
  {
    id: "assisted_training",
    title: "帮助训练",
    examples: "行动辅助、功能训练",
    focusPoints: ["行动辅助情况", "训练项目", "功能表现", "安全风险"],
    keywords: ["行路", "步态", "训练", "扶", "搀扶", "辅助", "行动", "站立"],
    fallbackLead: "本次照护涉及行动辅助与功能训练。"
  },
  {
    id: "attention_training",
    title: "接觉/专注力训练",
    examples: "注意力训练、认知练习",
    focusPoints: ["专注表现", "注意力持续时间", "认知练习反馈", "分心情况"],
    keywords: ["专注", "注意力", "认知", "练习", "分心", "集中", "训练"],
    fallbackLead: "本次照护重点记录了专注力训练与认知练习表现。"
  },
  {
    id: "life_rescue",
    title: "生命救援",
    examples: "紧急情况、风险处理",
    focusPoints: ["突发情况", "风险处理", "即时措施", "后续处置建议"],
    keywords: ["紧急", "风险", "呼救", "跌倒", "异常", "处理", "急救", "危险"],
    fallbackLead: "本次照护涉及紧急情况判断与风险处理。"
  }
] as const;

export type CareModuleDefinition = (typeof careModules)[number];
export type CareModuleId = CareModuleDefinition["id"];

const careModuleMap = new Map<CareModuleId, CareModuleDefinition>(
  careModules.map((module) => [module.id, module])
);

export function isCareModuleId(value: string): value is CareModuleId {
  return careModuleMap.has(value as CareModuleId);
}

export function listCareModules(): readonly CareModuleDefinition[] {
  return careModules;
}

export function getCareModuleById(moduleId: CareModuleId): CareModuleDefinition {
  const module = careModuleMap.get(moduleId);

  if (!module) {
    throw new Error(`Unknown care module: ${moduleId}`);
  }

  return module;
}

export function getCareModulesByIds(moduleIds: CareModuleId[]): CareModuleDefinition[] {
  return moduleIds.map((moduleId) => getCareModuleById(moduleId));
}

export function parseCareModuleIds(input: string | string[] | undefined | null): CareModuleId[] {
  const values = Array.isArray(input) ? input : typeof input === "string" ? input.split(",") : [];

  return values
    .map((value) => value.trim())
    .filter((value): value is CareModuleId => value.length > 0 && isCareModuleId(value))
    .filter((value, index, array) => array.indexOf(value) === index);
}

export function serializeCareModuleIds(moduleIds: CareModuleId[]): string {
  return moduleIds.join(",");
}

export function buildCareModuleTip(moduleIds: CareModuleId[]): string {
  const modules = getCareModulesByIds(moduleIds);
  const titles = modules.map((module) => `【${module.title}】`).join("");
  const focusPoints = [...new Set(modules.flatMap((module) => module.focusPoints))];
  const focusText = focusPoints.join("、");

  return `Tips：你已选择${titles}模块，请重点描述${focusText}。`;
}

export function buildCareModulePromptContext(moduleIds: CareModuleId[]): string {
  return getCareModulesByIds(moduleIds)
    .map(
      (module) =>
        `- ${module.title}（${module.id}）：适用于${module.examples}；请重点关注${module.focusPoints.join("、")}`
    )
    .join("\n");
}
