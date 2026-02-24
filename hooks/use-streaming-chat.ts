import { useState, useCallback } from "react";
import type {
  BrDraft,
  ChatLocation,
  ChatMessage,
  ChatProgressStep,
  DdDraft,
  SrDraft,
  SfDraft,
} from "@/components/ai-chat/types";
import type { ReasoningEffort } from "@/lib/mastra/reasoning-effort";
import type { ConceptCandidate } from "@/components/ai-chat/concept-suggestion";

type UseStreamingChatOptions = {
  threadId: string;
  resourceId?: string;
  location?: ChatLocation;
  projectId?: string;
  reasoningEffort: ReasoningEffort;
  onConceptCandidates?: (candidates: ConceptCandidate[]) => void;
};

type UseStreamingChatReturn = {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void | (() => void)>;
};

type DraftType = "bt" | "br" | "sf" | "sr" | "dd";
type StreamEventPayload = {
  event?: string;
  content?: string;
  error?: boolean;
  message?: string;
  step?: ChatProgressStep;
  draftType?: string;
  draft?: unknown;
  candidates?: unknown;
};

const REQUEST_TIMEOUT_MS = 180_000;
const CHUNK_TIMEOUT_MS = 30_000;
const ASSISTANT_SYNC_INTERVAL_MS = 50;

const upsertProgressStep = (
  steps: ChatProgressStep[] | undefined,
  incoming: ChatProgressStep
) => {
  const nextSteps = steps ? [...steps] : [];
  const existingIndex = nextSteps.findIndex((step) => step.id === incoming.id);

  if (existingIndex >= 0) {
    const existing = nextSteps[existingIndex];
    nextSteps[existingIndex] = {
      ...existing,
      ...incoming,
      detail: incoming.detail ?? existing.detail,
    };
  } else {
    nextSteps.push(incoming);
  }

  return nextSteps.sort((a, b) => a.index - b.index);
};

const upsertDraftByCode = <T extends { code?: string; id?: string }>(
  drafts: T[] | undefined,
  incoming: T
) => {
  const nextDrafts = drafts ? [...drafts] : [];
  const incomingKey = incoming.code ?? incoming.id ?? "";
  const existingIndex = nextDrafts.findIndex(
    (draft) => (draft.code ?? draft.id) === incomingKey
  );

  if (existingIndex >= 0) {
    nextDrafts[existingIndex] = {
      ...nextDrafts[existingIndex],
      ...incoming,
    };
  } else {
    nextDrafts.push(incoming);
  }

  return nextDrafts;
};

const upsertMessage = (
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  messageId: string,
  updater: (message: ChatMessage) => ChatMessage
) => {
  setMessages((prev) => {
    let index = -1;
    for (let i = prev.length - 1; i >= 0; i -= 1) {
      if (prev[i].id === messageId) {
        index = i;
        break;
      }
    }
    if (index < 0) return prev;

    const next = [...prev];
    next[index] = updater(prev[index]);
    return next;
  });
};

const appendMessage = (
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  message: ChatMessage
) => {
  setMessages((prev) => [...prev, message]);
};

const isJsonSyntaxError = (error: unknown) =>
  error instanceof SyntaxError ||
  (error instanceof Error && error.message.includes("JSON"));

const isAbortError = (error: unknown) =>
  error instanceof DOMException && error.name === "AbortError";

const normalizeDraftType = (value: string | undefined): DraftType =>
  value === "br" || value === "sf" || value === "sr" || value === "dd" || value === "bt"
    ? value
    : "bt";

const toSseEvents = (buffer: string): { completeEvents: string[]; remaining: string } => {
  const split = buffer.split("\n\n");
  return {
    completeEvents: split.slice(0, -1),
    remaining: split[split.length - 1] ?? "",
  };
};

const extractDataLines = (eventBlock: string): string[] =>
  eventBlock
    .split("\n")
    .filter((line) => line.startsWith("data: "))
    .map((line) => line.slice(6).trim());

const applyDraftUpdate = (
  assistantMessage: ChatMessage,
  draftType: DraftType,
  draft: unknown
) => {
  switch (draftType) {
    case "br": {
      const nextDraft = draft as BrDraft;
      assistantMessage.brDraft = nextDraft;
      assistantMessage.brDrafts = upsertDraftByCode(assistantMessage.brDrafts, nextDraft);
      return;
    }
    case "sf": {
      assistantMessage.sfDraft = draft as SfDraft;
      return;
    }
    case "sr": {
      const nextDraft = draft as SrDraft;
      assistantMessage.srDraft = nextDraft;
      assistantMessage.srDrafts = upsertDraftByCode(assistantMessage.srDrafts, nextDraft);
      return;
    }
    case "dd": {
      const nextDraft = draft as DdDraft;
      assistantMessage.ddDraft = nextDraft;
      assistantMessage.ddDrafts = upsertDraftByCode(assistantMessage.ddDrafts, nextDraft);
      return;
    }
    case "bt":
    default: {
      assistantMessage.btDraft = draft as ChatMessage["btDraft"];
      return;
    }
  }
};

