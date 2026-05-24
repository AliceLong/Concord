const DEFAULT_DASHSCOPE_BASE_URL = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";

type ChatMessage = {
  role: "system" | "user";
  content: string;
};

interface ChatCompletionChoice {
  message?: {
    content?: string | Array<{ text?: string; type?: string }>;
  };
}

interface ChatCompletionResponse {
  choices?: ChatCompletionChoice[];
  error?: {
    message?: string;
    code?: string;
    type?: string;
  };
}

export type LlmTask = "analysis" | "report";

export function getLlmProviderName(): string {
  return process.env.AI_PROVIDER?.trim() || "dashscope";
}

function getBaseUrl(): string {
  return (process.env.AI_BASE_URL || process.env.DASHSCOPE_BASE_URL || DEFAULT_DASHSCOPE_BASE_URL).replace(/\/+$/, "");
}

function getApiKey(): string {
  return (process.env.AI_API_KEY || process.env.DASHSCOPE_API_KEY || "").trim();
}

export function getLlmModel(task: LlmTask): string {
  if (task === "analysis") {
    return process.env.AI_ANALYSIS_MODEL?.trim() || "qwen-flash";
  }

  return process.env.AI_REPORT_MODEL?.trim() || "qwen-plus";
}

function getTimeoutMs(task: LlmTask): number {
  const taskValue = task === "analysis" ? process.env.AI_ANALYSIS_TIMEOUT_MS : process.env.AI_REPORT_TIMEOUT_MS;
  const rawValue = taskValue || process.env.AI_TIMEOUT_MS;
  const parsed = Number(rawValue);

  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  return task === "analysis" ? 30000 : 45000;
}

function getFailurePrefix(): string {
  const provider = getLlmProviderName();
  return provider === "dashscope" ? "阿里百炼连接失败" : `${provider} 连接失败`;
}

function extractChoiceText(choice: ChatCompletionChoice | undefined): string {
  const content = choice?.message?.content;

  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => item.text ?? "")
      .join("")
      .trim();
  }

  return "";
}

export async function generateLlmText(params: {
  task: LlmTask;
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}): Promise<{ text: string; model: string }> {
  const apiKey = getApiKey();
  const failurePrefix = getFailurePrefix();

  if (!apiKey) {
    throw new Error(`${failurePrefix}：缺少 AI_API_KEY 或 DASHSCOPE_API_KEY。`);
  }

  const model = getLlmModel(params.task);
  const controller = new AbortController();
  const timeoutMs = getTimeoutMs(params.task);
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const messages: ChatMessage[] = [
    { role: "system", content: params.system },
    { role: "user", content: params.user }
  ];

  try {
    const response = await fetch(`${getBaseUrl()}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: params.temperature ?? 0,
        max_tokens: params.maxTokens,
        ...(params.jsonMode ? { response_format: { type: "json_object" } } : {})
      }),
      signal: controller.signal
    });
    const bodyText = await response.text();
    let body: ChatCompletionResponse | null = null;

    try {
      body = bodyText ? (JSON.parse(bodyText) as ChatCompletionResponse) : null;
    } catch {
      body = null;
    }

    if (!response.ok) {
      const detail = body?.error?.message || bodyText.slice(0, 240) || response.statusText;
      throw new Error(`${failurePrefix}：HTTP ${response.status} ${detail}`);
    }

    const text = extractChoiceText(body?.choices?.[0]);

    if (!text) {
      throw new Error(`${failurePrefix}：模型返回空内容。`);
    }

    return { text, model };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`${failurePrefix}：请求超时（${Math.round(timeoutMs / 1000)} 秒）。`);
    }

    if (error instanceof Error && error.message.startsWith(failurePrefix)) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "未知错误";
    throw new Error(`${failurePrefix}：${message}`);
  } finally {
    clearTimeout(timeoutId);
  }
}
