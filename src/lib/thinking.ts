import { firstSentence, nowIso } from "./utils";
import type { DocumentRevision, Idea, IdeaDocument, IdeaDomain, IdeaPhase, IterationRound, QuestionItem, RoundDraftState, SuggestionItem, ThinkingWorkspace } from "./types";

const STORAGE_KEY = "thinking-v2-workspace";
const rid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString(36)}`;

function domainOf(text: string): IdeaDomain {
  if (/平台|产品|app|应用|软件|用户|功能/.test(text)) return "software_product";
  if (/小说|故事|角色|世界观|剧情/.test(text)) return "fiction";
  if (/艺术|展览|视觉|绘画|装置|影像/.test(text)) return "art";
  if (/研究|论文|实验|数据|假设|科研/.test(text)) return "research";
  if (/商业|创业|市场|客户|营收/.test(text)) return "business";
  if (/学习|课程|知识|训练/.test(text)) return "learning";
  return "other";
}

const domainName: Record<IdeaDomain, string> = {
  software_product: "软件/产品",
  fiction: "小说/故事",
  art: "艺术创作",
  research: "科研想法",
  business: "商业点子",
  learning: "学习方案",
  other: "开放想法"
};

function titleOf(raw: string) {
  const clean = firstSentence(raw).replace(/^我想|^想要|^做一个/, "").trim() || "新的想法";
  return clean.length > 18 ? `${clean.slice(0, 18)}…` : clean;
}

function briefDoc(title: string, refined: string, domain: IdeaDomain) {
  return `# ${title}\n\n## 一句话概述\n${firstSentence(refined)}。\n\n## 当前核心想法\n${refined}\n\n## 适用领域\n${domainName[domain]}\n\n## 目前已明确的内容\n- 已有一个原始想法方向。\n- 平台将通过问题和建议帮助继续澄清。\n\n## 目前仍不确定的内容\n- 目标对象、具体流程和关键边界仍需要确认。\n- 想法最终希望呈现为何种结果还需要补充。\n\n## 下一轮最值得澄清的问题\n先明确整体流程、目标对象和最重要的使用场景。`;
}

function livingDoc(title: string, refined: string, domain: IdeaDomain) {
  return `# 详细想法文档：${title}\n\n## 1. 想法背景\n用户提出了一个初始想法：${refined}\n\n## 2. 核心概念\n当前核心概念仍处于种子阶段，需要通过多轮问答逐渐明确。\n\n## 3. 目标与价值\n- 帮助想法从模糊表述变得更清晰。\n- 在不替用户做最终决定的前提下，提供启发式建议。\n\n## 4. 当前流程/结构\n暂未完全明确。下一轮应优先确认起点、过程和结果。\n\n## 5. 关键模块/组成部分\n- 原始想法输入\n- AI 提问\n- AI 建议\n- 用户反馈\n- 文档持续更新\n\n## 6. 用户或受众\n待确认。\n\n## 7. 已确认设定\n- 领域倾向：${domainName[domain]}。\n- 原始想法已被整理为初始文档。\n\n## 8. 待确认设定\n- 目标用户或受众是谁。\n- 想法完成后应呈现成什么形式。\n- 哪些部分必须存在，哪些只是可能方向。\n\n## 9. AI 建议但尚未确认的方向\n- 可以先从整体流程澄清开始，再进入模块级深入。\n\n## 10. 迭代记录\n- 第 0 轮：根据原始输入生成初始文档。`;
}

function questions(ideaId: string, roundId: string, phase: IdeaPhase, focus: string): QuestionItem[] {
  const now = nowIso();
  const process = phase === "process_clarification";
  const base = process
    ? [["这个想法最希望服务谁？", "描述最典型的使用者、读者或参与者。", "明确对象后，文档才能判断哪些细节重要。", "high"], ["用户或受众接触这个想法后的第一个动作是什么？", "用一句话描述起点即可。", "起点清楚后，后续流程更容易展开。", "high"], ["这个想法最终希望产出什么？", "例如产品、故事设定、研究方案或成熟文档。", "结果形态会影响后续问题方向。", "medium"], ["目前最不想被 AI 擅自决定的部分是什么？", "指出一个边界即可。", "这能避免 AI 把不确定内容写成事实。", "medium"]]
    : [["当前最值得深入的模块是哪一个？", "从文档中的模块或环节里选择一个。", "聚焦一个模块能让下一轮更具体。", "high"], ["这个模块的输入和输出分别是什么？", "说明从哪里来、到哪里去。", "输入输出能帮助定义功能边界。", "high"], ["这个模块中哪些决策需要用户确认？", "指出 AI 可自动做和必须确认的区别。", "这能避免 Agent 越权。", "medium"], ["如果这个模块失败或不清楚，应如何处理？", "描述重试、暂停或确认方式。", "异常处理会让想法更稳固。", "low"]];
  return base.map(([question, explanation, whyItMatters, priority], i) => ({ id: rid("q"), roundId, ideaId, stage: process ? "process" : "task", relatedSection: i === 0 ? focus : undefined, question, explanation, whyItMatters, priority: priority as QuestionItem["priority"], status: "pending", createdAt: now, updatedAt: now }));
}

