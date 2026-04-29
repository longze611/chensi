import { NextResponse } from "next/server";
import { submitDbRound } from "@/lib/db-store";
import type { RoundDraftState } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface SubmitBody {
  questionResponses?: Array<{ questionId: string; status: "answered" | "ignored"; answer?: string }>;
  suggestionResponses?: Array<{ suggestionId: string; status: "adopted" | "ignored" }>;
  freeThought?: string;
}

function normalizeDraft(body: SubmitBody): RoundDraftState {
  return {
    answers: Object.fromEntries((body.questionResponses ?? []).filter((item) => item.status === "answered").map((item) => [item.questionId, item.answer ?? ""])),
    ignoredQuestions: (body.questionResponses ?? []).filter((item) => item.status === "ignored").map((item) => item.questionId),
    adoptedSuggestions: (body.suggestionResponses ?? []).filter((item) => item.status === "adopted").map((item) => item.suggestionId),
    ignoredSuggestions: (body.suggestionResponses ?? []).filter((item) => item.status === "ignored").map((item) => item.suggestionId),
    freeThought: body.freeThought ?? ""
  };
}

export async function POST(request: Request, { params }: { params: { ideaId: string; roundId: string } }) {
  try {
    const body = await request.json() as SubmitBody;
    const bundle = await submitDbRound(params.ideaId, params.roundId, normalizeDraft(body));
    if (!bundle) {
      return NextResponse.json({ error: "想法或迭代轮次不存在" }, { status: 404 });
    }

    return NextResponse.json({
      updatedBriefDocument: bundle.briefDocument,
      updatedLivingDocument: bundle.livingDocument,
      changeSummary: bundle.currentRound?.summaryBefore,
      nextRound: bundle.currentRound,
      nextQuestions: bundle.questions,
      nextSuggestions: bundle.suggestions,
      idea: bundle.idea,
      revisions: bundle.revisions
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "提交反馈失败" }, { status: 500 });
  }
}
