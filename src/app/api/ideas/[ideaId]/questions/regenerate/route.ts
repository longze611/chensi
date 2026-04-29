import { NextResponse } from "next/server";
import { getDbWorkspace } from "@/lib/db-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { ideaId: string } }) {
  const body = await request.json().catch(() => ({})) as { instruction?: string };
  const bundle = await getDbWorkspace(params.ideaId);
  if (!bundle) {
    return NextResponse.json({ error: "想法不存在" }, { status: 404 });
  }

  return NextResponse.json({
    instruction: body.instruction ?? "",
    round: bundle.currentRound,
    questions: bundle.questions,
    suggestions: bundle.suggestions,
    notice: "当前 MVP 会返回当前问题清单；接入真实 QuestionGenerationAgent 后可按指令重新生成。"
  });
}
