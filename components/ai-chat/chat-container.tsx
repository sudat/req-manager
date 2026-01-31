"use client";

import { useState, useCallback, useEffect } from 'react';
import { ChatHeader } from './chat-header';
import { QuickActions } from './quick-actions';
import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';
// Note: DraftPreviewCard removed - drafts are now displayed as markdown in chat
import { ConceptSuggestionCard, ConceptApprovalForm } from './concept-suggestion';
import type { ChatMessage, ChatConfig, QuickAction, ChatProgressStep } from './types';
import type { ConceptCandidate, ConceptAction, ConceptApproval } from './concept-suggestion';
import { ContextProvider } from '@/lib/mastra/context/provider';
import { useProject } from '@/components/project/project-context';
import type { ReasoningEffort } from '@/lib/mastra/reasoning-effort';
import { DEFAULT_REASONING_EFFORT } from '@/lib/mastra/reasoning-effort';

type ChatContainerProps = {
  config: ChatConfig;
  onClose: () => void;
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
 * チャットコンテナ
 *
 * チャットの状態管理とAPIとの通信を担当する。
 */
export function ChatContainer({ config, onClose }: ChatContainerProps) {
  const { currentProjectId } = useProject();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // Note: drafts state removed - drafts are now displayed as markdown in chat
  const [conceptCandidates, setConceptCandidates] = useState<ConceptCandidate[]>([]);
  const [showConceptForm, setShowConceptForm] = useState<string | null>(null);
  const [reasoningEffort, setReasoningEffort] = useState<ReasoningEffort>(
    DEFAULT_REASONING_EFFORT
  );

  // threadIdを生成（locationがあればそれを使用、なければデフォルト）
  const [threadId] = useState<string>(() => {
    if (config.threadId) return config.threadId;

    if (config.location) {
      const uiLocation = {
        type: 'project' as const,
        id: config.location.projectId,
        name: 'Project',
        breadcrumb: ['Project'],
        projectId: config.location.projectId,
      };
      return ContextProvider.generateThreadId(uiLocation, `chat-${Date.now()}`);
    }

    return `thread-${Date.now()}`;
  });

  // 初期プロンプトがある場合はシステムメッセージとして追加
  useEffect(() => {
    if (config.initialPrompt) {
      setMessages([
        {
          id: 'initial',
          role: 'system',
          content: config.initialPrompt,
          timestamp: new Date(),
        },
      ]);
    }
  }, [config.initialPrompt]);

  /**
   * メッセージを送信する
   */
  const sendMessage = useCallback(
    async (content: string) => {
      // AbortControllerを作成（クリーンアップ用）
      const abortController = new AbortController();
      let aborted = false;

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
        console.log('[Chat] ThreadId:', threadId, 'ResourceId:', config.resourceId);

        // APIリクエスト
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: content,
            threadId,
            resourceId: config.resourceId,
            projectId: currentProjectId || config.location?.projectId,
            location: config.location,
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
                    assistantMessage.btDraft = data.draft;
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessage.id
                          ? { ...msg, btDraft: assistantMessage.btDraft }
                          : msg
                      )
                    );
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
    [threadId, config.resourceId, config.location, currentProjectId, reasoningEffort]
  );

  /**
   * クイックアクションを実行する
   */
  const handleQuickAction = useCallback(
    (action: QuickAction) => {
      sendMessage(action.prompt);
    },
    [sendMessage]
  );

  // Note: handleDraftAction removed - drafts are now committed via chat using commitDraftTool

  /**
   * 概念候補アクションを処理する
   */
  const handleConceptAction = useCallback(
    (candidate: ConceptCandidate, action: ConceptAction) => {
      switch (action) {
        case 'approve':
          if (candidate.isExisting) {
            // 既存概念の確認
            setConceptCandidates((prev) =>
              prev.filter((c) => c.term !== candidate.term)
            );
          } else {
            // 新規概念の承認フォーム表示
            setShowConceptForm(candidate.term);
          }
          break;

        case 'reject':
          setConceptCandidates((prev) =>
            prev.filter((c) => c.term !== candidate.term)
          );
          break;

        case 'hold':
          // 保留（何もしない）
          break;
      }
    },
    []
  );

  /**
   * 概念承認フォーム送信
   */
  const handleConceptApproval = useCallback(
    async (approval: ConceptApproval) => {
      // TODO: concepts テーブルに登録
      console.log('Approve concept:', approval);

      setConceptCandidates((prev) =>
        prev.filter((c) => c.term !== approval.term)
      );
      setShowConceptForm(null);
    },
    []
  );

  return (
    <div className="flex flex-col h-[calc(100dvh)] bg-white">
      <ChatHeader location={config.location} onClose={onClose} />
      <QuickActions onActionClick={handleQuickAction} disabled={isLoading} />

      {/* メインコンテンツエリア */}
      <div className="flex-1 overflow-y-auto">
        <ChatMessages messages={messages} isLoading={isLoading} />

        {/* Note: Draft preview removed - drafts are now displayed as markdown in chat */}

        {/* 概念候補提案 */}
        {conceptCandidates.length > 0 && (
          <div className="px-6 py-4 space-y-3 max-w-4xl mx-auto">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-2">
              検出された概念候補
            </div>
            {conceptCandidates.map((candidate) => (
              <div key={candidate.term}>
                {showConceptForm === candidate.term ? (
                  <ConceptApprovalForm
                    initialTerm={candidate.term}
                    onSubmit={handleConceptApproval}
                    onCancel={() => setShowConceptForm(null)}
                  />
                ) : (
                  <ConceptSuggestionCard
                    candidate={candidate}
                    onAction={(action) => handleConceptAction(candidate, action)}
                    disabled={isLoading}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ChatInput
        onSendMessage={sendMessage}
        reasoningEffort={reasoningEffort}
        onReasoningEffortChange={setReasoningEffort}
        disabled={isLoading}
      />
    </div>
  );
}