function suggestions(ideaId: string, roundId: string, qs: QuestionItem[], phase: IdeaPhase): SuggestionItem[] {
  const now = nowIso();
  const items = [
    { suggestion: phase === "process_clarification" ? "先用“起点-过程-结果”三段式描述整体流程。" : "先选择一个模块做小范围深入，而不是同时展开所有模块。", rationale: "降低初期复杂度。", expectedImpact: "文档会更容易形成稳定结构。", possibleRisk: "可能暂时忽略边缘细节。", type: "structure" as const, adoptionText: "下一步采用小范围聚焦方式，优先澄清起点、关键过程与预期结果。" },
    { suggestion: "把暂时不能确定的内容明确放入“待确认设定”。", rationale: "保留开放性，避免 AI 过度补全。", expectedImpact: "用户会更清楚哪些已确认，哪些仍需讨论。", type: "clarity" as const, adoptionText: "未被用户明确确认的内容统一记录为待确认设定。" },
    { suggestion: "每一轮只处理 3-4 个关键问题，保持轻量节奏。", rationale: "启发式产品应避免复杂表单感。", expectedImpact: "交互更像思维伙伴，而不是项目管理工具。", possibleRisk: "想法成熟速度可能略慢。", type: "experience" as const, adoptionText: "每轮迭代保持少量关键问题，优先保证用户愿意持续反馈。" }
  ];
  return items.map((item, i) => ({ id: rid("s"), roundId, ideaId, relatedQuestionId: qs[i]?.id, relatedSection: qs[i]?.relatedSection, status: "pending", createdAt: now, updatedAt: now, ...item }));
}

export function createEmptyWorkspace(): ThinkingWorkspace {
  return { ideas: [], activeIdeaId: null, documents: {}, rounds: {}, questions: {}, suggestions: {}, revisions: {} };
}

export function loadWorkspace(): ThinkingWorkspace {
  if (typeof window === "undefined") return createEmptyWorkspace();
  try { return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "") as ThinkingWorkspace; } catch { return createEmptyWorkspace(); }
}

export function saveWorkspace(workspace: ThinkingWorkspace) {
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
}

export function createIdeaWorkspace(workspace: ThinkingWorkspace, rawInput: string): ThinkingWorkspace {
  const now = nowIso();
  const ideaId = rid("idea");
  const roundId = rid("round");
  const domain = domainOf(rawInput);
  const refined = rawInput.trim().replace(/\s+/g, " ").replace(/([^。！？.!?])$/, "$1。");
  const title = titleOf(rawInput);
  const idea: Idea = { id: ideaId, userId: "local-user", rawInput, refinedIdea: refined, title, briefSummary: `${firstSentence(refined)}。`, domain, tags: [domainName[domain], "种子想法"], currentPhase: "process_clarification", maturityLevel: "seed", iterationCount: 0, createdAt: now, updatedAt: now };
  const docs: IdeaDocument[] = [
    { id: rid("doc"), ideaId, type: "brief", title: "想法简要概述文档", contentMarkdown: briefDoc(title, refined, domain), version: 1, lastUpdatedBy: "agent", createdAt: now, updatedAt: now },
    { id: rid("doc"), ideaId, type: "living", title: "详细想法动态更新文档", contentMarkdown: livingDoc(title, refined, domain), version: 1, lastUpdatedBy: "agent", createdAt: now, updatedAt: now }
  ];
  const round: IterationRound = { id: roundId, ideaId, roundNumber: 1, phase: "process_clarification", status: "open", agentFocus: "先澄清整体流程、目标对象和结果形态。", summaryBefore: idea.briefSummary, createdAt: now };
  const qs = questions(ideaId, roundId, round.phase, round.agentFocus);
  const ss = suggestions(ideaId, roundId, qs, round.phase);
  const next = { ...workspace, ideas: [idea, ...workspace.ideas], activeIdeaId: ideaId, documents: { ...workspace.documents, [ideaId]: docs }, rounds: { ...workspace.rounds, [ideaId]: [round] }, questions: { ...workspace.questions, [roundId]: qs }, suggestions: { ...workspace.suggestions, [roundId]: ss }, revisions: { ...workspace.revisions, [ideaId]: [] }, lastChangeSummary: "已生成初始文档、第一轮问题和建议。" };
  saveWorkspace(next);
  return next;
}

export function getActiveBundle(workspace: ThinkingWorkspace) {
  const idea = workspace.ideas.find((x) => x.id === workspace.activeIdeaId) ?? null;
  if (!idea) return null;
  const documents = workspace.documents[idea.id] ?? [];
  const currentRound = (workspace.rounds[idea.id] ?? [])[0] ?? null;
  return { idea, briefDocument: documents.find((d) => d.type === "brief") ?? null, livingDocument: documents.find((d) => d.type === "living") ?? null, currentRound, questions: currentRound ? workspace.questions[currentRound.id] ?? [] : [], suggestions: currentRound ? workspace.suggestions[currentRound.id] ?? [] : [], revisions: workspace.revisions[idea.id] ?? [] };
}

