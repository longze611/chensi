import { createEmptyWorkspace, createIdeaWorkspace, getActiveBundle, submitRound } from "./thinking";
import { callLlmJson, isLlmConfigured, type LlmRuntimeConfig } from "./llm";
import { nowIso } from "./utils";
import { AGENT_SYSTEM_PROMPT, AMBIGUITY_ANALYSIS_PROMPT, DOCUMENT_INITIALIZATION_PROMPT, DOCUMENT_UPDATE_PROMPT, IDEA_REFINEMENT_PROMPT, PHASE_DECISION_PROMPT, PROBLEM_DECOMPOSITION_PROMPT, QUALITY_REVIEW_PROMPT, QUESTION_GENERATION_PROMPT, SUGGESTION_GENERATION_PROMPT, USER_FEEDBACK_INTEGRATOR_PROMPT } from "./agent-prompts";
import type { Idea, IdeaDocument, IdeaDomain, IdeaPhase, IterationRound, Priority, ProblemItem, QuestionItem, RoundDraftState, SuggestionItem, ThinkingWorkspace } from "./types";

const id = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString(36)}`;

type QuestionDraft = { question: string; explanation: string; whyItMatters: string; priority: "high" | "medium" | "low"; relatedSection?: string | null };
type SuggestionDraft = { suggestion: string; rationale: string; expectedImpact: string; possibleRisk?: string | null; adoptionText?: string; type: SuggestionItem["type"]; relatedQuestionIndex?: number | null };
type Refined = { title: string; refinedIdea: string; briefSummary: string; domain: IdeaDomain; tags: string[] };
type Docs = { briefDocumentMarkdown: string; livingDocumentMarkdown: string; initialFocus: string };
type Ambiguity = { ambiguities: Array<{ topic: string; description: string; whyItMatters: string; priority: "high" | "medium" | "low"; relatedSection: string | null }>; recommendedFocus: string; stageHint: "process" | "task" };
type Questions = { questions: QuestionDraft[] };
type Suggestions = { suggestions: SuggestionDraft[] };
type Integrated = { acceptedFacts: string[]; userPreferences: string[]; ignoredTopics: string[]; adoptedSuggestions: string[]; freeThoughts: string[]; conflicts: string[]; updateInstructions: string[] };
type UpdatedDocs = { updatedBriefDocumentMarkdown: string; updatedLivingDocumentMarkdown: string; changeSummary: string; newlyConfirmed: string[]; stillUnclear: string[]; suggestedNextFocus: string };
type Phase = { nextPhase: IdeaPhase; maturityLevel: Idea["maturityLevel"]; reason: string; recommendedFocus: string; confidence: number };
type Quality = { approved: boolean; issues: string[]; revisedQuestions: QuestionDraft[] | null; revisedSuggestions: SuggestionDraft[] | null; revisionNotes: string };
type CreateOutput = Refined & Docs & { agentFocus: string; questions: QuestionDraft[]; suggestions: SuggestionDraft[] };
type SubmitOutput = UpdatedDocs & { nextPhase: IdeaPhase; maturityLevel: Idea["maturityLevel"]; agentFocus: string; questions: QuestionDraft[]; suggestions: SuggestionDraft[] };
type ProblemDecompositionDraft = { content: string; priority: Priority; difficulty: 1 | 2 | 3 | 4 | 5; mergeWithExistingContent: string | null; decomposition: { whyThisMatters: string; angles: string[]; handoffToNextAgents: string[] } };
type ProblemDecompositionOutput = { problems: ProblemDecompositionDraft[]; iterationFocus: string };

async function runAgent<T>(prompt: string, task: string, config: LlmRuntimeConfig | null, maxTokens = 3000) {
  return callLlmJson<T>({ messages: [{ role: "system", content: AGENT_SYSTEM_PROMPT }, { role: "system", content: prompt }, { role: "user", content: task }], maxTokens, config });
}

const compact = (value: unknown) => JSON.stringify(value, null, 2);
const qn = (items: QuestionDraft[]) => items.filter((x) => x.question && x.explanation && x.whyItMatters).slice(0, 5);
const sn = (items: SuggestionDraft[]) => items.filter((x) => x.suggestion && x.rationale && x.expectedImpact).slice(0, 5);

function toQuestions(ideaId: string, roundId: string, phase: IdeaPhase, drafts: QuestionDraft[]): QuestionItem[] {
  const now = nowIso();
  return qn(drafts).map((x) => ({ id: id("q"), roundId, ideaId, stage: phase === "task_deepening" ? "task" : "process", relatedSection: x.relatedSection ?? undefined, question: x.question, explanation: x.explanation, whyItMatters: x.whyItMatters, priority: x.priority, status: "pending", createdAt: now, updatedAt: now }));
}

function toSuggestions(ideaId: string, roundId: string, questions: QuestionItem[], drafts: SuggestionDraft[]): SuggestionItem[] {
  const now = nowIso();
  return sn(drafts).map((x) => ({ id: id("s"), roundId, ideaId, relatedQuestionId: typeof x.relatedQuestionIndex === "number" ? questions[x.relatedQuestionIndex]?.id : undefined, suggestion: x.suggestion, rationale: x.rationale, expectedImpact: x.expectedImpact, possibleRisk: x.possibleRisk ?? undefined, adoptionText: x.adoptionText, type: x.type, status: "pending", createdAt: now, updatedAt: now }));
}

function workspaceFromCreate(rawInput: string, output: CreateOutput): ThinkingWorkspace {
  const now = nowIso();
  const ideaId = id("idea");
  const roundId = id("round");
  const idea: Idea = { id: ideaId, userId: "local-user", rawInput, refinedIdea: output.refinedIdea, title: output.title, briefSummary: output.briefSummary, domain: output.domain, tags: output.tags.slice(0, 6), currentPhase: "process_clarification", maturityLevel: "seed", iterationCount: 0, createdAt: now, updatedAt: now };
  const docs: IdeaDocument[] = [
    { id: id("doc"), ideaId, type: "brief", title: "想法简要概述文档", contentMarkdown: output.briefDocumentMarkdown, version: 1, lastUpdatedBy: "agent", createdAt: now, updatedAt: now },
    { id: id("doc"), ideaId, type: "living", title: "详细想法动态更新文档", contentMarkdown: output.livingDocumentMarkdown, version: 1, lastUpdatedBy: "agent", createdAt: now, updatedAt: now }
  ];
  const round: IterationRound = { id: roundId, ideaId, roundNumber: 1, phase: "process_clarification", status: "open", agentFocus: output.agentFocus, summaryBefore: idea.briefSummary, createdAt: now };
  const questions = toQuestions(ideaId, roundId, round.phase, output.questions);
  const suggestions = toSuggestions(ideaId, roundId, questions, output.suggestions);
  return { ideas: [idea], activeIdeaId: ideaId, documents: { [ideaId]: docs }, rounds: { [ideaId]: [round] }, questions: { [roundId]: questions }, suggestions: { [roundId]: suggestions }, revisions: { [ideaId]: [] }, lastChangeSummary: "已由多 Agent 工作流生成初始文档、问题与建议。" };
}

async function createFlow(rawInput: string, config: LlmRuntimeConfig | null): Promise<CreateOutput> {
  const refined = await runAgent<Refined>(IDEA_REFINEMENT_PROMPT, `用户原始想法：\n${rawInput}`, config);
  const docs = await runAgent<Docs>(DOCUMENT_INITIALIZATION_PROMPT, `轻整理后的想法：\n${compact(refined)}`, config, 4500);
  const ambiguity = await runAgent<Ambiguity>(AMBIGUITY_ANALYSIS_PROMPT, `当前阶段：process_clarification\n\n简要文档：\n${docs.briefDocumentMarkdown}\n\n详细文档：\n${docs.livingDocumentMarkdown}`, config);
  const questionOutput = await runAgent<Questions>(QUESTION_GENERATION_PROMPT, `当前阶段：process_clarification\n推荐聚焦：${ambiguity.recommendedFocus}\n模糊点：${compact(ambiguity.ambiguities)}\n\n简要文档：\n${docs.briefDocumentMarkdown}\n\n详细文档：\n${docs.livingDocumentMarkdown}`, config);
  const suggestionOutput = await runAgent<Suggestions>(SUGGESTION_GENERATION_PROMPT, `当前阶段：process_clarification\n问题清单：${compact(questionOutput.questions)}\n\n简要文档：\n${docs.briefDocumentMarkdown}\n\n详细文档：\n${docs.livingDocumentMarkdown}`, config);
  const quality = await runAgent<Quality>(QUALITY_REVIEW_PROMPT, `待检查问题：${compact(questionOutput.questions)}\n\n待检查建议：${compact(suggestionOutput.suggestions)}\n\n文档生成说明：${docs.initialFocus}`, config);
  return { ...refined, ...docs, agentFocus: ambiguity.recommendedFocus || docs.initialFocus, questions: quality.revisedQuestions ?? questionOutput.questions, suggestions: quality.revisedSuggestions ?? suggestionOutput.suggestions };
}

export async function createIdeaWorkspaceWithAgent(rawInput: string, config: LlmRuntimeConfig | null = null): Promise<{ workspace: ThinkingWorkspace; source: "llm" | "fallback" }> {
  if (!isLlmConfigured(config)) return { workspace: createIdeaWorkspace(createEmptyWorkspace(), rawInput), source: "fallback" };
  try { return { workspace: workspaceFromCreate(rawInput, await createFlow(rawInput, config)), source: "llm" }; } catch { return { workspace: createIdeaWorkspace(createEmptyWorkspace(), rawInput), source: "fallback" }; }
}

function summarizeDraft(bundle: NonNullable<ReturnType<typeof getActiveBundle>>, draft: RoundDraftState) {
  return {
    answered: bundle.questions.filter((q) => draft.answers[q.id]?.trim()).map((q) => ({ question: q.question, answer: draft.answers[q.id].trim() })),
    ignoredQuestions: bundle.questions.filter((q) => draft.ignoredQuestions.includes(q.id)).map((q) => q.question),
    adoptedSuggestions: bundle.suggestions.filter((s) => draft.adoptedSuggestions.includes(s.id)).map((s) => ({ suggestion: s.suggestion, adoptionText: s.adoptionText })),
    ignoredSuggestions: bundle.suggestions.filter((s) => draft.ignoredSuggestions.includes(s.id)).map((s) => s.suggestion),
    freeThought: draft.freeThought
  };
}

async function submitFlow(bundle: NonNullable<ReturnType<typeof getActiveBundle>>, draft: RoundDraftState, config: LlmRuntimeConfig | null): Promise<SubmitOutput> {
  if (!bundle.briefDocument || !bundle.livingDocument) throw new Error("当前工作台数据不完整");
  const integrated = await runAgent<Integrated>(USER_FEEDBACK_INTEGRATOR_PROMPT, `当前简要文档：\n${bundle.briefDocument.contentMarkdown}\n\n当前详细文档：\n${bundle.livingDocument.contentMarkdown}\n\n本轮反馈：\n${compact(summarizeDraft(bundle, draft))}`, config);
  const update = await runAgent<UpdatedDocs>(DOCUMENT_UPDATE_PROMPT, `原简要文档：\n${bundle.briefDocument.contentMarkdown}\n\n原详细文档：\n${bundle.livingDocument.contentMarkdown}\n\n结构化用户反馈：\n${compact(integrated)}`, config, 5500);
  const phase = await runAgent<Phase>(PHASE_DECISION_PROMPT, `当前简要文档：\n${update.updatedBriefDocumentMarkdown}\n\n当前详细文档：\n${update.updatedLivingDocumentMarkdown}\n\n本轮更新摘要：${update.changeSummary}\n仍不明确内容：${compact(update.stillUnclear)}`, config);
  const ambiguity = await runAgent<Ambiguity>(AMBIGUITY_ANALYSIS_PROMPT, `当前阶段：${phase.nextPhase}\n推荐聚焦：${phase.recommendedFocus}\n\n简要文档：\n${update.updatedBriefDocumentMarkdown}\n\n详细文档：\n${update.updatedLivingDocumentMarkdown}`, config);
  const questionOutput = await runAgent<Questions>(QUESTION_GENERATION_PROMPT, `当前阶段：${phase.nextPhase}\n推荐聚焦：${ambiguity.recommendedFocus || phase.recommendedFocus}\n模糊点：${compact(ambiguity.ambiguities)}\n\n简要文档：\n${update.updatedBriefDocumentMarkdown}\n\n详细文档：\n${update.updatedLivingDocumentMarkdown}`, config);
  const suggestionOutput = await runAgent<Suggestions>(SUGGESTION_GENERATION_PROMPT, `当前阶段：${phase.nextPhase}\n问题清单：${compact(questionOutput.questions)}\n\n简要文档：\n${update.updatedBriefDocumentMarkdown}\n\n详细文档：\n${update.updatedLivingDocumentMarkdown}`, config);
  const quality = await runAgent<Quality>(QUALITY_REVIEW_PROMPT, `待检查问题：${compact(questionOutput.questions)}\n\n待检查建议：${compact(suggestionOutput.suggestions)}\n\n待检查文档更新摘要：${update.changeSummary}`, config);
  return { ...update, nextPhase: phase.nextPhase, maturityLevel: phase.maturityLevel, agentFocus: phase.recommendedFocus || ambiguity.recommendedFocus || update.suggestedNextFocus, questions: quality.revisedQuestions ?? questionOutput.questions, suggestions: quality.revisedSuggestions ?? suggestionOutput.suggestions };
}

export async function generateProblemDecompositionWithAgent(bundle: NonNullable<ReturnType<typeof getActiveBundle>>, problems: ProblemItem[], config: LlmRuntimeConfig | null = null): Promise<ProblemDecompositionOutput | null> {
  if (!bundle.idea || !bundle.briefDocument || !bundle.livingDocument || !isLlmConfigured(config)) return null;
  const activeProblems = problems.filter((problem) => !problem.isResolved).sort((a, b) => {
    const priorityRank: Record<Priority, number> = { high: 3, medium: 2, low: 1 };
    return priorityRank[b.priority] - priorityRank[a.priority] || b.difficulty - a.difficulty || a.orderIndex - b.orderIndex;
  });
  try {
    return await runAgent<ProblemDecompositionOutput>(PROBLEM_DECOMPOSITION_PROMPT, `当前想法：\n${compact(bundle.idea)}\n\n简要文档：\n${bundle.briefDocument.contentMarkdown}\n\n详细文档：\n${bundle.livingDocument.contentMarkdown}\n\n未解决问题文档（已解决问题默认不参与）：\n${compact(activeProblems)}\n\n当前待处理问题：\n${compact(bundle.questions)}\n\n当前建议：\n${compact(bundle.suggestions)}`, config, 3200);
  } catch {
    return null;
  }
}

export async function submitRoundWithAgent(workspace: ThinkingWorkspace, draft: RoundDraftState, config: LlmRuntimeConfig | null = null): Promise<{ workspace: ThinkingWorkspace; source: "llm" | "fallback" }> {
  const bundle = getActiveBundle(workspace);
  if (!bundle?.idea || !bundle.briefDocument || !bundle.livingDocument || !bundle.currentRound || !isLlmConfigured(config)) return { workspace: submitRound(workspace, draft), source: "fallback" };
  try {
    const output = await submitFlow(bundle, draft, config);
    const fallback = submitRound(workspace, draft);
    const nextBundle = getActiveBundle(fallback);
    if (!nextBundle?.idea || !nextBundle.briefDocument || !nextBundle.livingDocument || !nextBundle.currentRound) return { workspace: fallback, source: "fallback" };
    const now = nowIso();
    const idea = { ...nextBundle.idea, currentPhase: output.nextPhase, maturityLevel: output.maturityLevel, updatedAt: now };
    const docs = [{ ...nextBundle.briefDocument, contentMarkdown: output.updatedBriefDocumentMarkdown, updatedAt: now }, { ...nextBundle.livingDocument, contentMarkdown: output.updatedLivingDocumentMarkdown, updatedAt: now }];
    const round = { ...nextBundle.currentRound, phase: output.nextPhase, agentFocus: output.agentFocus, summaryBefore: output.changeSummary };
    const questions = toQuestions(idea.id, round.id, output.nextPhase, output.questions);
    const suggestions = toSuggestions(idea.id, round.id, questions, output.suggestions);
    return { workspace: { ...fallback, ideas: fallback.ideas.map((x) => x.id === idea.id ? idea : x), documents: { ...fallback.documents, [idea.id]: docs }, rounds: { ...fallback.rounds, [idea.id]: [round, ...(fallback.rounds[idea.id] ?? []).filter((x) => x.id !== round.id)] }, questions: { ...fallback.questions, [round.id]: questions }, suggestions: { ...fallback.suggestions, [round.id]: suggestions }, lastChangeSummary: output.changeSummary }, source: "llm" };
  } catch { return { workspace: submitRound(workspace, draft), source: "fallback" }; }
}
