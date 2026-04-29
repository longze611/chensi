import { NextResponse } from "next/server";
import { reorderDbProblems } from "@/lib/db-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { ideaId: string } }) {
  try {
    const body = await request.json() as { orderedIds?: string[] };
    if (!Array.isArray(body.orderedIds)) return NextResponse.json({ error: "orderedIds 必须是数组" }, { status: 400 });
    const problems = await reorderDbProblems(params.ideaId, body.orderedIds);
    return NextResponse.json({ problems });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "排序失败" }, { status: 500 });
  }
}
