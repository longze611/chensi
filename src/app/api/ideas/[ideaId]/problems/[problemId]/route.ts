import { NextResponse } from "next/server";
import { deleteDbProblem, updateDbProblem } from "@/lib/db-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: { ideaId: string; problemId: string } }) {
  try {
    const body = await request.json();
    const problem = await updateDbProblem(params.ideaId, params.problemId, body);
    if (!problem) return NextResponse.json({ error: "问题不存在" }, { status: 404 });
    return NextResponse.json({ problem });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "更新问题失败" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { ideaId: string; problemId: string } }) {
  try {
    await deleteDbProblem(params.ideaId, params.problemId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "删除问题失败" }, { status: 500 });
  }
}
