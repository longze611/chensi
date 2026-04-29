export type AiProvider = "openai" | "deepseek" | "zhipu" | "kimi" | "google";

export interface AiProviderOption {
  id: AiProvider;
  name: string;
  defaultModel: string;
  defaultBaseUrl: string;
  apiKeyPlaceholder: string;
}

export interface AiSettingInput {
  provider: AiProvider;
  model: string;
  apiKey: string;
  baseUrl?: string;
}

export interface AiSettingPublic {
  provider: AiProvider;
  model: string;
  baseUrl?: string;
  hasApiKey: boolean;
}

export const AI_PROVIDER_OPTIONS: AiProviderOption[] = [
  { id: "openai", name: "OpenAI", defaultModel: "gpt-4o-mini", defaultBaseUrl: "https://api.openai.com/v1", apiKeyPlaceholder: "sk-..." },
  { id: "deepseek", name: "DeepSeek", defaultModel: "deepseek-chat", defaultBaseUrl: "https://api.deepseek.com/v1", apiKeyPlaceholder: "sk-..." },
  { id: "zhipu", name: "智谱 GLM", defaultModel: "glm-4-flash", defaultBaseUrl: "https://open.bigmodel.cn/api/paas/v4", apiKeyPlaceholder: "请输入智谱 API Key" },
  { id: "kimi", name: "Kimi / Moonshot", defaultModel: "moonshot-v1-8k", defaultBaseUrl: "https://api.moonshot.cn/v1", apiKeyPlaceholder: "sk-..." },
  { id: "google", name: "Google Gemini", defaultModel: "gemini-1.5-flash", defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta", apiKeyPlaceholder: "AIza..." }
];

export function getProviderOption(provider: AiProvider) {
  return AI_PROVIDER_OPTIONS.find((item) => item.id === provider) ?? AI_PROVIDER_OPTIONS[0];
}
