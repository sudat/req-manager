import { useState, useCallback } from 'react';
import type { ChatMessage, ChatProgressStep, ChatLocation } from '@/components/ai-chat/types';
import type { ReasoningEffort } from '@/lib/mastra/reasoning-effort';
import type { ConceptCandidate } from '@/components/ai-chat/concept-suggestion';

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

/**
 * ストリーミングチャットフック
 *
 * チャットメッセージの送信とストリーミングレスポンスの処理を担当する。
 */
export function useStreamingChat(options: UseStreamingChatOptions): UseStreamingChatReturn {
  const { threadId, resourceId, location, projectId, reasoningEffort, onConceptCandidates } = options;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * メッセージを送信する
   */
  const sendMessage = useCallback(
    async (content: string) => {
      // AbortControllerを作成（クリーンアップ用）
      const abortController = new AbortController();
      let aborted = false;

      onConceptCandidates?.([]);

      // ユーザーメッセージを追加
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // アシスタントメッセージの初期値（finallyブロックでアクセスするため）
      let assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
        progressSteps: [],
      };

      // タイムアウト処理（180秒）
      const timeoutId = setTimeout(() => {
        if (!aborted) {
          console.warn('[Chat] Request timeout - forcing loading state to false');
          aborted = true;
          abortController.abort();
        }
      }, 180000);

      try {
        console.log('[Chat] Starting message send');
        console.log('[Chat] ThreadId:', threadId, 'ResourceId:', resourceId);

        // APIリクエスト
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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
          const errorData = await response.json();
          throw new Error(errorData.error || 'メッセージの送信に失敗しました');
        }

        // ストリーミングレスポンスを処理
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('ストリーミングレスポンスが取得できませんでした');
        }

        const decoder = new TextDecoder();

        // アシスタントメッセージを追加
        setMessages((prev) => [...prev, assistantMessage]);

        // チャンクタイムアウト検出用
        let lastChunkTime = Date.now();
        const CHUNK_TIMEOUT = 30000; // 30秒間チャンクがない場合は終了とみなす

        // SSEイベントのバッファ（チャンク境界をまたぐデータを保持）
        let buffer = '';

        while (!aborted) {
          const { done, value } = await reader.read();
          if (done) break;

          if (value) {
            lastChunkTime = Date.now(); // チャンク受信時刻を更新
            console.log('[Chat] Chunk received, length:', value.byteLength);
          }

          // バッファにデコードされたチャンクを追加
          buffer += decoder.decode(value, { stream: true });

          // \n\n で区切られたイベントを処理
          const events = buffer.split('\n\n');
          // 最後の不完全なイベントをバッファに残す
          buffer = events.pop() || '';

          for (const event of events) {
            const lines = event.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6).trim();

                // [DONE] マーカーでストリーミング終了
                if (jsonStr === '[DONE]') {
                  console.log('[Chat] [DONE] marker received');
                  aborted = true;
                  break;
                }

                try {
                  const data = JSON.parse(jsonStr);

                  // エラーデータの検出
                  if (data.error) {
                    throw new Error(data.message || 'ストリーミングエラーが発生しました');
                  }

                  if (data.event === 'heartbeat') {
                    continue;
                  }

                  if (data.event === 'progress' && data.step) {
                    const step = data.step as ChatProgressStep;
                    assistantMessage.progressSteps = upsertProgressStep(
                      assistantMessage.progressSteps,
                      step
                    );
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessage.id
                          ? { ...msg, progressSteps: assistantMessage.progressSteps }
                          : msg
                      )
                    );
                    continue;
                  }

                  if (data.event === 'draft' && data.draft) {
                    console.log('[Chat] Received draft event:', data.draft.code, 'draftType:', data.draftType);
                    if (data.draftType === 'br') {
                      assistantMessage.brDraft = data.draft;
                      setMessages((prev) =>
                        prev.map((msg) =>
                          msg.id === assistantMessage.id
                            ? { ...msg, brDraft: assistantMessage.brDraft }
                            : msg
                        )
                      );
                    } else if (data.draftType === 'sf') {
                      assistantMessage.sfDraft = data.draft;
                      setMessages((prev) =>
                        prev.map((msg) =>
                          msg.id === assistantMessage.id
                            ? { ...msg, sfDraft: assistantMessage.sfDraft }
                            : msg
                        )
                      );
                    } else if (data.draftType === 'sr') {
                      assistantMessage.srDraft = data.draft;
                      setMessages((prev) =>
                        prev.map((msg) =>
                          msg.id === assistantMessage.id
                            ? { ...msg, srDraft: assistantMessage.srDraft }
                            : msg
                        )
                      );
                    } else {
                      // draftType が 'bt' か未定義の場合は BT として扱う（後方互換）
                      assistantMessage.btDraft = data.draft;
                      setMessages((prev) =>
                        prev.map((msg) =>
                          msg.id === assistantMessage.id
                            ? { ...msg, btDraft: assistantMessage.btDraft }
                            : msg
                        )
                      );
                    }
                    console.log('[Chat] Updated message with draft:', assistantMessage.id);
                    continue;
                  }

                  if (data.event === 'concept_candidates' && data.candidates) {
                    const candidates = Array.isArray(data.candidates)
                      ? (data.candidates as ConceptCandidate[])
                      : [];
                    onConceptCandidates?.(candidates);
                    continue;
                  }

                  if (data.content) {
                    assistantMessage.content += data.content;
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessage.id
                          ? { ...msg, content: assistantMessage.content }
                          : msg
                      )
                    );
                  }
                } catch (e: any) {
                  // JSONパースエラーは無視（不完全なチャンクの場合）
                  if (e.message && !e.message.includes('JSON')) {
                    throw e;
                  }
                }
              }
            }
            if (aborted) break;
          }

          // タイムアウトチェック
          if (Date.now() - lastChunkTime > CHUNK_TIMEOUT) {
            console.warn('[Chat] No chunk received for 30 seconds - assuming stream ended');
            aborted = true;
            break;
          }

          if (aborted) break;
        }

      } catch (error: any) {
        // アボートされた場合はエラーを無視
        if (error.name === 'AbortError') {
          console.log('[Chat] Request aborted');

          // タイムアウトの場合はエラーメッセージを表示
          if (aborted) {
            const errorMessage: ChatMessage = {
              id: `timeout-${Date.now()}`,
              role: 'system',
              content: 'リクエストがタイムアウトしました。ネットワーク接続を確認してください。',
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
          }
          return;
        }

        console.error('[Chat] Stream error:', error);

        // エラーメッセージを追加
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'system',
          content: `エラーが発生しました: ${error.message}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        clearTimeout(timeoutId);
        // 常にローディング状態を解除する（[DONE]受信時も含む）
        setIsLoading(false);

        // isStreamingフラグを解除
        if (assistantMessage) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessage.id
                ? { ...msg, isStreaming: false }
                : msg
            )
          );
        }
      }

      // クリーンアップ関数を返す
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
