"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Check, ChevronDown, ChevronUp, FileQuestion, FileText, Lightbulb, MessageSquareText, PenLine, Plus, Send, Settings, Sparkles, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createEmptyWorkspace, getActiveBundle, saveWorkspace } from "@/lib/thinking";
import type { IdeaDocument, Priority, ProblemItem, RoundDraftState, ThinkingWorkspace } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";
import { DocumentEditorShell } from "@/components/document/DocumentEditorShell";

type CreateIdeaResponse = {
  idea: ThinkingWorkspace["ideas"][number];
  briefDocument: IdeaDocument;
  livingDocument: IdeaDocument;
  round: NonNullable<ReturnType<typeof getActiveBundle>>["currentRound"];
  questions: NonNullable<ReturnType<typeof getActiveBundle>>["questions"];
  suggestions: NonNullable<ReturnType<typeof getActiveBundle>>["suggestions"];
  revisions: NonNullable<ReturnType<typeof getActiveBundle>>["revisions"];
};

type ActiveBundle = NonNullable<ReturnType<typeof getActiveBundle>>;

type AiProviderOption = { id: string; name: string; defaultModel: string; defaultBaseUrl: string; apiKeyPlaceholder: string };
type AiSettingPublic = { provider: string; model: string; baseUrl?: string; hasApiKey: boolean };

type AiSettingsResponse = { options: AiProviderOption[]; setting: AiSettingPublic | null };

type IdeasResponse = { ideas: ThinkingWorkspace["ideas"] };
type ProblemsResponse = { problems: ProblemItem[] };
type AgentProgressState = { active: boolean; percent: number; label: string; detail: string };
type Language = "zh" | "en";

type WorkspaceResponse = {
  idea: ThinkingWorkspace["ideas"][number];
  briefDocument: IdeaDocument;
  livingDocument: IdeaDocument;
  currentRound: NonNullable<ReturnType<typeof getActiveBundle>>["currentRound"];
  questions: NonNullable<ReturnType<typeof getActiveBundle>>["questions"];
  suggestions: NonNullable<ReturnType<typeof getActiveBundle>>["suggestions"];
  revisions: NonNullable<ReturnType<typeof getActiveBundle>>["revisions"];
};

type SubmitRoundResponse = {
  idea: ThinkingWorkspace["ideas"][number];
  updatedBriefDocument: IdeaDocument;
  updatedLivingDocument: IdeaDocument;
  changeSummary?: string;
  nextRound: NonNullable<ReturnType<typeof getActiveBundle>>["currentRound"];
  nextQuestions: NonNullable<ReturnType<typeof getActiveBundle>>["questions"];
  nextSuggestions: NonNullable<ReturnType<typeof getActiveBundle>>["suggestions"];
  revisions: NonNullable<ReturnType<typeof getActiveBundle>>["revisions"];
};

function workspaceFromCreateResponse(response: CreateIdeaResponse): ThinkingWorkspace {
  if (!response.round) return createEmptyWorkspace();
  return {
    ideas: [response.idea],
    activeIdeaId: response.idea.id,
    documents: { [response.idea.id]: [response.briefDocument, response.livingDocument] },
    rounds: { [response.idea.id]: [response.round] },
    questions: { [response.round.id]: response.questions },
    suggestions: { [response.round.id]: response.suggestions },
    revisions: { [response.idea.id]: response.revisions },
    lastChangeSummary: "已通过 API 生成初始文档、第一轮问题和建议。"
  };
}

function workspaceFromWorkspaceResponse(previous: ThinkingWorkspace, response: WorkspaceResponse): ThinkingWorkspace {
  if (!response.currentRound) return { ...previous, activeIdeaId: response.idea.id };
  const ideas = previous.ideas.some((idea) => idea.id === response.idea.id)
    ? previous.ideas.map((idea) => idea.id === response.idea.id ? response.idea : idea)
    : [response.idea, ...previous.ideas];
  return {
    ...previous,
    ideas,
    activeIdeaId: response.idea.id,
    documents: { ...previous.documents, [response.idea.id]: [response.briefDocument, response.livingDocument] },
    rounds: { ...previous.rounds, [response.idea.id]: [response.currentRound] },
    questions: { ...previous.questions, [response.currentRound.id]: response.questions },
    suggestions: { ...previous.suggestions, [response.currentRound.id]: response.suggestions },
    revisions: { ...previous.revisions, [response.idea.id]: response.revisions }
  };
}

function workspaceFromSubmitResponse(previous: ThinkingWorkspace, response: SubmitRoundResponse): ThinkingWorkspace {
  if (!response.nextRound) return previous;
  return {
    ...previous,
    ideas: previous.ideas.map((idea) => idea.id === response.idea.id ? response.idea : idea),
    activeIdeaId: response.idea.id,
    documents: { ...previous.documents, [response.idea.id]: [response.updatedBriefDocument, response.updatedLivingDocument] },
    rounds: { ...previous.rounds, [response.idea.id]: [response.nextRound] },
    questions: { ...previous.questions, [response.nextRound.id]: response.nextQuestions },
    suggestions: { ...previous.suggestions, [response.nextRound.id]: response.nextSuggestions },
    revisions: { ...previous.revisions, [response.idea.id]: response.revisions },
    lastChangeSummary: response.changeSummary ?? "本轮反馈已提交并生成下一轮启发内容。"
  };
}