const syncAssistantMessage = (
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  assistantMessage: ChatMessage
) => {
  upsertMessage(setMessages, assistantMessage.id, () => ({ ...assistantMessage }));
};

/**
 * ストリーミングチャットフック
 *
 * チャットメッセージの送信とストリーミングレスポンスの処理を担当する。
 */
export function useStreamingChat(options: UseStreamingChatOptions): UseStreamingChatReturn {
  const {
    threadId,
    resourceId,
    location,
    projectId,
    reasoningEffort,
    onConceptCandidates,
  } = options;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * メッセージを送信する
   */
  const sendMessage = useCallback(
    async (content: string) => {
      const abortController = new AbortController();
      let aborted = false;
      let assistantSyncTimer: number | null = null;

      onConceptCandidates?.([]);

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date(),
      };
      appendMessage(setMessages, userMessage);
      setIsLoading(true);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
        progressSteps: [],
      };

      const flushAssistantSync = () => {
        if (assistantSyncTimer !== null) {
          window.clearTimeout(assistantSyncTimer);
          assistantSyncTimer = null;
        }
        syncAssistantMessage(setMessages, assistantMessage);
      };

      const scheduleAssistantSync = () => {
        if (assistantSyncTimer !== null) return;
        assistantSyncTimer = window.setTimeout(() => {
          assistantSyncTimer = null;
          syncAssistantMessage(setMessages, assistantMessage);
        }, ASSISTANT_SYNC_INTERVAL_MS);
      };

      const timeoutId = setTimeout(() => {
        if (!aborted) {
          console.warn("[Chat] Request timeout - forcing loading state to false");
          aborted = true;
          abortController.abort();
        }
      }, REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: content,
            threadId,
            resourceId,
            projectId,
            location,
            streaming: true,
            reasoningEffort,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string };
          throw new Error(errorData.error || "メッセージの送信に失敗しました");
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("ストリーミングレスポンスが取得できませんでした");
        }

        const decoder = new TextDecoder();
        appendMessage(setMessages, assistantMessage);

        let lastChunkTime = Date.now();
        let buffer = "";

        while (!aborted) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          if (value) {
            lastChunkTime = Date.now();
            buffer += decoder.decode(value, { stream: true });
          }

          const { completeEvents, remaining } = toSseEvents(buffer);
          buffer = remaining;

          for (const eventBlock of completeEvents) {
            for (const payloadText of extractDataLines(eventBlock)) {
              if (payloadText === "[DONE]") {
                flushAssistantSync();
                aborted = true;
                break;
              }

              try {
                const payload = JSON.parse(payloadText) as StreamEventPayload;

                if (payload.error) {
                  throw new Error(payload.message || "ストリーミングエラーが発生しました");
                }

                if (payload.event === "heartbeat") {
                  continue;
                }

                if (payload.event === "progress" && payload.step) {
                  assistantMessage.progressSteps = upsertProgressStep(
                    assistantMessage.progressSteps,
                    payload.step
                  );
                  scheduleAssistantSync();
                  continue;
                }

                if (payload.event === "draft" && payload.draft) {
                  const draftType = normalizeDraftType(payload.draftType);
                  applyDraftUpdate(assistantMessage, draftType, payload.draft);
                  scheduleAssistantSync();
                  continue;
                }

                if (payload.event === "concept_candidates") {
                  const candidates = Array.isArray(payload.candidates)
                    ? (payload.candidates as ConceptCandidate[])
                    : [];
                  onConceptCandidates?.(candidates);
                  continue;
                }

                if (payload.content) {
                  assistantMessage.content += payload.content;
                  scheduleAssistantSync();
                }
              } catch (error) {
                if (!isJsonSyntaxError(error)) {
                  throw error;
                }
              }
            }

            if (aborted) {
              break;
            }
          }

          if (Date.now() - lastChunkTime > CHUNK_TIMEOUT_MS) {
            console.warn("[Chat] No chunk received for 30 seconds - assuming stream ended");
            aborted = true;
            break;
          }
        }
      } catch (error) {
        if (isAbortError(error)) {
          if (aborted) {
            appendMessage(setMessages, {
              id: `timeout-${Date.now()}`,
              role: "system",
              content:
                "リクエストがタイムアウトしました（180秒）。ネットワーク接続を確認してください。",
              timestamp: new Date(),
            });
          }
          return;
        }

        const errorMessage =
          error instanceof Error ? error.message : "不明なエラーが発生しました";
        appendMessage(setMessages, {
          id: `error-${Date.now()}`,
          role: "system",
          content: `エラーが発生しました: ${errorMessage}`,
          timestamp: new Date(),
        });
      } finally {
        clearTimeout(timeoutId);
        flushAssistantSync();
        setIsLoading(false);
        upsertMessage(setMessages, assistantMessage.id, (message) => ({
          ...message,
          isStreaming: false,
        }));
      }

      return () => {
        aborted = true;
        abortController.abort();
      };
    },
    [threadId, resourceId, location, projectId, reasoningEffort, onConceptCandidates]
  );

  return {
    messages,
    setMessages,
    isLoading,
    sendMessage,
  };
}
