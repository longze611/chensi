import { createEmptyWorkspace, createIdeaWorkspace, getActiveBundle, setActiveIdea, submitRound } from "./thinking";
import type { RoundDraftState, ThinkingWorkspace } from "./types";

const globalForStore = globalThis as unknown as { thinkingWorkspace?: ThinkingWorkspace };

function workspace() {
  if (!globalForStore.thinkingWorkspace) {
    globalForStore.thinkingWorkspace = createEmptyWorkspace();
  }
  return globalForStore.thinkingWorkspace;
}

function persist(next: ThinkingWorkspace) {
  globalForStore.thinkingWorkspace = next;
  return next;
}

export function createServerIdea(rawInput: string) {
  const next = createIdeaWorkspace(workspace(), rawInput);
  persist(next);
  const bundle = getActiveBundle(next);
  if (!bundle) throw new Error("创建想法失败");
  return bundle;
}

export function getServerWorkspace(ideaId: string) {
  const next = persist(setActiveIdea(workspace(), ideaId));
  return getActiveBundle(next);
}

export function submitServerRound(ideaId: string, roundId: string, draft: RoundDraftState) {
  const current = persist(setActiveIdea(workspace(), ideaId));
  const bundle = getActiveBundle(current);
  if (!bundle?.currentRound || bundle.currentRound.id !== roundId) return null;
  const next = submitRound(current, draft);
  persist(next);
  return getActiveBundle(next);
}

export function getAllServerIdeas() {
  return workspace().ideas;
}

export function getServerState() {
  return workspace();
}

export function resetServerState() {
  return persist(createEmptyWorkspace());
}
