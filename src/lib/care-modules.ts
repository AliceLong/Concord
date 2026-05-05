export const careModules = [
  {
    id: "reality_orientation",
    title: "现实导向",
    examples: "新闻分享、日期时间地点定向",
    focusPoints: ["新闻或资讯分享内容", "日期时间地点辨识", "即时反应", "参与度"],
    keywords: ["新闻", "资讯", "日期", "星期", "季节", "时间", "地点", "地區", "现实导向"],
    aliases: ["現實導向", "现实定向", "定向训练", "日期时间地点定向", "新聞分享"],
    fallbackLead: "本次照护涉及现实导向训练与定向能力观察。"
  },
  {
    id: "short_term_memory",
    title: "短期记忆",
    examples: "图片记忆、位置记忆、延迟回忆",
    focusPoints: ["记忆编码表现", "位置记忆表现", "延迟回忆能力", "训练配合度"],
    keywords: ["记忆", "回忆", "图片", "物件", "啤牌", "位置", "回答", "记得"],
    aliases: ["短期記憶", "记忆训练", "圖片記憶", "位置记忆", "位置記憶"],
    fallbackLead: "本次照护重点记录了短期记忆训练表现。"
  },
  {
    id: "reminiscence_therapy",
    title: "怀缅治疗",
    examples: "旧物辨识、怀旧歌曲、往事分享",
    focusPoints: ["怀旧素材辨识", "往事分享内容", "情绪反应", "参与度"],
    keywords: ["怀旧", "旧物", "地标", "明星", "歌曲", "往事", "分享", "后生"],
    aliases: ["懷緬治療", "怀旧治疗", "懷舊分享", "往事分享", "旧物辨识"],
    fallbackLead: "本次照护涉及怀缅治疗与往事分享。"
  },
  {
    id: "delayed_recall",
    title: "延迟回忆",
    examples: "延迟提取、回忆先前记忆内容",
    focusPoints: ["延迟回忆表现", "提示后反应", "记忆保持度", "回答完整度"],
    keywords: ["还记得", "記得", "三件物件", "回忆", "读出", "延迟回忆"],
    aliases: ["延遲回憶", "延迟提取", "回忆提取", "延後回憶", "4.0回忆"],
    fallbackLead: "本次照护记录了长者的延迟回忆表现。"
  },
  {
    id: "verbal_fluency",
    title: "说话流畅度",
    examples: "类别命名、句子复述",
    focusPoints: ["词汇提取能力", "句子复述表现", "语言流畅度", "反应速度"],
    keywords: ["蔬菜", "小食", "国家", "点心", "地區", "廚房", "廁所", "跟读", "复述"],
    aliases: ["說話流暢度", "语言流畅度", "語言流暢度", "类别命名", "句子复述", "句子複述"],
    fallbackLead: "本次照护重点观察了长者的说话流畅度与语言表达能力。"
  },
  {
    id: "arithmetic_training",
    title: "运算",
    examples: "加减运算、生活情景计算",
    focusPoints: ["加减运算表现", "数字理解", "情景计算反应", "正确率"],
    keywords: ["加减", "运算", "计算", "啤牌", "骰子", "找续", "街市", "数字"],
    aliases: ["運算", "加减运算", "加減運算", "情景计算", "數字計算"],
    fallbackLead: "本次照护包含基础运算与数字理解训练。"
  },
  {
    id: "association_training",
    title: "联想训练",
    examples: "词语接龙、提示联想",
    focusPoints: ["联想能力", "接龙反应", "提示后回答", "思维灵活度"],
    keywords: ["接龙", "联想", "提示", "词语", "答案", "深水埗", "补衫"],
    aliases: ["聯想訓練", "词语接龙", "詞語接龍", "提示联想", "联想能力"],
    fallbackLead: "本次照护记录了长者的联想训练表现。"
  },
  {
    id: "auditory_attention_training",
    title: "听觉/专注力训练",
    examples: "数字复述、餐单记忆、找不同",
    focusPoints: ["听觉记忆表现", "专注力持续时间", "数字复述反应", "视觉专注表现"],
    keywords: ["数字", "顺序", "倒序", "酒楼", "餐厅", "餐", "找不同", "专注", "听觉"],
    aliases: ["聽覺/專注力訓練", "听觉训练", "專注力訓練", "数字复述", "數字複述", "找不同"],
    fallbackLead: "本次照护重点观察了长者的听觉记忆与专注力表现。"
  },
  {
    id: "vital_signs",
    title: "生命徵象",
    examples: "血压、心跳、血氧记录",
    focusPoints: ["血压读数", "心跳情况", "血氧情况", "量度结果是否异常"],
    keywords: ["血压", "上压", "下压", "心跳", "脉搏", "血氧", "生命征象", "生命徵象", "量度"],
    aliases: ["生命征象", "生命体征", "生命體徵", "生命表征", "血压心跳血氧", "生理指标"],
    fallbackLead: "本次照护包含生命徵象量度与基本生理状态观察。"
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
        `- ${module.title}（${module.id}）：适用于${module.examples}；请重点关注${module.focusPoints.join("、")}；常见同义表达包括${module.aliases.join("、")}`
    )
    .join("\n");
}