export function setActiveIdea(workspace: ThinkingWorkspace, ideaId: string): ThinkingWorkspace {
  const next = { ...workspace, activeIdeaId: ideaId };
  saveWorkspace(next);
  return next;
}

export function submitRound(workspace: ThinkingWorkspace, draft: RoundDraftState): ThinkingWorkspace {
  const b = getActiveBundle(workspace);
  if (!b?.idea || !b.briefDocument || !b.livingDocument || !b.currentRound) return workspace;
  const now = nowIso();
  const qu = b.questions.map((q) => ({ ...q, answer: draft.answers[q.id]?.trim() || q.answer, status: draft.answers[q.id]?.trim() ? "answered" : draft.ignoredQuestions.includes(q.id) ? "ignored" : q.status, updatedAt: now } satisfies QuestionItem));
  const su = b.suggestions.map((s) => ({ ...s, status: draft.adoptedSuggestions.includes(s.id) ? "adopted" : draft.ignoredSuggestions.includes(s.id) ? "ignored" : s.status, updatedAt: now } satisfies SuggestionItem));
  const answered = qu.filter((q) => q.status === "answered" && q.answer).map((q) => `- ${q.question}：${q.answer}`);
  const adopted = su.filter((s) => s.status === "adopted").map((s) => `- ${s.adoptionText ?? s.suggestion}`);
  const ignored = qu.filter((q) => q.status === "ignored").map((q) => `- ${q.question}`);
  const free = draft.freeThought.trim() ? `- ${draft.freeThought.trim()}` : "";
  const summary = `${answered.length ? `吸收了 ${answered.length} 条回答` : "本轮没有新的问题回答"}，${adopted.length ? `采纳了 ${adopted.length} 条建议` : "未采纳新的建议"}${free ? "，记录了自由补充想法" : ""}。`;
  const phase: IdeaPhase = b.idea.iterationCount >= 2 ? "free_iteration" : answered.length + adopted.length >= 2 ? "task_deepening" : "process_clarification";
  const nextRoundId = rid("round");
  const nextRound: IterationRound = { id: nextRoundId, ideaId: b.idea.id, roundNumber: b.currentRound.roundNumber + 1, phase, status: "open", agentFocus: phase === "task_deepening" ? "选择一个关键模块做深入。" : phase === "free_iteration" ? "自由打磨与扩展当前想法。" : "继续澄清整体流程与边界。", summaryBefore: summary, createdAt: now };
  const nextQs = questions(b.idea.id, nextRoundId, phase, nextRound.agentFocus);
  const nextSs = suggestions(b.idea.id, nextRoundId, nextQs, phase);
  const section = `\n\n## 第 ${b.idea.iterationCount + 1} 轮更新\n\n### 用户明确回答\n${answered.join("\n") || "- 本轮未填写明确回答。"}\n\n### 已采纳建议\n${adopted.join("\n") || "- 本轮未采纳建议。"}\n\n### 自由补充\n${free || "- 本轮没有自由补充。"}\n\n### 暂时忽略的问题\n${ignored.join("\n") || "- 无。"}`;
  const docs = [{ ...b.briefDocument, contentMarkdown: `${b.briefDocument.contentMarkdown}\n\n## 最近一轮更新摘要\n${summary}`, version: b.briefDocument.version + 1, updatedAt: now }, { ...b.livingDocument, contentMarkdown: `${b.livingDocument.contentMarkdown}${section}`, version: b.livingDocument.version + 1, updatedAt: now }];
  const revs: DocumentRevision[] = docs.map((d) => ({ id: rid("rev"), ideaId: b.idea.id, documentId: d.id, roundId: b.currentRound.id, versionBefore: d.version - 1, versionAfter: d.version, changeSummary: summary, createdAt: now }));
  const idea: Idea = { ...b.idea, currentPhase: phase, maturityLevel: phase === "free_iteration" ? "deepening" : phase === "task_deepening" ? "structured" : "rough", iterationCount: b.idea.iterationCount + 1, updatedAt: now };
  const processed = { ...b.currentRound, status: "processed", summaryAfter: summary, submittedAt: now, processedAt: now } satisfies IterationRound;
  const next = { ...workspace, ideas: workspace.ideas.map((x) => x.id === idea.id ? idea : x), documents: { ...workspace.documents, [idea.id]: docs }, rounds: { ...workspace.rounds, [idea.id]: [nextRound, processed, ...(workspace.rounds[idea.id] ?? []).filter((r) => r.id !== b.currentRound?.id)] }, questions: { ...workspace.questions, [b.currentRound.id]: qu, [nextRoundId]: nextQs }, suggestions: { ...workspace.suggestions, [b.currentRound.id]: su, [nextRoundId]: nextSs }, revisions: { ...workspace.revisions, [idea.id]: [...revs, ...(workspace.revisions[idea.id] ?? [])] }, lastChangeSummary: summary };
  saveWorkspace(next);
  return next;
}
