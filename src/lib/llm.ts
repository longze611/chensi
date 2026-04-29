import { type AiProvider, getProviderOption } from "./ai-providers";

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmRuntimeConfig {
  provider: AiProvider;
  model: string;
  apiKey: string;
  baseUrl?: string;
}

export interface LlmJsonOptions {
  messages: LlmMessage[];
  temperature?: number;
  maxTokens?: number;
  config?: LlmRuntimeConfig | null;
}

export function isLlmConfigured(config?: LlmRuntimeConfig | null) {
  return Boolean(config?.apiKey || process.env.OPENAI_API_KEY);
}

function extractJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced ?? text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("LLM 响应中没有找到 JSON 对象");
  return candidate.slice(start, end + 1);
}

function resolveConfig(config?: LlmRuntimeConfig | null): LlmRuntimeConfig {
  if (config?.apiKey) return config;
  const provider = "openai";
  return {
    provider,
    model: process.env.OPENAI_MODEL ?? getProviderOption(provider).defaultModel,
    apiKey: process.env.OPENAI_API_KEY ?? "",
    baseUrl: process.env.OPENAI_BASE_URL ?? getProviderOption(provider).defaultBaseUrl
  };
}

function openAiCompatiblePayload(config: LlmRuntimeConfig, options: LlmJsonOptions) {
  return {
    model: config.model,
    messages: options.messages,
    temperature: options.temperature ?? 0.35,
    max_tokens: options.maxTokens ?? 3000,
    response_format: { type: "json_object" }
  };
}

async function callOpenAiCompatible<T>(config: LlmRuntimeConfig, options: LlmJsonOptions): Promise<T> {
  const baseUrl = (config.baseUrl || getProviderOption(config.provider).defaultBaseUrl).replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify(openAiCompatiblePayload(config, options))
  });
  if (!response.ok) throw new Error(`LLM 调用失败：${response.status} ${await response.text().catch(() => "")}`);
  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("LLM 响应为空");
  return JSON.parse(extractJson(content)) as T;
}

async function callGoogle<T>(config: LlmRuntimeConfig, options: LlmJsonOptions): Promise<T> {
  const baseUrl = (config.baseUrl || getProviderOption("google").defaultBaseUrl).replace(/\/$/, "");
  const systemText = options.messages.filter((item) => item.role === "system").map((item) => item.content).join("\n\n");
  const userText = options.messages.filter((item) => item.role !== "system").map((item) => `${item.role}: ${item.content}`).join("\n\n");
  const response = await fetch(`${baseUrl}/models/${config.model}:generateContent?key=${encodeURIComponent(config.apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemText }] },
      contents: [{ role: "user", parts: [{ text: `${userText}\n\n请只返回合法 JSON 对象。` }] }],
      generationConfig: { temperature: options.temperature ?? 0.35, maxOutputTokens: options.maxTokens ?? 3000, responseMimeType: "application/json" }
    })
  });
  if (!response.ok) throw new Error(`Google Gemini 调用失败：${response.status} ${await response.text().catch(() => "")}`);
  const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const content = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");
  if (!content) throw new Error("Google Gemini 响应为空");
  return JSON.parse(extractJson(content)) as T;
}

export async function callLlmJson<T>(options: LlmJsonOptions): Promise<T> {
  const config = resolveConfig(options.config);
  if (!config.apiKey) throw new Error("未配置 AI API Key");
  if (config.provider === "google") return callGoogle<T>(config, options);
  return callOpenAiCompatible<T>(config, options);
}
