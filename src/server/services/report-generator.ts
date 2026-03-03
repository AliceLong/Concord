import { reportStructuredSchema, type StructuredReport } from "@/types/report";

function containsAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

export function buildStructuredReport(transcriptionRaw: string): {
  structured: StructuredReport;
  reportText: string;
} {
  const normalized = transcriptionRaw.toLowerCase();

  const mood: StructuredReport["mood"] = containsAny(normalized, ["焦虑", "唔安", "anxious"])
    ? "anxious"
    : containsAny(normalized, ["情绪低落", "depressed"])
      ? "depressed"
      : "stable";

  const appetite: StructuredReport["appetite"] = containsAny(normalized, ["食欲差", "吃得少", "poor appetite"])
    ? "poor"
    : containsAny(normalized, ["食欲正常", "normal appetite"])
      ? "normal"
      : "good";

  const sleep: StructuredReport["sleep"] = containsAny(normalized, ["失眠", "sleep poor", "瞓得唔好"])
    ? "poor"
    : "normal";

  const mobility: StructuredReport["mobility"] = containsAny(normalized, ["卧床", "bedridden"])
    ? "bedridden"
    : containsAny(normalized, ["搀扶", "assist", "扶住"])
      ? "assisted"
      : "independent";

  const symptoms: string[] = [];
  if (containsAny(normalized, ["咳", "咳嗽", "cough"])) symptoms.push("咳嗽");
  if (containsAny(normalized, ["喘", "呼吸急", "shortness of breath"])) symptoms.push("呼吸不适");
  if (containsAny(normalized, ["发烧", "发热", "fever"])) symptoms.push("体温异常");

  const riskFlags: string[] = [];
  if (containsAny(normalized, ["跌倒", "摔", "fall"])) riskFlags.push("跌倒风险");
  if (containsAny(normalized, ["拒药", "漏服", "missed medicine"])) riskFlags.push("用药依从性风险");
  if (symptoms.includes("呼吸不适")) riskFlags.push("呼吸系统风险");

  const structured = reportStructuredSchema.parse({
    mood,
    appetite,
    sleep,
    mobility,
    vitals: {
      temperatureC: null,
      bloodPressure: null,
      heartRate: null,
      bloodOxygen: null
    },
    symptoms,
    riskFlags,
    interventions: ["已完成基础照护记录", "建议交班时复核高风险项"],
    handover: "如出现持续不适，请下一班次优先复查并通知护士。"
  });

  const reportText = [
    "【护理日报】",
    `情绪：${structured.mood}`,
    `食欲：${structured.appetite}`,
    `睡眠：${structured.sleep}`,
    `活动能力：${structured.mobility}`,
    `症状：${structured.symptoms.length ? structured.symptoms.join("、") : "无明显异常"}`,
    `风险提示：${structured.riskFlags.length ? structured.riskFlags.join("、") : "无"}`,
    `处理措施：${structured.interventions.join("；")}`,
    `交班建议：${structured.handover}`,
    "",
    "【转写原文】",
    transcriptionRaw
  ].join("\n");

  return { structured, reportText };
}
