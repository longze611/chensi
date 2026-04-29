import { NextResponse } from "next/server";
import { updateDbDocument } from "@/lib/db-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: { ideaId: string; documentId: string } }) {
  try {
    const body = await request.json() as { contentMarkdown?: string; contentJson?: unknown };
    if (typeof body.contentMarkdown !== "string") {
      return NextResponse.json({ error: "contentMarkdown 不能为空" }, { status: 400 });
    }

    const document = await updateDbDocument(params.ideaId, params.documentId, {
      contentMarkdown: body.contentMarkdown,
      contentJson: body.contentJson
    });

    if (!document) {
      return NextResponse.json({ error: "文档不存在" }, { status: 404 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "保存文档失败" }, { status: 500 });
  }
}
