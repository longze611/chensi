import { prisma } from "./prisma";
import { getProviderOption, type AiProvider, type AiSettingInput, type AiSettingPublic } from "./ai-providers";

const LOCAL_USER_ID = "local-user";

function normalizeProvider(value: string): AiProvider {
  if (["openai", "deepseek", "zhipu", "kimi", "google"].includes(value)) return value as AiProvider;
  return "openai";
}

export async function getAiSetting(userId = LOCAL_USER_ID): Promise<AiSettingPublic | null> {
  const row = await prisma.aiSetting.findUnique({ where: { userId } });
  if (!row) return null;
  return {
    provider: normalizeProvider(row.provider),
    model: row.model,
    baseUrl: row.baseUrl ?? undefined,
    hasApiKey: Boolean(row.apiKey)
  };
}

export async function getAiSettingForRuntime(userId = LOCAL_USER_ID) {
  const row = await prisma.aiSetting.findUnique({ where: { userId } });
  if (!row?.apiKey) return null;
  return {
    provider: normalizeProvider(row.provider),
    model: row.model,
    apiKey: row.apiKey,
    baseUrl: row.baseUrl ?? getProviderOption(normalizeProvider(row.provider)).defaultBaseUrl
  };
}

export async function saveAiSetting(input: AiSettingInput, userId = LOCAL_USER_ID): Promise<AiSettingPublic> {
  const provider = normalizeProvider(input.provider);
  const option = getProviderOption(provider);
  const model = input.model.trim() || option.defaultModel;
  const apiKey = input.apiKey.trim();
  const baseUrl = (input.baseUrl?.trim() || option.defaultBaseUrl).replace(/\/$/, "");

  const row = await prisma.aiSetting.upsert({
    where: { userId },
    create: { userId, provider, model, apiKey, baseUrl },
    update: { provider, model, apiKey, baseUrl }
  });

  return {
    provider: normalizeProvider(row.provider),
    model: row.model,
    baseUrl: row.baseUrl ?? undefined,
    hasApiKey: Boolean(row.apiKey)
  };
}
