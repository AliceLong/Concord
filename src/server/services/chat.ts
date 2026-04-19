import { hasOpenAIEnv } from "@/lib/env";
import { getOpenAIClient } from "@/lib/openai";
import { getElderWithContext } from "@/server/repositories/elderly-repository";
import type { ChatReplyPayload, ChatTurn } from "@/types/workstation";

function buildFallbackReply(message: string, elderSummary: string): ChatReplyPayload {
  const trimmed = message.trim();

  if (!trimmed) {
    return {
      reply: "请先输入你想查询的情况，例如症状总结、交班重点或风险提示。",
      suggestions: ["总结今天重点", "生成交班提醒", "有没有风险需要升级"]
    };
  }

  return {
    reply: [
      elderSummary,
      "",
      "当前环境未配置 OpenAI，对话先走本地 fallback。",
      "建议你基于以下框架回应护工：",
      "1. 先确认今天的主要观察点。",
      "2. 标出需要交班或上报的风险。",
      "3. 明确下一步护理动作。",
      "",
      `你刚刚问的是：${trimmed}`
    ].join("\n"),
    suggestions: ["请整理成交班语言", "列出风险项", "把内容转成报告字段"]
  };
}

export async function getChatReply(params: {
  elderId?: string;
  messages: ChatTurn[];
}): Promise<ChatReplyPayload> {
  const history = params.messages.slice(-8);
  const latestUserTurn = [...history].reverse().find((turn) => turn.role === "user");

  const elderContext = params.elderId ? await getElderWithContext(params.elderId) : null;
  const elderSummary = elderContext
    ? `当前长者：${elderContext.elder.fullName}，房间 ${elderContext.elder.roomNo ?? "未设定"}，风险 ${elderContext.elder.riskLevel}。医疗备注：${elderContext.elder.medicalNotes ?? "无"}。`
    : "当前没有指定长者。";

  if (!hasOpenAIEnv()) {
    return buildFallbackReply(latestUserTurn?.content ?? "", elderSummary);
  }

  const openai = getOpenAIClient();
  const transcript = history.map((turn) => `${turn.role === "user" ? "护工" : "助手"}: ${turn.content}`).join("\n");
  const latestTimeline = elderContext?.timeline.slice(0, 3).map((item) => `${item.title}: ${item.detail ?? "无"}`).join("\n") ?? "无";

  const response = await openai.responses.create({
    model: process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini",
    instructions: [
      "你是 Concord 护理记录助手。",
      "你的目标是帮助护工快速整理观察重点、风险提示、交班语言和报告字段。",
      "回答使用简体中文，控制在 5 句以内，优先给出清晰可执行建议。",
      "如果用户在问报告，请尽量输出结构化字段建议。"
    ].join(" "),
    input: [
      elderSummary,
      `最近时间线：\n${latestTimeline}`,
      "以下是最近对话：",
      transcript
    ].join("\n\n")
  });

  return {
    reply: response.output_text.trim(),
    suggestions: ["总结成今日护理重点", "给我交班版本", "列出风险提示和跟进动作"]
  };
}
