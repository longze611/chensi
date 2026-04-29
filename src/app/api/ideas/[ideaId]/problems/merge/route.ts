import { NextResponse } from "next/server";
import { mergeDbProblems } from "@/lib/db-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { ideaId: string } }) {
  try {
    const body = await request.json() as { sourceId?: string; targetId?: string };
    if (!body.sourceId || !body.targetId) return NextResponse.json({ error: "sourceId 和 targetId 不能为空" }, { status: 400 });
    const problems = await mergeDbProblems(params.ideaId, body.sourceId, body.targetId);
    if (!problems) return NextResponse.json({ error: "待合并问题不存在" }, { status: 404 });
    return NextResponse.json({ problems });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "合并失败" }, { status: 500 });
  }
}
