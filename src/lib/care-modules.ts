export const careModules = [
  {
    id: "reality_orientation",
    number: 1,
    title: "現實導向",
    examples: "新聞/資訊交流、日期星期季節時間地點地區辨識、回應參與",
    prompt: "同長者傾談簡短新聞、資訊或感興趣內容，並詢問日期、星期、季節、時間、地點、地區，記錄回應、完成度及未完成原因。",
    questions: [
      "長者是否能圍繞當日新聞、資訊或感興趣內容進行交流？",
      "長者是否能回答日期、星期、季節、時間、地點、地區等問題？",
      "長者在交流過程中是否能保持回應和參與？"
    ],
    coverage:
      "記錄是否與長者傾談簡短新聞/資訊，或按長者有興趣的內容引導分享心得或睇法；記錄是否詢問今日是幾年、幾月、幾日、星期幾、什麼季節、時間、地點、地區；記錄長者回應情況、完成度及未完成原因。",
    focusPoints: ["新聞/資訊或興趣內容交流", "日期星期季節時間地點地區辨識", "回應情況", "完成度", "未完成原因"],
    keywords: ["新聞", "資訊", "日期", "星期", "季節", "時間", "地點", "地區", "現實導向", "環境", "環境", "交流", "分享"],
    aliases: ["現實導向", "現實定向", "定向訓練", "日期時間地點定向", "新聞分享"],
    fallbackLead: "本次照護涉及現實導向訓練與定向能力觀察。"
  },
  {
    id: "short_term_memory",
    number: 2,
    title: "短期記憶",
    examples: "三樣不同類別物件記憶、5-10分鐘後回憶、啤牌位置記憶/相同NO.配對",
    prompt: "用圖片或實物展示三樣不同類別物件，請長者重複說出2次，5-10分鐘後回憶；也可進行啤牌位置記憶、反轉啤牌及相同NO.配對。",
    questions: [
      "長者是否能記住圖片或實物中的三樣不同類別物件？",
      "長者是否能在5-10分鐘後回憶三樣物件？",
      "長者是否能完成啤牌位置記憶或相同NO.啤牌配對？"
    ],
    coverage:
      "記錄是否使用圖片或實物展示三樣不同類別物件，並請長者重複說出2次；記錄延遲5-10分鐘後是否能回憶；記錄是否進行啤牌位置記憶、反轉啤牌及揭開相同NO.啤牌；記錄完成度及未完成原因。",
    focusPoints: ["三樣不同類別物件", "重複說出2次", "5-10分鐘後回憶", "啤牌位置記憶", "相同NO.配對", "完成度", "未完成原因"],
    keywords: ["記憶", "回憶", "圖片", "物件", "實物", "啤牌", "位置", "相同", "NO", "回答", "記得", "重複"],
    aliases: ["短期記憶", "記憶訓練", "圖片記憶", "位置記憶", "位置記憶"],
    fallbackLead: "本次照護重點記錄了短期記憶訓練表現。"
  },
  {
    id: "reminiscence_therapy",
    number: 3,
    title: "懷緬治療",
    examples: "舊日物品、香港地標、明星、懷舊歌曲、相關人事物分享",
    prompt: "顯示舊日物品、香港地標、明星，或播放懷舊歌曲，引導長者講出相關人、事、物並分享。",
    questions: [
      "長者是否能識別或回應舊日物品、香港地標、明星或懷舊歌曲？",
      "長者是否能圍繞相關人、事、物進行分享？",
      "懷緬內容是否有助於引導長者表達和互動？"
    ],
    coverage:
      "記錄是否顯示長者年輕時的日常物品、香港地標、明星，或播放懷舊歌曲；記錄長者是否講出相關內容，並是否被引導分享以上人、事、物；記錄互動表現、完成度及未完成原因。",
    focusPoints: ["舊日物品", "香港地標", "明星", "懷舊歌曲", "人事物分享", "互動表現", "完成度", "未完成原因"],
    keywords: ["懷舊", "懷緬", "舊物", "地標", "香港", "明星", "歌曲", "往事", "分享", "後生", "以前", "年輕"],
    aliases: ["懷緬治療", "懷舊治療", "懷舊分享", "往事分享", "舊物辨識"],
    fallbackLead: "本次照護涉及懷緬治療與往事分享。"
  },
  {
    id: "delayed_recall",
    number: 4,
    title: "問長者三樣物品",
    examples: "延遲迴憶2.0三樣物品、讀出物品、提示後回憶",
    prompt: "詢問長者是否還記得短期記憶訓練中的三樣物品，並請長者讀出，記錄完整回答、部分回答、需要提示或未能完成。",
    questions: [
      "長者是否還記得前面短期記憶訓練中的三樣物品？",
      "長者是否能讀出或說出相關物品？",
      "長者是否需要提示或未能完成回憶？"
    ],
    coverage:
      "主要記錄延遲迴憶結果，即詢問長者是否還記得2.0的三樣物品是什麼，並請長者讀出；記錄是否能完整回答、部分回答、需要提示或未能完成；記錄完成度及未完成原因。",
    focusPoints: ["2.0三樣物品", "讀出物品", "完整回答", "部分回答", "需要提示", "未能完成", "未完成原因"],
    keywords: ["三樣物品", "還記得", "記得", "三樣", "回憶", "讀出", "延遲", "剛才", "提示"],
    aliases: ["問長者三樣物品", "延遲回憶", "延遲提取", "回憶提取", "延後回憶", "4.0回憶"],
    fallbackLead: "本次照護記錄了長者的延遲迴憶表現。"
  },
  {
    id: "verbal_fluency",
    number: 5,
    title: "說話流暢度",
    examples: "類別命名、十種物品、跟讀語句、遲緩停頓",
    prompt: "請長者按類別說出指定數量詞語，如十種蔬菜、小食、國家、點心、港鐵站、地區、廚房或廁所物品；也可由耆恩大使先讀語句，再請長者跟讀一次。",
    questions: [
      "長者是否能按類別說出指定數量的詞語？",
      "長者是否能跟讀耆恩大使讀出的語句？",
      "長者說話過程中是否出現遲緩、停頓或未能完成？"
    ],
    coverage:
      "記錄是否請長者說出十種蔬菜、小食、國家、酒樓點心、港鐵站、地區、廚房物品、廁所物品等；也可因應長者熟悉或喜歡的物品調整；記錄是否由耆恩大使先讀語句，再請長者跟讀一次；記錄完成度及未完成原因。",
    focusPoints: ["指定數量詞語", "十種類別物品", "熟悉或喜歡的類別", "跟讀語句", "遲緩停頓", "完成度", "未完成原因"],
    keywords: ["蔬菜", "小食", "國家", "點心", "酒樓", "港鐵", "地區", "廚房", "廁所", "跟讀", "複述", "說話", "流暢", "停頓", "遲緩"],
    aliases: ["說話流暢度", "語言流暢度", "語言流暢度", "類別命名", "句子複述", "句子複述"],
    fallbackLead: "本次照護重點觀察了長者的說話流暢度與語言表達能力。"
  },
  {
    id: "arithmetic_training",
    number: 6,
    title: "運算",
    examples: "5-8題加減數、啤牌/骰子、街市買餸找續情境",
    prompt: "問長者5-8題加減數，加減題各半；可用啤牌、骰子或街市買餸找續情境進行，注意切忌用真錢。",
    questions: [
      "長者是否能完成5-8題加減數？",
      "長者是否能通過啤牌、骰子或街市買餸找續情境完成運算？",
      "長者是否能理解題目並完成加減題？"
    ],
    coverage:
      "記錄是否問長者5-8題加減數，加減題各半；記錄是否使用啤牌、骰子，或想像到街市買餸找續的方式進行；注意切忌用真錢；記錄完成度、答題情況及未完成原因。",
    focusPoints: ["5-8題加減數", "加減各半", "啤牌", "骰子", "街市買餸找續", "切忌用真錢", "答題情況", "未完成原因"],
    keywords: ["加減", "運算", "計算", "啤牌", "骰子", "找續", "找錢", "街市", "買餸", "數字", "數", "真錢"],
    aliases: ["運算", "加減運算", "加減運算", "情景計算", "數字計算"],
    fallbackLead: "本次照護包含基礎運算與數字理解訓練。"
  },
  {
    id: "association_training",
    number: 7,
    title: "聯想訓練",
    examples: "2-3個字詞語接龍、2-3次不同詞語開始、語音提示答案",
    prompt: "向長者說出一個2-3個字的詞語並請長者接龍，做2-3次且每次用不同詞語開始；也可用不直接說出答案任何一個字的語音提示引導答案。",
    questions: [
      "長者是否能根據2-3個字的詞語進行接龍？",
      "長者是否能在不同詞語開始下完成2-3次接龍？",
      "長者是否能根據語音提示說出答案？"
    ],
    coverage:
      "記錄是否向長者說出一個2-3個字的詞語，並請長者接龍；記錄是否做2-3次，且每次使用不同詞語開始；記錄是否以不直接說出答案任何一個字為原則，用各種語音提示引導長者說出答案；記錄完成度及未完成原因。",
    focusPoints: ["2-3個字詞語", "接龍", "2-3次", "不同詞語開始", "語音提示", "不直接說出答案任何一個字", "完成度", "未完成原因"],
    keywords: ["接龍", "聯想", "提示", "語音提示", "詞語", "答案", "想到", "不同詞語"],
    aliases: ["聯想訓練", "詞語接龍", "詞語接龍", "提示聯想", "聯想能力"],
    fallbackLead: "本次照護記錄了長者的聯想訓練表現。"
  },
  {
    id: "auditory_attention_training",
    number: 8,
    title: "聽覺 / 專注力訓練",
    examples: "5-8組數字順序/倒序讀出、酒樓餐廳點餐記憶、兩幅圖找不同",
    prompt: "慢慢讀出5-8組數字，請長者順序或倒序讀出；也可用酒樓或餐廳點餐情境記憶內容，或請長者說出兩幅圖的不同之處。",
    questions: [
      "長者是否能順序或倒序讀出5-8組數字？",
      "長者是否能記住酒樓或餐廳點餐內容？",
      "長者是否能說出兩幅圖的不同之處？"
    ],
    coverage:
      "記錄是否由耆恩大使慢慢讀出5-8組數字，並請長者順序或倒序讀出；記錄是否使用酒樓或餐廳點餐情境，請長者記住點餐內容；記錄是否請長者說出兩幅圖有何不同之處；記錄完成度及未完成原因。",
    focusPoints: ["5-8組數字", "順序讀出", "倒序讀出", "點餐內容", "兩幅圖不同之處", "完成度", "未完成原因"],
    keywords: ["數字", "順序", "倒序", "酒樓", "餐廳", "餐單", "點餐", "找不同", "兩幅圖", "不同之處", "專注", "聽覺"],
    aliases: ["聽覺/專注力訓練", "聽覺訓練", "專注力訓練", "數字複述", "數字複述", "找不同", "聽覺 / 專注力訓練"],
    fallbackLead: "本次照護重點觀察了長者的聽覺記憶與專注力表現。"
  },
  {
    id: "brain_training",
    number: 9,
    title: "健腦八式",
    examples: "健腦八式、訓練動作完成、未進行或未完成原因",
    prompt: "記錄是否進行健腦八式、訓練完成情況；如沒有進行或未能完成，記錄時間不足、能力、身體不適、意願等原因。",
    questions: [
      "長者是否有進行健腦八式？",
      "長者是否能完成相關訓練動作？",
      "如沒有進行或未能完成，原因是什麼？"
    ],
    coverage:
      "記錄是否進行健腦八式；記錄訓練完成情況；如沒有進行或未能完成，記錄原因，例如時間不足、長者能力、長者身體不適、長者意願等；可補充備註中的相關訓練表現。",
    focusPoints: ["是否進行健腦八式", "動作完成情況", "時間不足", "長者能力", "身體不適", "長者意願", "備註表現"],
    keywords: ["健腦", "八式", "動作", "協調", "伸展", "活動", "配合", "身體不適", "意願", "時間不足"],
    aliases: ["健腦八式", "健腦運動", "健腦運動", "腦部訓練", "腦部訓練"],
    fallbackLead: "本次照護包含健腦八式與身體協調訓練。"
  },
  {
    id: "fall_prevention_exercise",
    number: 10,
    title: "耆力 / 防跌運動",
    examples: "B1.1耆力運動、B1.3防跌運動、拉筋運動、帶氧運動、分數和完成情況",
    prompt: "記錄是否提供B1.1耆力運動/B1.3防跌運動，包括拉筋、帶氧運動、分數、完成情況及未完成原因，下一頁可補充各項目次數。",
    questions: [
      "長者是否有進行耆力運動或防跌運動？",
      "長者是否完成拉筋運動及帶氧運動相關項目？",
      "如沒有進行或未完成全部運動，原因是什麼？"
    ],
    coverage:
      "記錄是否提供B1.1耆力運動/B1.3防跌運動；記錄拉筋運動，包括頸部、肩膊A/B、胸背A/B、腰部A/B、腿部一/二、腳跟；記錄帶氧運動，包括肩膊肌群+三頭肌、胸肌+肩膊、背肌、腹部+坐姿抬腿、大腿兩側肌肉、小腿肌肉；記錄分數、完成情況及未完成原因。",
    focusPoints: ["B1.1耆力運動", "B1.3防跌運動", "拉筋運動", "帶氧運動", "分數", "完成情況", "未完成原因"],
    keywords: ["拉筋", "防跌", "耆力", "著力", "平衡", "腳跟", "腿部", "腰部", "肩膊", "頸部", "胸背", "帶氧", "三頭肌", "胸肌", "背肌", "腹部", "坐姿抬腿", "小腿", "分數", "B1.1", "B1.3"],
    aliases: ["耆力 / 防跌運動", "耆力/防跌運動", "著力/防跌運動", "防跌運動", "防跌運動", "著力訓練", "著力訓練", "耆力運動"],
    fallbackLead: "本次照護包含耆力或防跌運動訓練。"
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

  return `已選擇${titles}，請重點記錄${focusText}。`;
}

export function buildCareModulePromptContext(moduleIds: CareModuleId[]): string {
  return getCareModulesByIds(moduleIds)
    .map(
      (careModule) =>
        [
          `- 【${careModule.number}】${careModule.title}（${careModule.id}）`,
          `  模塊問題：${careModule.questions.join("；")}`,
          `  涵蓋內容：${careModule.coverage}`,
          `  操作提示：${careModule.prompt}`,
          `  重點記錄：${careModule.focusPoints.join("、")}`,
          `  常見同義表達：${careModule.aliases.join("、")}`
        ].join("\n")
    )
    .join("\n");
}
