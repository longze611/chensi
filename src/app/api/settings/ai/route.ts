import { NextResponse } from "next/server";
import { AI_PROVIDER_OPTIONS, type AiProvider } from "@/lib/ai-providers";
import { getAiSetting, saveAiSetting } from "@/lib/ai-settings-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isProvider(value: string): value is AiProvider {
  return AI_PROVIDER_OPTIONS.some((item) => item.id === value);
}

export async function GET() {
  return NextResponse.json({
    options: AI_PROVIDER_OPTIONS,
    setting: await getAiSetting()
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { provider?: string; model?: string; apiKey?: string; baseUrl?: string };
    if (!body.provider || !isProvider(body.provider)) {
      return NextResponse.json({ error: "不支持的 AI Provider" }, { status: 400 });
    }
    if (!body.apiKey?.trim()) {
      return NextResponse.json({ error: "API Key 不能为空" }, { status: 400 });
    }

    const setting = await saveAiSetting({
      provider: body.provider,
      model: body.model ?? "",
      apiKey: body.apiKey,
      baseUrl: body.baseUrl
    });

    return NextResponse.json({ setting });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "保存 AI 设置失败" }, { status: 500 });
  }
}
