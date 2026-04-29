import { NextResponse } from "next/server";
import { getDbWorkspace } from "@/lib/db-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: { ideaId: string } }) {
  const bundle = await getDbWorkspace(params.ideaId);
  if (!bundle) {
    return NextResponse.json({ error: "想法不存在" }, { status: 404 });
  }

  return NextResponse.json({
    idea: bundle.idea,
    briefDocument: bundle.briefDocument,
    livingDocument: bundle.livingDocument,
    currentRound: bundle.currentRound,
    questions: bundle.questions,
    suggestions: bundle.suggestions,
    revisions: bundle.revisions
  });
}
