import { NextResponse } from "next/server";
import { createDbIdea, getDbIdeas } from "@/lib/db-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ ideas: await getDbIdeas() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { rawInput?: string };
    const rawInput = body.rawInput?.trim();
    if (!rawInput) {
      return NextResponse.json({ error: "rawInput 不能为空" }, { status: 400 });
    }

    const bundle = await createDbIdea(rawInput);
    if (!bundle) {
      return NextResponse.json({ error: "创建想法失败" }, { status: 500 });
    }
    return NextResponse.json({
      idea: bundle.idea,
      briefDocument: bundle.briefDocument,
      livingDocument: bundle.livingDocument,
      round: bundle.currentRound,
      questions: bundle.questions,
      suggestions: bundle.suggestions,
      revisions: bundle.revisions
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "创建想法失败" }, { status: 500 });
  }
}
