export const careModules = [
  {
    id: "reality_orientation",
    number: 1,
    title: "现实导向",
    examples: "新闻/资讯交流、日期星期季节时间地点地区辨识、回应参与",
    prompt: "同长者倾谈简短新闻、资讯或感兴趣内容，并询问日期、星期、季节、时间、地点、地区，记录回应、完成度及未完成原因。",
    questions: [
      "长者是否能围绕当日新闻、资讯或感兴趣内容进行交流？",
      "长者是否能回答日期、星期、季节、时间、地点、地区等问题？",
      "长者在交流过程中是否能保持回应和参与？"
    ],
    coverage:
      "记录是否与长者倾谈简短新闻/资讯，或按长者有兴趣的内容引导分享心得或睇法；记录是否询问今日是几年、几月、几日、星期几、什么季节、时间、地点、地区；记录长者回应情况、完成度及未完成原因。",
    focusPoints: ["新闻/资讯或兴趣内容交流", "日期星期季节时间地点地区辨识", "回应情况", "完成度", "未完成原因"],
    keywords: ["新闻", "资讯", "日期", "星期", "季节", "时间", "地点", "地区", "现实导向", "環境", "环境", "交流", "分享"],
    aliases: ["現實導向", "现实定向", "定向训练", "日期时间地点定向", "新聞分享"],
    fallbackLead: "本次照护涉及现实导向训练与定向能力观察。"
  },
  {
    id: "short_term_memory",
    number: 2,
    title: "短期记忆",
    examples: "三样不同类别物件记忆、5-10分钟后回忆、啤牌位置记忆/相同NO.配对",
    prompt: "用图片或实物展示三样不同类别物件，请长者重复说出2次，5-10分钟后回忆；也可进行啤牌位置记忆、反转啤牌及相同NO.配对。",
    questions: [
      "长者是否能记住图片或实物中的三样不同类别物件？",
      "长者是否能在5-10分钟后回忆三样物件？",
      "长者是否能完成啤牌位置记忆或相同NO.啤牌配对？"
    ],
    coverage:
      "记录是否使用图片或实物展示三样不同类别物件，并请长者重复说出2次；记录延迟5-10分钟后是否能回忆；记录是否进行啤牌位置记忆、反转啤牌及揭开相同NO.啤牌；记录完成度及未完成原因。",
    focusPoints: ["三样不同类别物件", "重复说出2次", "5-10分钟后回忆", "啤牌位置记忆", "相同NO.配对", "完成度", "未完成原因"],
    keywords: ["记忆", "回忆", "图片", "物件", "实物", "啤牌", "位置", "相同", "NO", "回答", "记得", "重复"],
    aliases: ["短期記憶", "记忆训练", "圖片記憶", "位置记忆", "位置記憶"],
    fallbackLead: "本次照护重点记录了短期记忆训练表现。"
  },
  {
    id: "reminiscence_therapy",
    number: 3,
    title: "怀缅治疗",
    examples: "旧日物品、香港地标、明星、怀旧歌曲、相关人事物分享",
    prompt: "显示旧日物品、香港地标、明星，或播放怀旧歌曲，引导长者讲出相关人、事、物并分享。",
    questions: [
      "长者是否能识别或回应旧日物品、香港地标、明星或怀旧歌曲？",
      "长者是否能围绕相关人、事、物进行分享？",
      "怀缅内容是否有助于引导长者表达和互动？"
    ],
    coverage:
      "记录是否显示长者年轻时的日常物品、香港地标、明星，或播放怀旧歌曲；记录长者是否讲出相关内容，并是否被引导分享以上人、事、物；记录互动表现、完成度及未完成原因。",
    focusPoints: ["旧日物品", "香港地标", "明星", "怀旧歌曲", "人事物分享", "互动表现", "完成度", "未完成原因"],
    keywords: ["怀旧", "怀缅", "旧物", "地标", "香港", "明星", "歌曲", "往事", "分享", "后生", "以前", "年轻"],
    aliases: ["懷緬治療", "怀旧治疗", "懷舊分享", "往事分享", "旧物辨识"],
    fallbackLead: "本次照护涉及怀缅治疗与往事分享。"
  },
  {
    id: "delayed_recall",
    number: 4,
    title: "问长者还记得",
    examples: "延迟回忆2.0三件物件、读出物件、提示后回忆",
    prompt: "询问长者是否还记得短期记忆训练中的三件物件，并请长者读出，记录完整回答、部分回答、需要提示或未能完成。",
    questions: [
      "长者是否还记得前面短期记忆训练中的三件物件？",
      "长者是否能读出或说出相关物件？",
      "长者是否需要提示或未能完成回忆？"
    ],
    coverage:
      "主要记录延迟回忆结果，即询问长者是否还记得2.0的三件物件是什么，并请长者读出；记录是否能完整回答、部分回答、需要提示或未能完成；记录完成度及未完成原因。",
    focusPoints: ["2.0三件物件", "读出物件", "完整回答", "部分回答", "需要提示", "未能完成", "未完成原因"],
    keywords: ["还记得", "記得", "三件物件", "三样", "回忆", "读出", "延迟", "刚才", "提示"],
    aliases: ["延遲回憶", "延迟提取", "回忆提取", "延後回憶", "4.0回忆"],
    fallbackLead: "本次照护记录了长者的延迟回忆表现。"
  },
  {
    id: "verbal_fluency",
    number: 5,
    title: "说话流畅度",
    examples: "类别命名、十种物品、跟读语句、迟缓停顿",
    prompt: "请长者按类别说出指定数量词语，如十种蔬菜、小食、国家、点心、港铁站、地区、厨房或厕所物品；也可由耆恩大使先读语句，再请长者跟读一次。",
    questions: [
      "长者是否能按类别说出指定数量的词语？",
      "长者是否能跟读耆恩大使读出的语句？",
      "长者说话过程中是否出现迟缓、停顿或未能完成？"
    ],
    coverage:
      "记录是否请长者说出十种蔬菜、小食、国家、酒楼点心、港铁站、地区、厨房物品、厕所物品等；也可因应长者熟悉或喜欢的物品调整；记录是否由耆恩大使先读语句，再请长者跟读一次；记录完成度及未完成原因。",
    focusPoints: ["指定数量词语", "十种类别物品", "熟悉或喜欢的类别", "跟读语句", "迟缓停顿", "完成度", "未完成原因"],
    keywords: ["蔬菜", "小食", "国家", "点心", "酒楼", "港铁", "地区", "厨房", "厕所", "跟读", "复述", "说话", "流畅", "停顿", "迟缓"],
    aliases: ["說話流暢度", "语言流畅度", "語言流暢度", "类别命名", "句子复述", "句子複述"],
    fallbackLead: "本次照护重点观察了长者的说话流畅度与语言表达能力。"
  },
  {
    id: "arithmetic_training",
    number: 6,
    title: "运算",
    examples: "5-8题加减数、啤牌/骰子、街市买餸找续情境",
    prompt: "问长者5-8题加减数，加减题各半；可用啤牌、骰子或街市买餸找续情境进行，注意切忌用真钱。",
    questions: [
      "长者是否能完成5-8题加减数？",
      "长者是否能通过啤牌、骰子或街市买餸找续情境完成运算？",
      "长者是否能理解题目并完成加减题？"
    ],
    coverage:
      "记录是否问长者5-8题加减数，加减题各半；记录是否使用啤牌、骰子，或想像到街市买餸找续的方式进行；注意切忌用真钱；记录完成度、答题情况及未完成原因。",
    focusPoints: ["5-8题加减数", "加减各半", "啤牌", "骰子", "街市买餸找续", "切忌用真钱", "答题情况", "未完成原因"],
    keywords: ["加减", "运算", "计算", "啤牌", "骰子", "找续", "找錢", "街市", "买餸", "数字", "数", "真钱"],
    aliases: ["運算", "加减运算", "加減運算", "情景计算", "數字計算"],
    fallbackLead: "本次照护包含基础运算与数字理解训练。"
  },
  {
    id: "association_training",
    number: 7,
    title: "联想训练",
    examples: "2-3个字词语接龙、2-3次不同词语开始、语音提示答案",
    prompt: "向长者说出一个2-3个字的词语并请长者接龙，做2-3次且每次用不同词语开始；也可用不直接说出答案任何一个字的语音提示引导答案。",
    questions: [
      "长者是否能根据2-3个字的词语进行接龙？",
      "长者是否能在不同词语开始下完成2-3次接龙？",
      "长者是否能根据语音提示说出答案？"
    ],
    coverage:
      "记录是否向长者说出一个2-3个字的词语，并请长者接龙；记录是否做2-3次，且每次使用不同词语开始；记录是否以不直接说出答案任何一个字为原则，用各种语音提示引导长者说出答案；记录完成度及未完成原因。",
    focusPoints: ["2-3个字词语", "接龙", "2-3次", "不同词语开始", "语音提示", "不直接说出答案任何一个字", "完成度", "未完成原因"],
    keywords: ["接龙", "联想", "提示", "语音提示", "词语", "答案", "想到", "不同词语"],
    aliases: ["聯想訓練", "词语接龙", "詞語接龍", "提示联想", "联想能力"],
    fallbackLead: "本次照护记录了长者的联想训练表现。"
  },
  {
    id: "auditory_attention_training",
    number: 8,
    title: "听觉 / 专注力训练",
    examples: "5-8组数字顺序/倒序读出、酒楼餐厅点餐记忆、两幅图找不同",
    prompt: "慢慢读出5-8组数字，请长者顺序或倒序读出；也可用酒楼或餐厅点餐情境记忆内容，或请长者说出两幅图的不同之处。",
    questions: [
      "长者是否能顺序或倒序读出5-8组数字？",
      "长者是否能记住酒楼或餐厅点餐内容？",
      "长者是否能说出两幅图的不同之处？"
    ],
    coverage:
      "记录是否由耆恩大使慢慢读出5-8组数字，并请长者顺序或倒序读出；记录是否使用酒楼或餐厅点餐情境，请长者记住点餐内容；记录是否请长者说出两幅图有何不同之处；记录完成度及未完成原因。",
    focusPoints: ["5-8组数字", "顺序读出", "倒序读出", "点餐内容", "两幅图不同之处", "完成度", "未完成原因"],
    keywords: ["数字", "顺序", "倒序", "酒楼", "餐厅", "餐单", "点餐", "找不同", "两幅图", "不同之处", "专注", "听觉"],
    aliases: ["聽覺/專注力訓練", "听觉训练", "專注力訓練", "数字复述", "數字複述", "找不同", "听觉 / 专注力训练"],
    fallbackLead: "本次照护重点观察了长者的听觉记忆与专注力表现。"
  },
  {
    id: "brain_training",
    number: 9,
    title: "健脑八式",
    examples: "健脑八式、训练动作完成、未进行或未完成原因",
    prompt: "记录是否进行健脑八式、训练完成情况；如没有进行或未能完成，记录时间不足、能力、身体不适、意愿等原因。",
    questions: [
      "长者是否有进行健脑八式？",
      "长者是否能完成相关训练动作？",
      "如没有进行或未能完成，原因是什么？"
    ],
    coverage:
      "记录是否进行健脑八式；记录训练完成情况；如没有进行或未能完成，记录原因，例如时间不足、长者能力、长者身体不适、长者意愿等；可补充备注中的相关训练表现。",
    focusPoints: ["是否进行健脑八式", "动作完成情况", "时间不足", "长者能力", "身体不适", "长者意愿", "备注表现"],
    keywords: ["健脑", "八式", "动作", "协调", "伸展", "活动", "配合", "身体不适", "意愿", "时间不足"],
    aliases: ["健腦八式", "健脑运动", "健腦運動", "脑部训练", "腦部訓練"],
    fallbackLead: "本次照护包含健脑八式与身体协调训练。"
  },
  {
    id: "fall_prevention_exercise",
    number: 10,
    title: "耆力 / 防跌运动",
    examples: "B1.1耆力运动、B1.3防跌运动、拉筋运动、带氧运动、分数和完成情况",
    prompt: "记录是否提供B1.1耆力运动/B1.3防跌运动，包括拉筋、带氧运动、分数、完成情况及未完成原因，下一页可补充各项目次数。",
    questions: [
      "长者是否有进行耆力运动或防跌运动？",
      "长者是否完成拉筋运动及带氧运动相关项目？",
      "如没有进行或未完成全部运动，原因是什么？"
    ],
    coverage:
      "记录是否提供B1.1耆力运动/B1.3防跌运动；记录拉筋运动，包括颈部、肩膊A/B、胸背A/B、腰部A/B、腿部一/二、脚跟；记录带氧运动，包括肩膊肌群+三头肌、胸肌+肩膊、背肌、腹部+坐姿抬腿、大腿两侧肌肉、小腿肌肉；记录分数、完成情况及未完成原因。",
    focusPoints: ["B1.1耆力运动", "B1.3防跌运动", "拉筋运动", "带氧运动", "分数", "完成情况", "未完成原因"],
    keywords: ["拉筋", "防跌", "耆力", "着力", "平衡", "脚跟", "腿部", "腰部", "肩膊", "颈部", "胸背", "带氧", "三头肌", "胸肌", "背肌", "腹部", "坐姿抬腿", "小腿", "分数", "B1.1", "B1.3"],
    aliases: ["耆力 / 防跌运动", "耆力/防跌运动", "著力/防跌運動", "防跌运动", "防跌運動", "着力训练", "著力訓練", "耆力运动"],
    fallbackLead: "本次照护包含耆力或防跌运动训练。"
  }
] as const;

