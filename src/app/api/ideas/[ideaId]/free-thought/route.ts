import { NextResponse } from "next/server";
import { getDbWorkspace, submitDbRound } from "@/lib/db-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { ideaId: string } }) {
  try {
    const body = await request.json() as { content?: string };
    const content = body.content?.trim();
    if (!content) {
      return NextResponse.json({ error: "content 不能为空" }, { status: 400 });
    }

    const current = await getDbWorkspace(params.ideaId);
    if (!current?.currentRound) {
      return NextResponse.json({ error: "当前想法没有可提交的迭代轮次" }, { status: 404 });
    }

    const bundle = await submitDbRound(params.ideaId, current.currentRound.id, {
      answers: {},
      ignoredQuestions: [],
      adoptedSuggestions: [],
      ignoredSuggestions: [],
      freeThought: content
    });

    return NextResponse.json({
      idea: bundle?.idea,
      updatedBriefDocument: bundle?.briefDocument,
      updatedLivingDocument: bundle?.livingDocument,
      nextRound: bundle?.currentRound,
      nextQuestions: bundle?.questions,
      nextSuggestions: bundle?.suggestions
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "补充想法失败" }, { status: 500 });
  }
}
