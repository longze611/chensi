import { randomUUID } from "crypto";
import { getActiveBundle } from "./thinking";
import { createIdeaWorkspaceWithAgent, generateProblemDecompositionWithAgent, submitRoundWithAgent } from "./agent-orchestrator";
import { prisma } from "./prisma";
import { getAiSettingForRuntime } from "./ai-settings-store";
import type { DocumentRevision, Idea, IdeaDocument, IterationRound, Priority, ProblemItem, QuestionItem, RoundDraftState, SuggestionItem, ThinkingWorkspace } from "./types";

type IdeaWithRelations = {
  id: string;
  userId: string;
  rawInput: string;
  refinedIdea: string;
  title: string;
  briefSummary: string;
  domain: string;
  tags: unknown;
  currentPhase: string;
  maturityLevel: string;
  iterationCount: number;
  createdAt: Date;
  updatedAt: Date;
  documents: Array<{
    id: string;
    ideaId: string;
    type: string;
    title: string;
    contentMarkdown: string;
    contentJson?: unknown | null;
    version: number;
    lastUpdatedBy: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  rounds: Array<{
    id: string;
    ideaId: string;
    roundNumber: number;
    phase: string;
    status: string;
    agentFocus: string | null;
    summaryBefore: string | null;
    summaryAfter: string | null;
    createdAt: Date;
    submittedAt: Date | null;
    processedAt: Date | null;
  }>;
  questions: Array<{
    id: string;
    roundId: string;
    ideaId: string;
    stage: string;
    relatedSection: string | null;
    relatedTaskOrModule: string | null;
    question: string;
    explanation: string;
    whyItMatters: string;
    priority: string;
    answer: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  suggestions: Array<{
    id: string;
    roundId: string;
    ideaId: string;
    relatedQuestionId: string | null;
    relatedSection: string | null;
    suggestion: string;
    rationale: string;
    expectedImpact: string;
    possibleRisk: string | null;
    adoptionText: string | null;
    type: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  revisions: Array<{
    id: string;
    ideaId: string;
    documentId: string;
    roundId: string;
    versionBefore: number;
    versionAfter: number;
    changeSummary: string;
    diff: string | null;
    createdAt: Date;
  }>;
};

const ideaInclude = {
  documents: true,
  rounds: { orderBy: { roundNumber: "desc" as const } },
  revisions: { orderBy: { createdAt: "desc" as const } },
  questions: true,
  suggestions: true
};

function iso(date: Date) {
  return date.toISOString();
}

function toIdea(row: IdeaWithRelations): Idea {
  return {
    id: row.id,
    userId: row.userId,
    rawInput: row.rawInput,
    refinedIdea: row.refinedIdea,
    title: row.title,
    briefSummary: row.briefSummary,
    domain: row.domain as Idea["domain"],
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    currentPhase: row.currentPhase as Idea["currentPhase"],
    maturityLevel: row.maturityLevel as Idea["maturityLevel"],
    iterationCount: row.iterationCount,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt)
  };
}

function toDocument(row: IdeaWithRelations["documents"][number]): IdeaDocument {
  return { id: row.id, ideaId: row.ideaId, type: row.type as IdeaDocument["type"], title: row.title, contentMarkdown: row.contentMarkdown, contentJson: (row as { contentJson?: unknown }).contentJson ?? undefined, version: row.version, lastUpdatedBy: row.lastUpdatedBy as IdeaDocument["lastUpdatedBy"], createdAt: iso(row.createdAt), updatedAt: iso(row.updatedAt) };
}

function toRound(row: IdeaWithRelations["rounds"][number]): IterationRound {
  return { id: row.id, ideaId: row.ideaId, roundNumber: row.roundNumber, phase: row.phase as IterationRound["phase"], status: row.status as IterationRound["status"], agentFocus: row.agentFocus ?? "", summaryBefore: row.summaryBefore ?? "", summaryAfter: row.summaryAfter ?? undefined, createdAt: iso(row.createdAt), submittedAt: row.submittedAt ? iso(row.submittedAt) : undefined, processedAt: row.processedAt ? iso(row.processedAt) : undefined };
}

function toQuestion(row: IdeaWithRelations["questions"][number]): QuestionItem {
  return { id: row.id, roundId: row.roundId, ideaId: row.ideaId, stage: row.stage as QuestionItem["stage"], relatedSection: row.relatedSection ?? undefined, relatedTaskOrModule: row.relatedTaskOrModule ?? undefined, question: row.question, explanation: row.explanation, whyItMatters: row.whyItMatters, priority: row.priority as QuestionItem["priority"], answer: row.answer ?? undefined, status: row.status as QuestionItem["status"], createdAt: iso(row.createdAt), updatedAt: iso(row.updatedAt) };
}

function toSuggestion(row: IdeaWithRelations["suggestions"][number]): SuggestionItem {
  return { id: row.id, roundId: row.roundId, ideaId: row.ideaId, relatedQuestionId: row.relatedQuestionId ?? undefined, relatedSection: row.relatedSection ?? undefined, suggestion: row.suggestion, rationale: row.rationale, expectedImpact: row.expectedImpact, possibleRisk: row.possibleRisk ?? undefined, adoptionText: row.adoptionText ?? undefined, type: row.type as SuggestionItem["type"], status: row.status as SuggestionItem["status"], createdAt: iso(row.createdAt), updatedAt: iso(row.updatedAt) };
}

function toRevision(row: IdeaWithRelations["revisions"][number]): DocumentRevision {
  return { id: row.id, ideaId: row.ideaId, documentId: row.documentId, roundId: row.roundId, versionBefore: row.versionBefore, versionAfter: row.versionAfter, changeSummary: row.changeSummary, diff: row.diff ?? undefined, createdAt: iso(row.createdAt) };
}

type ProblemRow = {
  id: string;
  ideaId: string;
  roundId: string | null;
  content: string;
  priority: string;
  difficulty: number;
  isResolved: boolean | number;
  source: string;
  mergeKey: string | null;
  decomposition: unknown | string | null;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
};

function normalizeDifficulty(value: number): ProblemItem["difficulty"] {
  const rounded = Math.min(5, Math.max(1, Math.round(value || 3)));
  return rounded as ProblemItem["difficulty"];
}

function toProblem(row: ProblemRow): ProblemItem {
  let decomposition = row.decomposition ?? undefined;
  if (typeof decomposition === "string") {
    try { decomposition = JSON.parse(decomposition); } catch { decomposition = undefined; }
  }
  return {
    id: row.id,
    ideaId: row.ideaId,
    roundId: row.roundId ?? undefined,
    content: row.content,
    priority: (row.priority === "high" || row.priority === "low" ? row.priority : "medium") as Priority,
    difficulty: normalizeDifficulty(row.difficulty),
    isResolved: Boolean(row.isResolved),
    source: row.source === "agent" ? "agent" : "user",
    mergeKey: row.mergeKey ?? undefined,
    decomposition,
    orderIndex: row.orderIndex,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt)
  };
}

function problemId() {
  return `problem_${randomUUID().replace(/-/g, "").slice(0, 18)}`;
}

function workspaceFromIdea(row: IdeaWithRelations): ThinkingWorkspace {
  const idea = toIdea(row);
  const rounds = row.rounds.map(toRound);
  return {
    ideas: [idea],
    activeIdeaId: idea.id,
    documents: { [idea.id]: row.documents.map(toDocument) },
    rounds: { [idea.id]: rounds },
    questions: Object.fromEntries(rounds.map((round) => [round.id, row.questions.filter((item) => item.roundId === round.id).map(toQuestion)])),
    suggestions: Object.fromEntries(rounds.map((round) => [round.id, row.suggestions.filter((item) => item.roundId === round.id).map(toSuggestion)])),
    revisions: { [idea.id]: row.revisions.map(toRevision) }
  };
}

async function saveWorkspaceToDb(workspace: ThinkingWorkspace, ideaId: string) {
  const idea = workspace.ideas.find((item) => item.id === ideaId);
  if (!idea) throw new Error("待保存想法不存在");
  const docs = workspace.documents[ideaId] ?? [];
  const rounds = workspace.rounds[ideaId] ?? [];
  const revisions = workspace.revisions[ideaId] ?? [];

  await prisma.$transaction(async (tx) => {
    await tx.idea.upsert({
      where: { id: idea.id },
      create: { id: idea.id, userId: idea.userId, rawInput: idea.rawInput, refinedIdea: idea.refinedIdea, title: idea.title, briefSummary: idea.briefSummary, domain: idea.domain, tags: idea.tags, currentPhase: idea.currentPhase, maturityLevel: idea.maturityLevel, iterationCount: idea.iterationCount, createdAt: new Date(idea.createdAt), updatedAt: new Date(idea.updatedAt) },
      update: { rawInput: idea.rawInput, refinedIdea: idea.refinedIdea, title: idea.title, briefSummary: idea.briefSummary, domain: idea.domain, tags: idea.tags, currentPhase: idea.currentPhase, maturityLevel: idea.maturityLevel, iterationCount: idea.iterationCount, updatedAt: new Date(idea.updatedAt) }
    });

    for (const doc of docs) {
      await tx.ideaDocument.upsert({
        where: { id: doc.id },
        create: { id: doc.id, ideaId: doc.ideaId, type: doc.type, title: doc.title, contentMarkdown: doc.contentMarkdown, ...((doc.contentJson !== undefined ? { contentJson: doc.contentJson } : {}) as Record<string, unknown>), version: doc.version, lastUpdatedBy: doc.lastUpdatedBy, createdAt: new Date(doc.createdAt), updatedAt: new Date(doc.updatedAt) } as never,
        update: { title: doc.title, contentMarkdown: doc.contentMarkdown, ...((doc.contentJson !== undefined ? { contentJson: doc.contentJson } : {}) as Record<string, unknown>), version: doc.version, lastUpdatedBy: doc.lastUpdatedBy, updatedAt: new Date(doc.updatedAt) } as never
      });
    }

    for (const round of rounds) {
      await tx.iterationRound.upsert({
        where: { id: round.id },
        create: { id: round.id, ideaId: round.ideaId, roundNumber: round.roundNumber, phase: round.phase, status: round.status, agentFocus: round.agentFocus, summaryBefore: round.summaryBefore, summaryAfter: round.summaryAfter, createdAt: new Date(round.createdAt), submittedAt: round.submittedAt ? new Date(round.submittedAt) : undefined, processedAt: round.processedAt ? new Date(round.processedAt) : undefined },
        update: { phase: round.phase, status: round.status, agentFocus: round.agentFocus, summaryBefore: round.summaryBefore, summaryAfter: round.summaryAfter, submittedAt: round.submittedAt ? new Date(round.submittedAt) : undefined, processedAt: round.processedAt ? new Date(round.processedAt) : undefined }
      });

      for (const question of workspace.questions[round.id] ?? []) {
        await tx.questionItem.upsert({
          where: { id: question.id },
          create: { id: question.id, roundId: question.roundId, ideaId: question.ideaId, stage: question.stage, relatedSection: question.relatedSection, relatedTaskOrModule: question.relatedTaskOrModule, question: question.question, explanation: question.explanation, whyItMatters: question.whyItMatters, priority: question.priority, answer: question.answer, status: question.status, createdAt: new Date(question.createdAt), updatedAt: new Date(question.updatedAt) },
          update: { answer: question.answer, status: question.status, updatedAt: new Date(question.updatedAt) }
        });
      }

      for (const suggestion of workspace.suggestions[round.id] ?? []) {
        await tx.suggestionItem.upsert({
          where: { id: suggestion.id },
          create: { id: suggestion.id, roundId: suggestion.roundId, ideaId: suggestion.ideaId, relatedQuestionId: suggestion.relatedQuestionId, relatedSection: suggestion.relatedSection, suggestion: suggestion.suggestion, rationale: suggestion.rationale, expectedImpact: suggestion.expectedImpact, possibleRisk: suggestion.possibleRisk, adoptionText: suggestion.adoptionText, type: suggestion.type, status: suggestion.status, createdAt: new Date(suggestion.createdAt), updatedAt: new Date(suggestion.updatedAt) },
          update: { status: suggestion.status, updatedAt: new Date(suggestion.updatedAt) }
        });
      }
    }

    for (const revision of revisions) {
      await tx.documentRevision.upsert({
        where: { id: revision.id },
        create: { id: revision.id, ideaId: revision.ideaId, documentId: revision.documentId, roundId: revision.roundId, versionBefore: revision.versionBefore, versionAfter: revision.versionAfter, changeSummary: revision.changeSummary, diff: revision.diff, createdAt: new Date(revision.createdAt) },
        update: { changeSummary: revision.changeSummary, diff: revision.diff }
      });
    }
  });
}

export async function createDbIdea(rawInput: string) {
  const { workspace } = await createIdeaWorkspaceWithAgent(rawInput, await getAiSettingForRuntime());
  const ideaId = workspace.activeIdeaId;
  if (!ideaId) throw new Error("创建想法失败");
  await saveWorkspaceToDb(workspace, ideaId);
  return getDbWorkspace(ideaId);
}

export async function getDbWorkspace(ideaId: string) {
  const row = await prisma.idea.findUnique({ where: { id: ideaId }, include: ideaInclude });
  if (!row) return null;
  return getActiveBundle(workspaceFromIdea(row));
}

async function applyProblemDecomposition(ideaId: string, roundId: string) {
  const bundle = await getDbWorkspace(ideaId);
  if (!bundle) return;
  const existing = await listDbProblems(ideaId);
  const output = await generateProblemDecompositionWithAgent(bundle, existing, await getAiSettingForRuntime());
  if (!output?.problems?.length) return;
  const active = existing.filter((item) => !item.isResolved);
  for (const draft of output.problems) {
    const target = active.find((item) => item.content === draft.mergeWithExistingContent || item.content.includes(draft.content) || draft.content.includes(item.content));
    if (target) {
      const priorityRank: Record<Priority, number> = { low: 1, medium: 2, high: 3 };
      await updateDbProblem(ideaId, target.id, {
        priority: priorityRank[draft.priority] > priorityRank[target.priority] ? draft.priority : target.priority,
        difficulty: Math.max(draft.difficulty, target.difficulty),
        decomposition: draft.decomposition
      });
    } else {
      await createDbProblem(ideaId, { content: draft.content, priority: draft.priority, difficulty: draft.difficulty, source: "agent", roundId, decomposition: draft.decomposition });
    }
  }
}

export async function submitDbRound(ideaId: string, roundId: string, draft: RoundDraftState) {
  const row = await prisma.idea.findUnique({ where: { id: ideaId }, include: ideaInclude });
  if (!row) return null;
  const workspace = workspaceFromIdea(row);
  const current = getActiveBundle(workspace);
  if (!current?.currentRound || current.currentRound.id !== roundId) return null;
  const { workspace: next } = await submitRoundWithAgent(workspace, draft, await getAiSettingForRuntime());
  await saveWorkspaceToDb(next, ideaId);
  await applyProblemDecomposition(ideaId, roundId);
  return getDbWorkspace(ideaId);
}

export async function updateDbDocument(ideaId: string, documentId: string, input: { contentMarkdown: string; contentJson?: unknown }) {
  const existing = await prisma.ideaDocument.findFirst({ where: { id: documentId, ideaId } });
  if (!existing) return null;
  await prisma.$executeRaw`
    UPDATE IdeaDocument
    SET contentMarkdown = ${input.contentMarkdown},
        contentJson = ${input.contentJson === undefined ? null : JSON.stringify(input.contentJson)},
        version = version + 1,
        lastUpdatedBy = 'user',
        updatedAt = NOW(3)
    WHERE id = ${documentId} AND ideaId = ${ideaId}
  `;
  const row = await prisma.ideaDocument.findUnique({ where: { id: documentId } });
  if (!row) return null;
  return { id: row.id, ideaId: row.ideaId, type: row.type as IdeaDocument["type"], title: row.title, contentMarkdown: row.contentMarkdown, contentJson: input.contentJson, version: row.version, lastUpdatedBy: row.lastUpdatedBy as IdeaDocument["lastUpdatedBy"], createdAt: iso(row.createdAt), updatedAt: iso(row.updatedAt) };
}

export async function listDbProblems(ideaId: string) {
  const rows = await prisma.$queryRaw<ProblemRow[]>`
    SELECT id, ideaId, roundId, content, priority, difficulty, isResolved, source, mergeKey, decomposition, orderIndex, createdAt, updatedAt
    FROM ProblemItem
    WHERE ideaId = ${ideaId}
    ORDER BY isResolved ASC, orderIndex ASC, updatedAt DESC
  `;
  return rows.map(toProblem);
}

export async function createDbProblem(ideaId: string, input: { content: string; priority?: Priority; difficulty?: number; source?: "user" | "agent"; roundId?: string; decomposition?: unknown; mergeKey?: string }) {
  const current = await listDbProblems(ideaId);
  const id = problemId();
  const priority = input.priority ?? "medium";
  const difficulty = normalizeDifficulty(input.difficulty ?? 3);
  const source = input.source ?? "user";
  const orderIndex = current.length ? Math.max(...current.map((item) => item.orderIndex)) + 1 : 0;
  await prisma.$executeRaw`
    INSERT INTO ProblemItem (id, ideaId, roundId, content, priority, difficulty, isResolved, source, mergeKey, decomposition, orderIndex, createdAt, updatedAt)
    VALUES (${id}, ${ideaId}, ${input.roundId ?? null}, ${input.content}, ${priority}, ${difficulty}, false, ${source}, ${input.mergeKey ?? null}, ${input.decomposition === undefined ? null : JSON.stringify(input.decomposition)}, ${orderIndex}, NOW(3), NOW(3))
  `;
  const rows = await prisma.$queryRaw<ProblemRow[]>`SELECT id, ideaId, roundId, content, priority, difficulty, isResolved, source, mergeKey, decomposition, orderIndex, createdAt, updatedAt FROM ProblemItem WHERE id = ${id}`;
  return rows[0] ? toProblem(rows[0]) : null;
}

export async function updateDbProblem(ideaId: string, problemId: string, input: Partial<{ content: string; priority: Priority; difficulty: number; isResolved: boolean; decomposition: unknown; mergeKey: string; orderIndex: number }>) {
  const existing = (await prisma.$queryRaw<ProblemRow[]>`SELECT id, ideaId, roundId, content, priority, difficulty, isResolved, source, mergeKey, decomposition, orderIndex, createdAt, updatedAt FROM ProblemItem WHERE id = ${problemId} AND ideaId = ${ideaId}`)[0];
  if (!existing) return null;
  const next = {
    content: input.content ?? existing.content,
    priority: input.priority ?? (existing.priority as Priority),
    difficulty: normalizeDifficulty(input.difficulty ?? existing.difficulty),
    isResolved: input.isResolved ?? Boolean(existing.isResolved),
    decomposition: input.decomposition === undefined ? existing.decomposition : input.decomposition,
    mergeKey: input.mergeKey ?? existing.mergeKey,
    orderIndex: input.orderIndex ?? existing.orderIndex
  };
  await prisma.$executeRaw`
    UPDATE ProblemItem
    SET content = ${next.content}, priority = ${next.priority}, difficulty = ${next.difficulty}, isResolved = ${next.isResolved}, decomposition = ${next.decomposition === undefined || next.decomposition === null ? null : JSON.stringify(next.decomposition)}, mergeKey = ${next.mergeKey}, orderIndex = ${next.orderIndex}, updatedAt = NOW(3)
    WHERE id = ${problemId} AND ideaId = ${ideaId}
  `;
  const rows = await prisma.$queryRaw<ProblemRow[]>`SELECT id, ideaId, roundId, content, priority, difficulty, isResolved, source, mergeKey, decomposition, orderIndex, createdAt, updatedAt FROM ProblemItem WHERE id = ${problemId}`;
  return rows[0] ? toProblem(rows[0]) : null;
}

export async function deleteDbProblem(ideaId: string, problemId: string) {
  await prisma.$executeRaw`DELETE FROM ProblemItem WHERE id = ${problemId} AND ideaId = ${ideaId}`;
}

export async function reorderDbProblems(ideaId: string, orderedIds: string[]) {
  for (const [index, id] of orderedIds.entries()) {
    await prisma.$executeRaw`UPDATE ProblemItem SET orderIndex = ${index}, updatedAt = NOW(3) WHERE id = ${id} AND ideaId = ${ideaId}`;
  }
  return listDbProblems(ideaId);
}

export async function mergeDbProblems(ideaId: string, sourceId: string, targetId: string) {
  const rows = await prisma.$queryRaw<ProblemRow[]>`SELECT id, ideaId, roundId, content, priority, difficulty, isResolved, source, mergeKey, decomposition, orderIndex, createdAt, updatedAt FROM ProblemItem WHERE ideaId = ${ideaId} AND (id = ${sourceId} OR id = ${targetId})`;
  const source = rows.find((item) => item.id === sourceId);
  const target = rows.find((item) => item.id === targetId);
  if (!source || !target) return null;
  const priorityRank: Record<string, number> = { low: 1, medium: 2, high: 3 };
  const priority = priorityRank[source.priority] > priorityRank[target.priority] ? source.priority : target.priority;
  const content = `${target.content}\n合并补充：${source.content}`;
  await updateDbProblem(ideaId, targetId, { content, priority: priority as Priority, difficulty: Math.max(source.difficulty, target.difficulty), decomposition: { mergedFrom: source.id, previous: source.decomposition, added: source.content } });
  await deleteDbProblem(ideaId, sourceId);
  return listDbProblems(ideaId);
}

export async function deleteDbIdea(ideaId: string) {
  await prisma.idea.delete({ where: { id: ideaId } });
}

export async function getDbIdeas() {
  const rows = await prisma.idea.findMany({ orderBy: { updatedAt: "desc" }, take: 50, include: ideaInclude });
  return rows.map(toIdea);
}
