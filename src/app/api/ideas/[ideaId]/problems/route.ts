import { NextResponse } from "next/server";
import { createDbProblem, listDbProblems } from "@/lib/db-store";
import type { Priority } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parsePriority(value: unknown): Priority {
  return value === "high" || value === "low" ? value : "medium";
}

export async function GET(_: Request, { params }: { params: { ideaId: string } }) {
  return NextResponse.json({ problems: await listDbProblems(params.ideaId) });
}

export async function POST(request: Request, { params }: { params: { ideaId: string } }) {
  try {
    const body = await request.json() as { content?: string; priority?: Priority; difficulty?: number };
    if (!body.content?.trim()) return NextResponse.json({ error: "问题内容不能为空" }, { status: 400 });
    const problem = await createDbProblem(params.ideaId, {
      content: body.content.trim(),
      priority: parsePriority(body.priority),
      difficulty: body.difficulty,
      source: "user"
    });
    return NextResponse.json({ problem });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "创建问题失败" }, { status: 500 });
  }
}
