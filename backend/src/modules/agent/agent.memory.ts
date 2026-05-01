import type { AgentAction } from "./agent.schemas.js";

export type AgentMemoryMessage = {
  role: "user" | "assistant";
  content: string;
};

type ConversationState = {
  history: AgentMemoryMessage[];
  pendingAction?: AgentAction;
  updatedAt: number;
};

const MAX_HISTORY_ITEMS = 12;
const MAX_AGE_MS = 60 * 60 * 1000;

export class AgentConversationMemory {
  private readonly conversations = new Map<string, ConversationState>();

  get(conversationId: string | undefined): ConversationState | null {
    if (!conversationId) {
      return null;
    }

    const state = this.conversations.get(conversationId);
    if (!state) {
      return null;
    }

    if (Date.now() - state.updatedAt > MAX_AGE_MS) {
      this.conversations.delete(conversationId);
      return null;
    }

    return {
      history: [...state.history],
      pendingAction: state.pendingAction,
      updatedAt: state.updatedAt,
    };
  }

  remember(input: {
    conversationId?: string;
    userMessage?: string;
    assistantMessage?: string;
    pendingAction?: AgentAction;
    clearPendingAction?: boolean;
  }) {
    if (!input.conversationId) {
      return;
    }

    const existing = this.conversations.get(input.conversationId);
    const history = [...(existing?.history ?? [])];

    if (input.userMessage) {
      history.push({ role: "user", content: input.userMessage });
    }

    if (input.assistantMessage) {
      history.push({ role: "assistant", content: input.assistantMessage });
    }

    this.conversations.set(input.conversationId, {
      history: compactHistory(history),
      pendingAction: input.clearPendingAction ? undefined : input.pendingAction ?? existing?.pendingAction,
      updatedAt: Date.now(),
    });
  }
}

export const agentConversationMemory = new AgentConversationMemory();

export function mergeHistories(
  stored: AgentMemoryMessage[] | undefined,
  provided: AgentMemoryMessage[] | undefined,
): AgentMemoryMessage[] {
  const merged = [...(stored ?? []), ...(provided ?? [])];
  return compactHistory(merged);
}

function compactHistory(history: AgentMemoryMessage[]) {
  const deduped: AgentMemoryMessage[] = [];

  for (const item of history) {
    const previous = deduped[deduped.length - 1];
    if (previous?.role === item.role && previous.content === item.content) {
      continue;
    }
    deduped.push(item);
  }

  return deduped.slice(-MAX_HISTORY_ITEMS);
}