export type CareModuleDefinition = (typeof careModules)[number];
export type CareModuleId = CareModuleDefinition["id"];

const careModuleMap = new Map<CareModuleId, CareModuleDefinition>(
  careModules.map((careModule) => [careModule.id, careModule])
);

export function isCareModuleId(value: string): value is CareModuleId {
  return careModuleMap.has(value as CareModuleId);
}

export function listCareModules(): readonly CareModuleDefinition[] {
  return careModules;
}

export function getCareModuleById(moduleId: CareModuleId): CareModuleDefinition {
  const careModule = careModuleMap.get(moduleId);

  if (!careModule) {
    throw new Error(`Unknown care module: ${moduleId}`);
  }

  return careModule;
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
  const titles = modules.map((careModule) => `【${careModule.number}】${careModule.title}`).join("、");
  const focusPoints = [...new Set(modules.flatMap((careModule) => careModule.focusPoints).slice(0, 12))];
  const focusText = focusPoints.join("、");

  return `已选择${titles}，请重点记录${focusText}。`;
}

export function buildCareModulePromptContext(moduleIds: CareModuleId[]): string {
  return getCareModulesByIds(moduleIds)
    .map(
      (careModule) =>
        [
          `- 【${careModule.number}】${careModule.title}（${careModule.id}）`,
          `  模块问题：${careModule.questions.join("；")}`,
          `  涵盖内容：${careModule.coverage}`,
          `  操作提示：${careModule.prompt}`,
          `  重点记录：${careModule.focusPoints.join("、")}`,
          `  常见同义表达：${careModule.aliases.join("、")}`
        ].join("\n")
    )
    .join("\n");
}
