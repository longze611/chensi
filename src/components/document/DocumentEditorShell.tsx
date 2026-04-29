"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

import { blocksToMarkdown, markdownToBlocks, type Block } from "@blocknote/core";
import { zh } from "@blocknote/core/locales";
import { BlockNoteView } from "@blocknote/mantine";
import { BasicTextStyleButton, BlockTypeSelect, ColorStyleButton, CreateLinkButton, FormattingToolbar, FormattingToolbarController, SideMenuController, TextAlignButton, useCreateBlockNote } from "@blocknote/react";
import { BookOpen, Download, FileText, ListTree, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { IdeaDocument } from "@/lib/types";

type SaveState = "idle" | "saving" | "saved" | "error";

type DocumentEditorShellProps = {
  document: IdeaDocument;
  onClose: () => void;
  onSaved?: (document: IdeaDocument) => void;
};

type HeadingItem = {
  id: string;
  text: string;
  level: number;
};

function isBlockArray(value: unknown): value is Block[] {
  return Array.isArray(value) && value.every((item) => typeof item === "object" && item !== null && "type" in item);
}

function inlineText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.map((item) => {
    if (typeof item === "string") return item;
    if (typeof item === "object" && item && "text" in item && typeof item.text === "string") return item.text;
    return "";
  }).join("").trim();
}

function extractHeadings(blocks: Block[]): HeadingItem[] {
  return blocks.flatMap((block) => {
    const own = block.type === "heading" ? [{ id: block.id, text: inlineText(block.content) || "未命名标题", level: Number(block.props?.level ?? 1) }] : [];
    const children = Array.isArray(block.children) ? extractHeadings(block.children as Block[]) : [];
    return [...own, ...children];
  });
}

function SelectionFormattingToolbar() {
  return (
    <FormattingToolbar>
      <BlockTypeSelect />
      <TextAlignButton textAlignment="left" />
      <TextAlignButton textAlignment="center" />
      <TextAlignButton textAlignment="right" />
      <BasicTextStyleButton basicTextStyle="bold" />
      <BasicTextStyleButton basicTextStyle="italic" />
      <BasicTextStyleButton basicTextStyle="underline" />
      <BasicTextStyleButton basicTextStyle="strike" />
      <BasicTextStyleButton basicTextStyle="code" />
      <CreateLinkButton />
      <ColorStyleButton />
    </FormattingToolbar>
  );
}

