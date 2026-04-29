export type IdeaDomain = "software_product" | "fiction" | "art" | "research" | "business" | "learning" | "other";
export type IdeaPhase = "process_clarification" | "task_deepening" | "free_iteration";
export type MaturityLevel = "seed" | "rough" | "structured" | "deepening" | "mature";
export type Priority = "high" | "medium" | "low";
export type ProblemSource = "user" | "agent";
export type QuestionStage = "process" | "task";
export type ItemStatus = "pending" | "answered" | "ignored";
export type SuggestionStatus = "pending" | "adopted" | "ignored";

export interface Idea {
  id: string;
  userId: string;
  rawInput: string;
  refinedIdea: string;
  title: string;
  briefSummary: string;
  domain: IdeaDomain;
  tags: string[];
  currentPhase: IdeaPhase;
  maturityLevel: MaturityLevel;
  iterationCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface IdeaDocument {
  id: string;
  ideaId: string;
  type: "brief" | "living";
  title: string;
  contentMarkdown: string;
  contentJson?: unknown;
  version: number;
  lastUpdatedBy: "agent" | "user";
  createdAt: string;
  updatedAt: string;
}

export interface IterationRound {
  id: string;
  ideaId: string;
  roundNumber: number;
  phase: IdeaPhase;
  status: "open" | "submitted" | "processed" | "archived";
  agentFocus: string;
  summaryBefore: string;
  summaryAfter?: string;
  createdAt: string;
  submittedAt?: string;
  processedAt?: string;
}

export interface QuestionItem {
  id: string;
  roundId: string;
  ideaId: string;
  stage: QuestionStage;
  relatedSection?: string;
  relatedTaskOrModule?: string;
  question: string;
  explanation: string;
  whyItMatters: string;
  priority: Priority;
  answer?: string;
  status: ItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SuggestionItem {
  id: string;
  roundId: string;
  ideaId: string;
  relatedQuestionId?: string;
  relatedSection?: string;
  suggestion: string;
  rationale: string;
  expectedImpact: string;
  possibleRisk?: string;
  adoptionText?: string;
  type: "structure" | "content" | "clarity" | "scope" | "mechanism" | "experience" | "risk" | "alternative";
  status: SuggestionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentRevision {
  id: string;
  ideaId: string;
  documentId: string;
  roundId: string;
  versionBefore: number;
  versionAfter: number;
  changeSummary: string;
  diff?: string;
  createdAt: string;
}

export interface ProblemItem {
  id: string;
  ideaId: string;
  roundId?: string;
  content: string;
  priority: Priority;
  difficulty: 1 | 2 | 3 | 4 | 5;
  isResolved: boolean;
  source: ProblemSource;
  mergeKey?: string;
  decomposition?: unknown;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface ThinkingWorkspace {
  ideas: Idea[];
  activeIdeaId: string | null;
  documents: Record<string, IdeaDocument[]>;
  rounds: Record<string, IterationRound[]>;
  questions: Record<string, QuestionItem[]>;
  suggestions: Record<string, SuggestionItem[]>;
  revisions: Record<string, DocumentRevision[]>;
  lastChangeSummary?: string;
}

export interface RoundDraftState {
  answers: Record<string, string>;
  ignoredQuestions: string[];
  adoptedSuggestions: string[];
  ignoredSuggestions: string[];
  freeThought: string;
}