function markdownToBlocks(markdown: string) {
  return markdown.split("\n").filter(Boolean).map((line, index) => {
    if (line.startsWith("# ")) return <h1 key={index}>{line.replace(/^# /, "")}</h1>;
    if (line.startsWith("## ")) return <h2 key={index}>{line.replace(/^## /, "")}</h2>;
    if (line.startsWith("### ")) return <h3 key={index}>{line.replace(/^### /, "")}</h3>;
    if (line.startsWith("- ")) return <li key={index}>{line.replace(/^- /, "")}</li>;
    return <p key={index}>{line}</p>;
  });
}

const emptyDraft: RoundDraftState = { answers: {}, ignoredQuestions: [], adoptedSuggestions: [], ignoredSuggestions: [], freeThought: "" };

const UI = {
  zh: {
    brand: "沉思",
    tagline: "想法迭代工作台",
    guide: "操作说明",
    settings: "模型设置",
    ideas: "想法",
    brief: "概要文档",
    living: "详细文档",
    problem: "问题文档",
    briefDesc: "记录当前想法的核心范围、目标和关键判断。",
    livingDesc: "沉淀完整背景、结构、决策和后续迭代内容。",
    problemDesc: "维护当前想法中更方向性的关键问题，Agent 后续会优先围绕高优先级未解决问题迭代。",
    problemCount: (count: number) => `${count} 个问题`,
    currentRound: "待处理",
    phase: "阶段",
    questions: "问题",
    suggestions: "建议",
    answerPlaceholder: "输入回答",
    why: "为什么问：",
    ignore: "忽略",
    adopt: "采纳",
    impact: "影响：",
    emptyIdea: "创建第一个想法",
    emptyIdeaDesc: "在底部输入框写下一个原始想法，系统会生成概要文档、详细文档和第一轮问题建议。",
    noIdeaHint: "还没有想法。请先在底部输入框写下一个原始想法。",
    supplement: "补充说明",
    createIdea: "创建想法",
    composerExisting: "补充本轮说明，或直接提交当前反馈",
    composerNew: "输入一个原始想法，例如：我想写一个星际文明战争小说……",
    processing: "处理中",
    submit: "提交",
    create: "创建",
    recentUpdate: "最近更新：",
    langToggle: "EN",
    iteration: "迭代轮次",
    roundPrefix: "第",
    roundSuffix: "轮",
    idleTitle: "等待第一个想法",
    idleDetail: "空闲状态：提交想法或本轮反馈后，会显示多 Agent 分析进度。",
    progress: "分析进度",
    agentStatus: "Agent 状态",
    steps: ["想法整理", "文档生成", "问题拆解", "建议生成", "结果写入"]
  },
  en: {
    brand: "Chensi",
    tagline: "Idea iteration workspace",
    guide: "Guide",
    settings: "Model Settings",
    ideas: "Ideas",
    brief: "Brief Document",
    living: "Living Document",
    problem: "Problem Document",
    briefDesc: "Capture the current idea's scope, goal, and key assumptions.",
    livingDesc: "Preserve the full background, structure, decisions, and future iterations.",
    problemDesc: "Track higher-level directional problems; Agents prioritize unresolved high-priority ones.",
    problemCount: (count: number) => `${count} problems`,
    currentRound: "To Process",
    phase: "Phase",
    questions: "Questions",
    suggestions: "Suggestions",
    answerPlaceholder: "Write an answer",
    why: "Why it matters: ",
    ignore: "Ignore",
    adopt: "Adopt",
    impact: "Impact: ",
    emptyIdea: "Create your first idea",
    emptyIdeaDesc: "Write a raw idea in the bottom composer. The system will generate documents and the first round of prompts.",
    noIdeaHint: "No idea yet. Write a raw idea in the bottom composer to begin.",
    supplement: "Supplement",
    createIdea: "Create Idea",
    composerExisting: "Add context for this round, or submit the current feedback",
    composerNew: "Enter a raw idea, for example: I want to write a space civilization war novel...",
    processing: "Processing",
    submit: "Submit",
    create: "Create",
    recentUpdate: "Recent update: ",
    langToggle: "中文",
    iteration: "Iteration",
    roundPrefix: "Round ",
    roundSuffix: "",
    idleTitle: "Waiting for the first idea",
    idleDetail: "Idle: after submitting an idea or feedback, multi-agent analysis progress will appear here.",
    progress: "Analysis progress",
    agentStatus: "Agent status",
    steps: ["Idea", "Docs", "Problems", "Suggestions", "Write"]
  }
} as const;

function DocumentFolder({ document, onOpen, language }: { document: IdeaDocument; onOpen: () => void; language: Language }) {
  const copy = UI[language];
  const isBrief = document.type === "brief";
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.995 }}
      onClick={onOpen}
      className="group relative mx-auto flex h-[136px] w-full max-w-xl rounded-2xl border border-[#E5E7EB] bg-white p-5 text-left transition hover:border-[#BFC7D2] hover:bg-[#FAFBFC]"
    >
      <div className="flex w-full items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#DDE3EA] bg-[#F5F7FA] text-[#3370FF]">
          <FileText size={24} />
        </div>
        <div className="min-w-0 flex-1 self-stretch">
          <div className="mb-1 flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8F959E]">{isBrief ? "Brief Document" : "Living Document"}</p>
            <span className="rounded-md border border-[#E5E7EB] bg-white px-2 py-0.5 text-xs text-[#646A73]">v{document.version}</span>
          </div>
          <h3 className="text-xl font-semibold text-[#1F2329]">{isBrief ? copy.brief : copy.living}</h3>
          <p className="mt-2 line-clamp-1 text-sm leading-6 text-[#646A73]">
            {isBrief ? copy.briefDesc : copy.livingDesc}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

function ProblemDocumentCard({ onOpen, count, language }: { onOpen: () => void; count: number; language: Language }) {
  const copy = UI[language];
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.995 }}
      onClick={onOpen}
      className="group relative mx-auto flex h-[136px] w-full max-w-xl rounded-2xl border border-[#E5E7EB] bg-white p-5 text-left transition hover:border-[#BFC7D2] hover:bg-[#FAFBFC]"
    >
      <div className="flex w-full items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#DDE3EA] bg-[#F5F7FA] text-[#3370FF]">
          <FileQuestion size={24} />
        </div>
        <div className="min-w-0 flex-1 self-stretch">
          <div className="mb-1 flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8F959E]">Problem Document</p>
            <span className="rounded-md border border-[#E5E7EB] bg-white px-2 py-0.5 text-xs text-[#646A73]">{copy.problemCount(count)}</span>
          </div>
          <h3 className="text-xl font-semibold text-[#1F2329]">{copy.problem}</h3>
          <p className="mt-2 line-clamp-1 text-sm leading-6 text-[#646A73]">{copy.problemDesc}</p>
        </div>
      </div>
    </motion.button>
  );
}

function ManualCard({ onOpen }: { onOpen: () => void }) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.995 }}
      onClick={onOpen}
      className="group relative mx-auto flex h-[136px] w-full max-w-xl rounded-2xl border border-[#E5E7EB] bg-white p-5 text-left transition hover:border-[#BFC7D2] hover:bg-[#FAFBFC]"
    >
      <div className="flex w-full items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#DDE3EA] bg-[#F5F7FA] text-[#3370FF]">
          <BookOpen size={24} />
        </div>
        <div className="min-w-0 flex-1 self-stretch">
          <div className="mb-1 flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8F959E]">User Guide</p>
            <span className="rounded-md border border-[#E5E7EB] bg-white px-2 py-0.5 text-xs text-[#646A73]">Guide</span>
          </div>
          <h3 className="text-xl font-semibold text-[#1F2329]">操作说明文档</h3>
          <p className="mt-2 line-clamp-1 text-sm leading-6 text-[#646A73]">查看平台从创建想法、阅读文档、处理问题建议到提交迭代的完整使用说明。</p>
        </div>
      </div>
    </motion.button>
  );
}