export function DocumentEditorShell({ document, onClose, onSaved }: DocumentEditorShellProps) {
  const initialContent = useMemo(() => isBlockArray(document.contentJson) ? document.contentJson : undefined, [document.contentJson]);
  const editor = useCreateBlockNote({ initialContent, setIdAttribute: true, dictionary: zh }, [document.id]);
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string>("");
  const [isTocOpen, setIsTocOpen] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipInitialChange = useRef(true);

  useEffect(() => {
    skipInitialChange.current = true;
    setHeadings(extractHeadings(editor.document as Block[]));
    if (!initialContent && document.contentMarkdown.trim()) {
      const blocks = markdownToBlocks(document.contentMarkdown, editor.pmSchema);
      editor.replaceBlocks(editor.document, blocks as never);
      setHeadings(extractHeadings(editor.document as Block[]));
    }
  }, [document.id, document.contentMarkdown, editor, initialContent]);

  async function serialize() {
    const blocks = editor.document as Block[];
    const markdown = blocksToMarkdown(blocks as never, editor.pmSchema, editor, { document: window.document });
    return { blocks, markdown };
  }

  async function saveNow() {
    setSaveState("saving");
    try {
      const { blocks, markdown } = await serialize();
      const response = await fetch(`/api/ideas/${document.ideaId}/documents/${document.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentMarkdown: markdown, contentJson: blocks })
      });
      const payload = await response.json() as { document?: IdeaDocument; error?: string };
      if (!response.ok || !payload.document) throw new Error(payload.error ?? "保存失败");
      onSaved?.(payload.document);
      setSaveState("saved");
      setLastSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch {
      setSaveState("error");
    }
  }

  function scheduleSave() {
    if (skipInitialChange.current) {
      skipInitialChange.current = false;
      return;
    }
    setHeadings(extractHeadings(editor.document as Block[]));
    setSaveState("idle");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { void saveNow(); }, 900);
  }

  async function exportMarkdown() {
    const { markdown } = await serialize();
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = `${document.title || "document"}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#F7F8FA] text-[#1F2329]">
      <header className="flex h-16 items-center justify-between border-b border-[#E5E7EB] bg-white px-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsTocOpen((value) => !value)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#646A73] hover:bg-[#F7F8FA]" aria-label={isTocOpen ? "收起目录" : "展开目录"}>
            {isTocOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
          </button>
          <FileText className="text-[#3370FF]" />
          <div>
            <h2 className="text-lg font-semibold">{document.title}</h2>
            <p className="text-xs text-[#8F959E]">
              {saveState === "saving" ? "保存中" : saveState === "saved" ? `已保存 ${lastSavedAt}` : saveState === "error" ? "保存失败" : "自动保存已开启"} · v{document.version}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => void exportMarkdown()} className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#646A73] hover:bg-[#F7F8FA]"><Download size={15} /> 导出 Markdown</button>
          <button onClick={onClose} className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#646A73] hover:bg-[#F7F8FA]"><X size={15} /> 关闭</button>
        </div>
      </header>
      <div className={isTocOpen ? "grid h-[calc(100vh-4rem)] grid-cols-[280px_minmax(0,1fr)]" : "grid h-[calc(100vh-4rem)] grid-cols-[0_minmax(0,1fr)]"}>
        <aside className="overflow-hidden border-r border-[#E5E7EB] bg-white transition-[width] duration-200">
          <div className="w-[280px] p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-[#1F2329]"><ListTree size={16} /> 目录</div>
              <button onClick={() => setIsTocOpen(false)} className="rounded-md p-1 text-[#8F959E] hover:bg-[#F7F8FA] hover:text-[#646A73]" aria-label="收起目录"><PanelLeftClose size={15} /></button>
            </div>
            {headings.length ? <div className="space-y-0.5">{headings.map((heading) => <button key={heading.id} onClick={() => { editor.setTextCursorPosition(heading.id, "start"); editor.focus(); }} className="group flex w-full items-center gap-2 truncate rounded-md py-1.5 pr-2 text-left text-sm text-[#646A73] hover:bg-[#F7F8FA] hover:text-[#1F2329]" style={{ paddingLeft: 8 + (heading.level - 1) * 14 }}><span className="h-1 w-1 shrink-0 rounded-full bg-[#C9CDD4] group-hover:bg-[#3370FF]" /><span className="truncate">{heading.text}</span></button>)}</div> : <p className="rounded-lg bg-[#F7F8FA] p-3 text-sm leading-6 text-[#8F959E]">使用 H1/H2/H3 标题后，这里会自动生成目录。</p>}
          </div>
        </aside>
        <main className="relative overflow-y-auto px-8 py-8">
          {!isTocOpen && <button onClick={() => setIsTocOpen(true)} className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#646A73] shadow-sm hover:bg-[#F7F8FA]"><BookOpen size={15} /> 目录</button>}
          <div className="mx-auto max-w-4xl rounded-2xl border border-[#E5E7EB] bg-white px-10 py-8">
            <BlockNoteView editor={editor} onChange={scheduleSave} theme="light" formattingToolbar={false} sideMenu={false}>
              <FormattingToolbarController formattingToolbar={SelectionFormattingToolbar} floatingUIOptions={{ elementProps: { style: { zIndex: 1000 } } }} />
              <SideMenuController floatingUIOptions={{ elementProps: { style: { zIndex: 1000 } } }} />
            </BlockNoteView>
          </div>
        </main>
      </div>
    </div>
  );
}
