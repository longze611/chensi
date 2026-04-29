import { NextResponse } from "next/server";
import { deleteDbIdea } from "@/lib/db-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(_: Request, { params }: { params: { ideaId: string } }) {
  try {
    await deleteDbIdea(params.ideaId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "删除想法失败" }, { status: 500 });
  }
}