function ManualEditor({ onClose, language }: { onClose: () => void; language: Language }) {
  const copy = UI[language];
  const sections = language === "zh" ? [
    { title: "1. 平台创建目标", body: "沉思 的目标不是替用户直接产出最终方案，而是把模糊想法逐轮变清楚。平台会把原始想法沉淀为概要文档、详细文档、问题文档、待处理问题和建议，让用户始终知道当前想法已经明确了什么、仍然卡在哪里、下一轮最值得澄清什么。" },
    { title: "2. 多 Agent 协作机制", body: "平台内部由多个 Agent 分工协作：IdeaRefinementAgent 负责轻整理原始想法；DocumentInitializationAgent 负责生成初始文档；AmbiguityAnalysisAgent 识别模糊点；ProblemDecompositionAgent 拆解方向性问题；QuestionGenerationAgent 生成具体待处理问题；SuggestionGenerationAgent 提出可采纳建议；UserFeedbackIntegratorAgent 整合用户反馈；DocumentUpdateAgent 更新文档；PhaseDecisionAgent 判断下一轮阶段；QualityReviewAgent 做质量检查。" },
    { title: "3. 第一次进入平台怎么开始", body: "新用户进入后，先在底部输入框写下一个真实但可以很粗糙的想法，例如一个产品、论文、小说、业务策略或学习计划。点击创建后，系统会自动生成概要文档、详细文档、第一轮待处理问题和建议。不要一开始追求完整，越真实越适合迭代。" },
    { title: "4. 阅读概要文档和详细文档", body: "概要文档用于快速把握想法核心，适合判断方向是否偏离；详细文档用于沉淀背景、概念、结构、决策和迭代记录。点击文档卡片后会进入块编辑器，可以像飞书文档一样编辑文字块、使用侧边块菜单、选中文字后使用悬浮格式菜单。" },
    { title: "5. 使用问题文档", body: "问题文档记录的是方向性问题，它比右侧待处理问题更宽泛。例如“核心用户是谁”“这个产品的核心价值是什么”。每个问题可以设置优先级、困难度、是否解决。高优先级且未解决的问题会影响后续 Agent 的分析重点。已解决问题默认不会参与下一轮迭代。" },
    { title: "6. 处理右侧待处理问题", body: "右侧待处理问题是更具体的问题，用来向用户索取当前轮次需要的信息。你可以回答，也可以忽略。已回答的问题会被写入下一轮上下文；忽略的问题不会被强行写成事实。" },
    { title: "7. 处理建议", body: "建议不是结论，而是 Agent 给出的可能推进方向。你可以采纳或忽略。采纳表示这个方向可以进入下一轮文档更新；忽略表示暂时不采用，Agent 后续会减少围绕该方向展开。" },
    { title: "8. 提交迭代", body: "当你回答了问题、采纳或忽略建议，并在底部补充说明后，点击提交。系统会启动多 Agent 分析：整合反馈、更新文档、拆解方向性问题、生成下一轮待处理问题和建议，并将结果保存到数据库。页面中上部会显示当前分析进度。" },
    { title: "9. 模型设置", body: "右上角模型设置可以配置 OpenAI、DeepSeek、智谱、Kimi、Google Gemini 等服务。填写模型、Base URL 和 API Key 后，后续创建想法和提交迭代会使用对应模型。未配置时系统会使用本地 fallback 规则生成基础结果。" },
    { title: "10. 推荐工作流", body: "推荐流程：先创建粗糙想法；阅读概要和详细文档；打开问题文档确认方向性问题；回答右侧最关键的待处理问题；采纳少数有价值建议；在底部补充你的新判断；提交进入下一轮。每轮只需要推进一点点，不需要一次解决所有问题。" }
  ] : [
    { title: "1. Platform Goal", body: "Chensi is designed to clarify rough ideas through iterative thinking. It does not replace the user with a final answer; instead, it helps preserve what is known, what remains unclear, and what should be explored next." },
    { title: "2. Multi-Agent Collaboration", body: "The platform coordinates multiple Agents: refinement, document initialization, ambiguity analysis, problem decomposition, question generation, suggestion generation, feedback integration, document update, phase decision, and quality review." },
    { title: "3. First-Time Workflow", body: "Start by writing a rough but real idea in the bottom composer. After creation, the platform generates a brief document, a living document, and the first round of questions and suggestions." },
    { title: "4. Reading Documents", body: "The brief document summarizes the core direction. The living document stores richer background, structure, decisions, and iteration history. Open a card to edit the document." },
    { title: "5. Problem Document", body: "The problem document stores higher-level directional problems, such as who the core users are or what value the product should deliver. Unresolved high-priority problems guide later Agent analysis." },
    { title: "6. Processing Questions", body: "The right panel shows concrete questions for the current round. Answer useful questions or ignore irrelevant ones. Ignored questions are not written into the documents as facts." },
    { title: "7. Processing Suggestions", body: "Suggestions are possible directions, not final decisions. Adopt useful ones or ignore unsuitable ones before submitting the round." },
    { title: "8. Submitting an Iteration", body: "When you submit, the system integrates answers, adopted suggestions, and extra notes, then updates documents, decomposes problems, generates the next questions, and saves the result." },
    { title: "9. Model Settings", body: "Use Model Settings to configure OpenAI, DeepSeek, Zhipu, Kimi, or Gemini. Without a configured model, the system falls back to local rule-based output." },
    { title: "10. Recommended Workflow", body: "Create a rough idea, read both documents, inspect the problem document, answer the most important questions, adopt only useful suggestions, add extra notes, and submit the next iteration." }
  ];
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-[#F7F8FA] text-[#1F2329]"><header className="flex h-16 items-center justify-between border-b border-[#E5E7EB] bg-white px-6"><div className="flex items-center gap-3"><BookOpen className="text-[#3370FF]" /><div><h2 className="text-xl font-semibold">{copy.guide}</h2><p className="text-xs text-[#8F959E]">{language === "zh" ? "平台目标、多 Agent 协作机制和完整上手教程" : "Goals, multi-agent workflow, and onboarding guide"}</p></div></div><button onClick={onClose} className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-sm text-[#646A73] hover:bg-[#F7F8FA]">{language === "zh" ? "关闭" : "Close"}</button></header><div className="mx-auto h-[calc(100vh-4rem)] max-w-4xl overflow-y-auto px-6 py-10"><article className="rounded-2xl border border-[#E5E7EB] bg-white p-10"><section className="mb-10"><p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[#8F959E]">User Guide</p><h1 className="text-3xl font-semibold">{language === "zh" ? "沉思完整使用说明" : "Chensi Complete Guide"}</h1><p className="mt-4 leading-8 text-[#646A73]">{language === "zh" ? "这份文档帮助你理解平台为什么被创建、多个 Agent 如何协作，以及新用户从第一次进入到完成多轮迭代的完整操作路径。" : "This guide explains why the platform exists, how Agents collaborate, and how a new user can complete the full iterative workflow."}</p></section><section className="space-y-8 text-sm leading-7 text-[#646A73]">{sections.map((section) => <div key={section.title}><h2 className="mb-3 text-xl font-semibold text-[#1F2329]">{section.title}</h2><p>{section.body}</p></div>)}</section></article></div></motion.div>;
}

function priorityLabel(priority: Priority) {
  return priority === "high" ? "高" : priority === "low" ? "低" : "中";
}

function ProblemDocumentEditor({ ideaId, problems, onClose, onChange, language }: { ideaId: string; problems: ProblemItem[]; onClose: () => void; onChange: (items: ProblemItem[]) => void; language: Language }) {
  const copy = UI[language];
  const [newContent, setNewContent] = useState("");

  async function createProblem() {
    if (!newContent.trim()) return;
    const res = await fetch(`/api/ideas/${ideaId}/problems`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: newContent.trim(), priority: "medium", difficulty: 3 }) });
    const data = await res.json() as { problem?: ProblemItem };
    if (data.problem) onChange([...problems, data.problem]);
    setNewContent("");
  }

  async function patch(problem: ProblemItem, input: Partial<ProblemItem>) {
    const optimistic = problems.map((item) => item.id === problem.id ? { ...item, ...input } : item);
    onChange(optimistic);
    const res = await fetch(`/api/ideas/${ideaId}/problems/${problem.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    const data = await res.json() as { problem?: ProblemItem };
    if (data.problem) onChange(problems.map((item) => item.id === problem.id ? data.problem! : item));
  }

  async function remove(problem: ProblemItem) {
    onChange(problems.filter((item) => item.id !== problem.id));
    await fetch(`/api/ideas/${ideaId}/problems/${problem.id}`, { method: "DELETE" });
  }

  async function move(index: number, direction: -1 | 1) {
    const next = [...problems];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((item, orderIndex) => ({ ...item, orderIndex })));
    const res = await fetch(`/api/ideas/${ideaId}/problems/reorder`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderedIds: next.map((item) => item.id) }) });
    const data = await res.json() as ProblemsResponse;
    if (data.problems) onChange(data.problems);
  }

  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-[#F7F8FA] text-[#1F2329]"><header className="flex h-16 items-center justify-between border-b border-[#E5E7EB] bg-white px-6"><div className="flex items-center gap-3"><FileQuestion className="text-[#3370FF]" /><div><h2 className="text-xl font-semibold">{copy.problem}</h2><p className="text-xs text-[#8F959E]">{language === "zh" ? "方向性问题 · 高优先级未解决问题会影响后续迭代" : "Directional problems · unresolved high-priority items guide later iterations"}</p></div></div><button onClick={onClose} className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-sm text-[#646A73] hover:bg-[#F7F8FA]">{language === "zh" ? "关闭" : "Close"}</button></header><div className="mx-auto h-[calc(100vh-4rem)] max-w-5xl overflow-y-auto px-6 py-8"><div className="mb-4 rounded-2xl border border-[#E5E7EB] bg-white p-4"><textarea value={newContent} onChange={(event) => setNewContent(event.target.value)} placeholder={language === "zh" ? "新增一个方向性问题，例如：这个想法最需要先搞清楚的核心价值是什么？" : "Add a directional problem, e.g. what core value must this idea clarify first?"} className="min-h-[80px] w-full resize-none rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] p-3 text-sm outline-none focus:border-[#3370FF] focus:bg-white" /><button onClick={createProblem} disabled={!newContent.trim()} className="mt-3 rounded-lg bg-[#3370FF] px-4 py-2 text-sm font-medium text-white disabled:opacity-40">{language === "zh" ? "新增问题" : "Add Problem"}</button></div><div className="space-y-3">{problems.map((problem, index) => <div key={problem.id} className={cn("rounded-2xl border bg-white p-4", problem.isResolved ? "border-[#E5E7EB] opacity-70" : "border-[#DDE3EA]")}><div className="flex items-start gap-3"><input type="checkbox" checked={problem.isResolved} onChange={(event) => void patch(problem, { isResolved: event.target.checked })} className="mt-2 h-4 w-4" /><textarea value={problem.content} onChange={(event) => void patch(problem, { content: event.target.value })} className="min-h-[52px] flex-1 resize-none rounded-xl border border-transparent bg-[#F7F8FA] p-3 text-sm leading-6 outline-none focus:border-[#3370FF] focus:bg-white" /></div><div className="mt-3 flex flex-wrap items-center gap-2 pl-7"><label className="text-xs text-[#646A73]">{language === "zh" ? "优先级" : "Priority"} <select value={problem.priority} onChange={(event) => void patch(problem, { priority: event.target.value as Priority })} className="ml-1 rounded-lg border border-[#E5E7EB] bg-white px-2 py-1"><option value="high">{language === "zh" ? "高" : "High"}</option><option value="medium">{language === "zh" ? "中" : "Medium"}</option><option value="low">{language === "zh" ? "低" : "Low"}</option></select></label><label className="text-xs text-[#646A73]">{language === "zh" ? "困难度" : "Difficulty"} <select value={problem.difficulty} onChange={(event) => void patch(problem, { difficulty: Number(event.target.value) as ProblemItem["difficulty"] })} className="ml-1 rounded-lg border border-[#E5E7EB] bg-white px-2 py-1">{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}</select></label><span className="rounded-md bg-[#F7F8FA] px-2 py-1 text-xs text-[#646A73]">{problem.source === "agent" ? (language === "zh" ? "Agent 写入" : "Agent") : (language === "zh" ? "用户新增" : "User")}</span><span className={cn("rounded-md px-2 py-1 text-xs", problem.priority === "high" ? "bg-[#FEF2F2] text-[#D93025]" : problem.priority === "low" ? "bg-[#F7F8FA] text-[#646A73]" : "bg-[#FFF7E6] text-[#B06000]")}>{language === "zh" ? "优先级：" : "Priority: "}{language === "zh" ? priorityLabel(problem.priority) : problem.priority}</span><button onClick={() => void move(index, -1)} className="rounded-md border border-[#E5E7EB] p-1 text-[#646A73] hover:bg-[#F7F8FA]"><ChevronUp size={14} /></button><button onClick={() => void move(index, 1)} className="rounded-md border border-[#E5E7EB] p-1 text-[#646A73] hover:bg-[#F7F8FA]"><ChevronDown size={14} /></button><button onClick={() => void remove(problem)} className="ml-auto rounded-md border border-[#F6C8C8] p-1 text-[#D93025] hover:bg-[#FEF2F2]"><Trash2 size={14} /></button></div></div>)}</div>{!problems.length && <div className="rounded-2xl border border-dashed border-[#DDE3EA] bg-white p-10 text-center text-sm text-[#8F959E]">{language === "zh" ? "暂无方向性问题。你可以新增问题，或在下一轮迭代后由 Agent 自动写入。" : "No directional problems yet. Add one manually, or let Agents write them after the next iteration."}</div>}</div></motion.div>;
}

function RoundProgress({ bundle, progress, language }: { bundle: ActiveBundle | null; progress: AgentProgressState; language: Language }) {
  const copy = UI[language];
  const steps = copy.steps;
  return <div className="mx-auto w-full max-w-2xl rounded-2xl border border-[#E5E7EB] bg-white p-5"><div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8F959E]">Multi-Agent Progress</p><h2 className="mt-1 text-2xl font-semibold text-[#1F2329]">{progress.active ? progress.label : bundle?.idea.title ?? copy.idleTitle}</h2><p className="mt-1 text-sm text-[#646A73]">{progress.active ? progress.detail : copy.idleDetail}</p></div><div className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] px-4 py-2 text-right"><p className="text-xs text-[#8F959E]">{copy.iteration}</p><p className="text-lg font-semibold text-[#1F2329]">{copy.roundPrefix}{bundle?.idea.iterationCount ?? 0}{copy.roundSuffix}</p></div></div><div className="mb-2 flex items-center justify-between text-xs text-[#646A73]"><span>{progress.active ? copy.progress : copy.agentStatus}</span><span>{progress.percent}%</span></div><div className="h-2 overflow-hidden rounded-full bg-[#EEF1F5]"><motion.div initial={{ width: 0 }} animate={{ width: `${progress.percent}%` }} transition={{ duration: 0.35 }} className="h-full rounded-full bg-[#3370FF]" /></div><div className="mt-3 grid grid-cols-5 gap-1 text-[11px] text-[#8F959E]">{steps.map((step, index) => <span key={step} className={cn("truncate rounded-md px-1.5 py-1 text-center", progress.percent >= (index + 1) * 20 ? "bg-[#F0F5FF] text-[#3370FF]" : "bg-[#F7F8FA]")}>{step}</span>)}</div></div>;
}

function DocumentEditor({ document, onClose }: { document: IdeaDocument; onClose: () => void }) {
  const [content, setContent] = useState(document.contentMarkdown);
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-[#FBFAF6] text-ink-main"><header className="flex h-16 items-center justify-between border-b border-paper-line bg-white/80 px-6 backdrop-blur"><div className="flex items-center gap-3"><FileText className="text-accent-blue" /><div><h2 className="font-serif text-xl">{document.type === "brief" ? "概要文档" : "详细文档"}</h2><p className="text-xs text-ink-muted">沉浸式文档编辑区域 · Markdown</p></div></div><button onClick={onClose} className="rounded-full bg-paper-soft px-4 py-2 text-sm text-ink-secondary">关闭</button></header><div className="mx-auto h-[calc(100vh-4rem)] max-w-5xl overflow-y-auto px-6 py-10"><textarea value={content} onChange={(e) => setContent(e.target.value)} className="min-h-[calc(100vh-10rem)] w-full resize-none rounded-[28px] border border-paper-line bg-white p-10 font-serif text-lg leading-9 outline-none shadow-paper focus:border-accent-blue" /></div></motion.div>;
}

function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [options, setOptions] = useState<AiProviderOption[]>([]);
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/settings/ai");
    const data = await res.json() as AiSettingsResponse;
    setOptions(data.options);
    const current = data.setting;
    const selected = current?.provider ?? data.options[0]?.id ?? "openai";
    const option = data.options.find((item) => item.id === selected) ?? data.options[0];
    setProvider(selected);
    setModel(current?.model ?? option?.defaultModel ?? "");
    setBaseUrl(current?.baseUrl ?? option?.defaultBaseUrl ?? "");
    setMessage(current?.hasApiKey ? "已保存 API Key。出于安全考虑不会回显。" : null);
  }

  useEffect(() => { void load(); }, []);

  function applyProvider(nextProvider: string) {
    const option = options.find((item) => item.id === nextProvider);
    setProvider(nextProvider);
    setModel(option?.defaultModel ?? "");
    setBaseUrl(option?.defaultBaseUrl ?? "");
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider, model, baseUrl, apiKey }) });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "保存失败");
      setApiKey("");
      setMessage("AI 设置已保存，后续 Agent 将使用该配置。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm"><div className="w-full max-w-xl rounded-[28px] bg-paper-surface p-6 shadow-paper"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.2em] text-ink-muted">AI Settings</p><h2 className="font-serif text-2xl">配置 AI Provider</h2></div><button onClick={onClose} className="rounded-full bg-paper-soft p-2"><X size={18} /></button></div><div className="space-y-4"><label className="block text-sm text-ink-secondary">AI 服务<select value={provider} onChange={(e) => applyProvider(e.target.value)} className="mt-2 w-full rounded-2xl border border-paper-line bg-white p-3 outline-none">{options.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="block text-sm text-ink-secondary">模型<input value={model} onChange={(e) => setModel(e.target.value)} className="mt-2 w-full rounded-2xl border border-paper-line bg-white p-3 outline-none" /></label><label className="block text-sm text-ink-secondary">Base URL<input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} className="mt-2 w-full rounded-2xl border border-paper-line bg-white p-3 outline-none" /></label><label className="block text-sm text-ink-secondary">API Key<input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={options.find((item) => item.id === provider)?.apiKeyPlaceholder ?? "API Key"} type="password" className="mt-2 w-full rounded-2xl border border-paper-line bg-white p-3 outline-none" /></label>{message && <p className="rounded-2xl bg-paper-soft p-3 text-sm text-ink-secondary">{message}</p>}<button onClick={save} disabled={saving} className="w-full rounded-full bg-accent-blue px-5 py-3 font-medium text-white disabled:opacity-50">{saving ? "保存中……" : "保存 AI 设置"}</button></div></div></div>;
}

function InspirationTabs({ bundle, draft, setDraft, toggle, language }: { bundle: ActiveBundle; draft: RoundDraftState; setDraft: (draft: RoundDraftState) => void; toggle: (list: string[], value: string) => string[]; language: Language }) {
  const copy = UI[language];
  const [tab, setTab] = useState<"questions" | "suggestions">("questions");
  return <aside className="flex min-h-0 flex-col rounded-2xl border border-[#E5E7EB] bg-white"><div className="border-b border-[#E5E7EB] p-4"><p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8F959E]">Current Round</p><h2 className="mt-1 text-xl font-semibold text-[#1F2329]">{copy.currentRound}</h2><p className="mt-1 text-sm text-[#646A73]">{copy.phase}：{bundle.currentRound?.phase}</p></div><div className="flex border-b border-[#E5E7EB] px-4"><button onClick={() => setTab("questions")} className={cn("flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium", tab === "questions" ? "border-[#3370FF] text-[#3370FF]" : "border-transparent text-[#646A73]")}><PenLine size={15} /> {copy.questions}</button><button onClick={() => setTab("suggestions")} className={cn("flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium", tab === "suggestions" ? "border-[#3370FF] text-[#3370FF]" : "border-transparent text-[#646A73]")}><Lightbulb size={15} /> {copy.suggestions}</button></div><div className="min-h-0 flex-1 overflow-hidden"><AnimatePresence mode="wait"><motion.div key={tab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.16 }} className="h-full overflow-y-auto">{tab === "questions" ? <div className="divide-y divide-[#EEF1F5] pb-28">{bundle.questions.map((q) => <div key={q.id} className="p-4"><div className="mb-2 flex items-start justify-between gap-3"><p className="text-sm font-medium leading-6 text-[#1F2329]">{q.question}</p><span className="rounded-md bg-[#F7F8FA] px-2 py-0.5 text-[11px] text-[#646A73]">{q.priority}</span></div><p className="mb-2 text-sm leading-6 text-[#646A73]">{q.explanation}</p><p className="mb-3 text-xs leading-5 text-[#8F959E]">{copy.why}{q.whyItMatters}</p><textarea value={draft.answers[q.id] ?? ""} onChange={(e) => setDraft({ ...draft, answers: { ...draft.answers, [q.id]: e.target.value }, ignoredQuestions: draft.ignoredQuestions.filter((id) => id !== q.id) })} placeholder={copy.answerPlaceholder} className="min-h-[72px] w-full resize-none rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm outline-none focus:border-[#3370FF]" /><button onClick={() => setDraft({ ...draft, ignoredQuestions: toggle(draft.ignoredQuestions, q.id), answers: { ...draft.answers, [q.id]: "" } })} className={cn("mt-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs", draft.ignoredQuestions.includes(q.id) ? "bg-[#FEECEC] text-[#D93025]" : "bg-[#FFF1F0] text-[#C92A2A] hover:bg-[#FEECEC]")}><X size={12} /> {copy.ignore}</button></div>)}</div> : <div className="divide-y divide-[#EEF1F5] pb-28">{bundle.suggestions.map((s) => <div key={s.id} className="p-4"><p className="text-sm font-medium leading-6 text-[#1F2329]">{s.suggestion}</p><p className="mt-2 text-sm leading-6 text-[#646A73]">{s.rationale}</p><p className="mt-2 rounded-xl bg-[#F7F8FA] p-3 text-xs leading-5 text-[#646A73]">{copy.impact}{s.expectedImpact}</p><div className="mt-3 flex gap-2"><button onClick={() => setDraft({ ...draft, adoptedSuggestions: toggle(draft.adoptedSuggestions, s.id), ignoredSuggestions: draft.ignoredSuggestions.filter((id) => id !== s.id) })} className={cn("inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs", draft.adoptedSuggestions.includes(s.id) ? "bg-[#E6F4EA] text-[#188038]" : "bg-[#F7F8FA] text-[#646A73]")}><Check size={12} /> {copy.adopt}</button><button onClick={() => setDraft({ ...draft, ignoredSuggestions: toggle(draft.ignoredSuggestions, s.id), adoptedSuggestions: draft.adoptedSuggestions.filter((id) => id !== s.id) })} className={cn("inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs", draft.ignoredSuggestions.includes(s.id) ? "bg-[#FEECEC] text-[#D93025]" : "bg-[#F7F8FA] text-[#646A73]")}><X size={12} /> {copy.ignore}</button></div></div>)}</div>}</motion.div></AnimatePresence></div></aside>;
}

function Landing({ onCreate, isBusy, error }: { onCreate: (raw: string) => void; isBusy: boolean; error: string | null }) {
  const [raw, setRaw] = useState("");
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full rounded-[36px] bg-paper-surface p-8 shadow-paper md:p-12">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-2xl bg-accent-blue/10 p-3 text-accent-blue"><Sparkles size={24} /></div>
          <div>
            <p className="text-sm text-ink-muted">Thinking</p>
            <h1 className="font-serif text-4xl text-ink-main md:text-6xl">写下一个想法</h1>
          </div>
        </div>
        <p className="mb-6 max-w-2xl text-lg leading-8 text-ink-secondary">不需要一开始就有计划。输入一个模糊念头，平台会生成初始文档、问题清单与建议清单，陪你一轮轮把想法变清楚。</p>
        <textarea value={raw} onChange={(event) => setRaw(event.target.value)} placeholder="例如：我想做一个能通过 AI 提问和建议帮助用户完善想法的平台……" className="min-h-[220px] w-full resize-none rounded-[28px] border border-paper-line bg-white/70 p-6 text-lg leading-8 outline-none transition focus:border-accent-blue focus:shadow-[0_0_0_4px_rgba(76,125,255,0.10)]" />
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-ink-muted">当前版本通过 Next.js API 写入 MySQL；配置 OPENAI_API_KEY 后会启用真实 LLM Agent，否则自动回退到本地规则 Agent。</p>
          {error && <p className="w-full rounded-2xl bg-accent-red/10 px-4 py-3 text-sm text-accent-red">{error}</p>}
          <button onClick={() => raw.trim() && onCreate(raw)} disabled={!raw.trim() || isBusy} className="inline-flex items-center gap-2 rounded-full bg-accent-blue px-6 py-3 font-medium text-white shadow-paperSoft transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45">{isBusy ? "整理中……" : "开始整理"} <Send size={18} /></button>
        </div>
      </motion.div>
    </main>
  );
}

export default function HomePage() {
  const [workspace, setWorkspace] = useState<ThinkingWorkspace>(() => createEmptyWorkspace());
  const [draft, setDraft] = useState<RoundDraftState>(emptyDraft);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [openDocument, setOpenDocument] = useState<IdeaDocument | null>(null);
  const [openManual, setOpenManual] = useState(false);
  const [openProblems, setOpenProblems] = useState(false);
  const [problems, setProblems] = useState<ProblemItem[]>([]);
  const [agentProgress, setAgentProgress] = useState<AgentProgressState>({ active: false, percent: 0, label: "等待分析", detail: "" });
  const [language, setLanguage] = useState<Language>("zh");

  const copy = UI[language];

  const bundle = useMemo(() => getActiveBundle(workspace), [workspace]);

  async function loadProblems(ideaId: string) {
    const result = await fetch(`/api/ideas/${ideaId}/problems`);
    if (!result.ok) return;
    const data = await result.json() as ProblemsResponse;
    setProblems(data.problems ?? []);
  }

  async function loadWorkspaceFromDb() {
    setError(null);
    try {
      const result = await fetch("/api/ideas");
      if (!result.ok) throw new Error("加载想法列表失败");
      const data = await result.json() as IdeasResponse;
      if (!data.ideas.length) {
        setWorkspace(createEmptyWorkspace());
        return;
      }
      const initial = { ...createEmptyWorkspace(), ideas: data.ideas, activeIdeaId: data.ideas[0].id };
      setWorkspace(initial);
      await openIdea(data.ideas[0].id, initial);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "加载想法失败");
    }
  }

  async function openIdea(ideaId: string, base = workspace) {
    setError(null);
    try {
      const result = await fetch(`/api/ideas/${ideaId}/workspace`);
      if (!result.ok) throw new Error("加载想法工作台失败");
      const data = await result.json() as WorkspaceResponse;
      const next = workspaceFromWorkspaceResponse(base, data);
      setWorkspace(next);
      saveWorkspace(next);
      setDraft(emptyDraft);
      await loadProblems(ideaId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "加载想法工作台失败");
    }
  }

  async function deleteIdea(ideaId: string) {
    const previous = workspace;
    const remainingIdeas = workspace.ideas.filter((idea) => idea.id !== ideaId);
    const nextActiveId = workspace.activeIdeaId === ideaId ? remainingIdeas[0]?.id ?? null : workspace.activeIdeaId;
    const next: ThinkingWorkspace = {
      ...workspace,
      ideas: remainingIdeas,
      activeIdeaId: nextActiveId,
      documents: Object.fromEntries(Object.entries(workspace.documents).filter(([id]) => id !== ideaId)),
      rounds: Object.fromEntries(Object.entries(workspace.rounds).filter(([id]) => id !== ideaId)),
      revisions: Object.fromEntries(Object.entries(workspace.revisions).filter(([id]) => id !== ideaId))
    };
    setWorkspace(next);
    saveWorkspace(next);
    if (nextActiveId && nextActiveId !== workspace.activeIdeaId) await openIdea(nextActiveId, next);
    if (!nextActiveId) setProblems([]);
    try {
      const result = await fetch(`/api/ideas/${ideaId}`, { method: "DELETE" });
      if (!result.ok) throw new Error("删除想法失败");
    } catch (cause) {
      setWorkspace(previous);
      saveWorkspace(previous);
      setError(cause instanceof Error ? cause.message : "删除想法失败");
    }
  }

  useEffect(() => {
    const saved = window.localStorage.getItem("chensi-language");
    if (saved === "en" || saved === "zh") setLanguage(saved);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("chensi-language", language);
  }, [language]);

  useEffect(() => { void loadWorkspaceFromDb(); }, []);

  function beginAgentProgress(label: string) {
    setAgentProgress({ active: true, percent: 12, label, detail: language === "zh" ? "请求已提交，多 Agent 工作流正在整理上下文。" : "Request submitted. The multi-agent workflow is preparing context." });
    window.setTimeout(() => setAgentProgress((current) => current.active ? { ...current, percent: Math.max(current.percent, 34), detail: language === "zh" ? "正在进行想法整理、文档读取和关键不确定点识别。" : "Refining the idea, reading documents, and identifying uncertainty." } : current), 900);
    window.setTimeout(() => setAgentProgress((current) => current.active ? { ...current, percent: Math.max(current.percent, 58), detail: language === "zh" ? "正在生成/更新文档，并拆解方向性问题。" : "Generating or updating documents and decomposing directional problems." } : current), 2200);
    window.setTimeout(() => setAgentProgress((current) => current.active ? { ...current, percent: Math.max(current.percent, 82), detail: language === "zh" ? "正在生成待处理问题、建议并写入数据库。" : "Generating questions, suggestions, and writing results to the database." } : current), 4200);
  }

  function finishAgentProgress(detail: string) {
    setAgentProgress({ active: false, percent: 100, label: language === "zh" ? "分析完成" : "Analysis complete", detail });
  }

  async function create(raw: string) {
    setIsBusy(true);
    setError(null);
    beginAgentProgress(language === "zh" ? "创建想法中" : "Creating idea");
    try {
      const result = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawInput: raw })
      });
      if (!result.ok) {
        const data = await result.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? "创建想法失败");
      }
      const data = await result.json() as CreateIdeaResponse;
      const created = workspaceFromCreateResponse(data);
      const next = { ...created, ideas: [data.idea, ...workspace.ideas.filter((idea) => idea.id !== data.idea.id)] };
      setWorkspace(next);
      saveWorkspace(next);
      setDraft(emptyDraft);
      await loadProblems(data.idea.id);
      finishAgentProgress(language === "zh" ? "初始文档、问题文档和第一轮待处理内容已写入。" : "Initial documents, problem document, and first-round tasks have been written.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "创建想法失败");
      setAgentProgress({ active: false, percent: 0, label: language === "zh" ? "分析失败" : "Analysis failed", detail: "" });
    } finally {
      setIsBusy(false);
    }
  }

  async function submitCurrentRound() {
    if (!bundle?.idea || !bundle.currentRound) {
      if (draft.freeThought.trim()) await create(draft.freeThought.trim());
      return;
    }
    setIsBusy(true);
    setError(null);
    beginAgentProgress(language === "zh" ? "提交迭代中" : "Submitting iteration");
    try {
      const questionResponses: Array<{ questionId: string; status: "answered" | "ignored"; answer?: string }> = [];
      for (const question of bundle.questions) {
        const answer = draft.answers[question.id]?.trim();
        if (answer) questionResponses.push({ questionId: question.id, status: "answered", answer });
        else if (draft.ignoredQuestions.includes(question.id)) questionResponses.push({ questionId: question.id, status: "ignored" });
      }
      const suggestionResponses: Array<{ suggestionId: string; status: "adopted" | "ignored" }> = [];
      for (const suggestion of bundle.suggestions) {
        if (draft.adoptedSuggestions.includes(suggestion.id)) suggestionResponses.push({ suggestionId: suggestion.id, status: "adopted" });
        else if (draft.ignoredSuggestions.includes(suggestion.id)) suggestionResponses.push({ suggestionId: suggestion.id, status: "ignored" });
      }
      const result = await fetch(`/api/ideas/${bundle.idea.id}/rounds/${bundle.currentRound.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionResponses, suggestionResponses, freeThought: draft.freeThought })
      });
      if (!result.ok) {
        const data = await result.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? "提交反馈失败");
      }
      const data = await result.json() as SubmitRoundResponse;
      const next = workspaceFromSubmitResponse(workspace, data);
      setWorkspace(next);
      saveWorkspace(next);
      setDraft(emptyDraft);
      await loadProblems(data.idea.id);
      finishAgentProgress(language === "zh" ? "本轮反馈已整合，文档、问题文档和下一轮待处理内容已更新。" : "Feedback integrated. Documents, problem document, and next-round tasks are updated.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "提交反馈失败");
      setAgentProgress({ active: false, percent: 0, label: language === "zh" ? "分析失败" : "Analysis failed", detail: "" });
    } finally {
      setIsBusy(false);
    }
  }

  function toggle(list: string[], value: string) {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
  }

  return (
    <main className="h-screen overflow-hidden bg-[#F7F8FA] px-4 py-4 text-[#1F2329] md:px-6">
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      <AnimatePresence>{openDocument && <DocumentEditorShell document={openDocument} onClose={() => setOpenDocument(null)} onSaved={(saved) => {
        setOpenDocument(saved);
        setWorkspace((current) => ({ ...current, documents: { ...current.documents, [saved.ideaId]: (current.documents[saved.ideaId] ?? []).map((item) => item.id === saved.id ? saved : item) } }));
      }} />}</AnimatePresence>
      <AnimatePresence>{openManual && <ManualEditor language={language} onClose={() => setOpenManual(false)} />}</AnimatePresence>
      <AnimatePresence>{openProblems && bundle?.idea && <ProblemDocumentEditor language={language} ideaId={bundle.idea.id} problems={problems} onChange={setProblems} onClose={() => setOpenProblems(false)} />}</AnimatePresence>
      <header className="mb-4 flex h-[64px] items-center justify-between rounded-2xl border border-[#E5E7EB] bg-white px-5 py-3">
        <div className="flex items-center gap-3"><FileText className="text-[#3370FF]" /><div><h1 className="text-xl font-semibold text-[#1F2329]">{copy.brand}</h1><p className="text-xs text-[#8F959E]">{copy.tagline}</p></div></div>
        <div className="flex items-center gap-2"><button onClick={() => setLanguage(language === "zh" ? "en" : "zh")} className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#646A73] transition hover:bg-[#F7F8FA]">{copy.langToggle}</button><button onClick={() => setOpenManual(true)} className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#646A73] transition hover:bg-[#F7F8FA]"><BookOpen size={16} /> {copy.guide}</button><button onClick={() => setShowSettings(true)} className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#646A73] transition hover:bg-[#F7F8FA]"><Settings size={16} /> {copy.settings}</button></div>
      </header>

      <section className="grid h-[calc(100vh-104px)] gap-4 lg:grid-cols-[280px_minmax(420px,1fr)_390px]">
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white p-4">
          <div className="mb-4 flex shrink-0 items-center justify-between"><h2 className="text-base font-semibold text-[#1F2329]">{copy.ideas}</h2><button onClick={() => setWorkspace({ ...workspace, activeIdeaId: null })} className="rounded-lg border border-[#E5E7EB] bg-white p-2 text-[#3370FF] hover:bg-[#F7F8FA]"><Plus size={16} /></button></div>
          <div className="min-h-0 flex-1 divide-y divide-[#EEF1F5] overflow-y-auto pr-1">{workspace.ideas.map((idea) => <motion.div key={idea.id} whileHover={{ x: 1 }} className={cn("group relative transition hover:bg-[#F7F8FA]", idea.id === workspace.activeIdeaId && "bg-[#F0F5FF]")}><button onClick={() => { void openIdea(idea.id); }} className="w-full px-2 py-3 pr-9 text-left"><div className="mb-1 flex items-start justify-between gap-2"><h3 className="text-sm font-medium leading-5 text-[#1F2329]">{idea.title}</h3><span className="rounded-md bg-[#E6F4EA] px-2 py-0.5 text-[11px] text-[#188038]">{idea.maturityLevel}</span></div><p className="line-clamp-2 text-xs leading-5 text-[#646A73]">{idea.briefSummary}</p><div className="mt-2 flex items-center justify-between text-[11px] text-[#8F959E]"><span>{copy.roundPrefix}{idea.iterationCount}{copy.roundSuffix}</span><span>{formatDateTime(idea.updatedAt)}</span></div></button><button aria-label={`删除想法：${idea.title}`} onClick={(event) => { event.stopPropagation(); void deleteIdea(idea.id); }} className="absolute right-2 top-2 rounded-md border border-transparent p-1 text-[#C92A2A] opacity-0 transition hover:border-[#F6C8C8] hover:bg-[#FFF1F0] group-hover:opacity-100"><Trash2 size={14} /></button></motion.div>)}</div>
        </aside>

        <section className="relative min-h-0 overflow-hidden">
          <div className="flex h-full flex-col">
            {error && <div className="mb-3 rounded-xl border border-[#F6C8C8] bg-[#FEF2F2] px-4 py-3 text-sm text-[#D93025]">{error}</div>}
            {workspace.lastChangeSummary && <div className="mb-4 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#646A73]"><span className="font-medium text-[#1F2329]">{copy.recentUpdate}</span>{workspace.lastChangeSummary}</div>}
            <div className="pt-2"><RoundProgress bundle={bundle} progress={agentProgress} language={language} /></div>
            <div className="flex flex-1 flex-col items-center justify-center gap-5 overflow-hidden px-2 pb-32 pt-6">
              {bundle?.briefDocument && <DocumentFolder language={language} document={bundle.briefDocument} onOpen={() => setOpenDocument(bundle.briefDocument)} />}
              {bundle?.livingDocument && <DocumentFolder language={language} document={bundle.livingDocument} onOpen={() => setOpenDocument(bundle.livingDocument)} />}
              {bundle?.idea && <ProblemDocumentCard language={language} count={problems.length} onOpen={() => setOpenProblems(true)} />}
              {!bundle && <div className="mx-auto max-w-xl rounded-2xl border border-[#E5E7EB] bg-white p-10 text-center"><FileText className="mx-auto mb-4 text-[#3370FF]" /><h2 className="text-2xl font-semibold text-[#1F2329]">{copy.emptyIdea}</h2><p className="mt-3 text-[#646A73]">{copy.emptyIdeaDesc}</p></div>}
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-2">
              <div className="pointer-events-auto w-full max-w-[620px] rounded-xl border border-[#DDE3EA] bg-white/95 p-2.5 shadow-[0_10px_26px_rgba(31,35,41,0.07)] backdrop-blur">
                <div className="mb-1.5 flex items-center gap-2 px-2 text-xs text-[#8F959E]"><MessageSquareText size={13} /> {bundle ? copy.supplement : copy.createIdea}</div>
                <div className="flex items-end gap-2"><textarea value={draft.freeThought} onChange={(e) => setDraft({ ...draft, freeThought: e.target.value })} placeholder={bundle ? copy.composerExisting : copy.composerNew} className="max-h-24 min-h-[38px] flex-1 resize-none rounded-lg border border-transparent bg-[#F7F8FA] px-3 py-2.5 text-sm outline-none focus:border-[#3370FF] focus:bg-white" /><button disabled={isBusy} onClick={submitCurrentRound} className="inline-flex h-[38px] items-center justify-center rounded-lg border border-[#BFC7D2] bg-white px-4 text-sm font-medium text-[#1F2329] shadow-sm transition hover:bg-[#F7F8FA] disabled:cursor-not-allowed disabled:opacity-50">{isBusy ? copy.processing : bundle ? copy.submit : copy.create}</button></div>
              </div>
            </div>
          </div>
        </section>

        {bundle ? <InspirationTabs language={language} bundle={bundle} draft={draft} setDraft={setDraft} toggle={toggle} /> : <aside className="flex min-h-0 flex-col rounded-2xl border border-[#E5E7EB] bg-white p-5"><p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8F959E]">Current Round</p><h2 className="mt-1 text-xl font-semibold text-[#1F2329]">{copy.currentRound}</h2><div className="mt-8 rounded-xl bg-[#F7F8FA] p-4 text-sm leading-7 text-[#646A73]">{copy.noIdeaHint}</div></aside>}
      </section>

    </main>
  );
}
