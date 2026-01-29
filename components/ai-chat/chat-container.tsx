"use client";

import { useState, useCallback, useEffect } from 'react';
import { ChatHeader } from './chat-header';
import { QuickActions } from './quick-actions';
import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';
import { DraftPreviewCard } from './draft-preview';
import { ConceptSuggestionCard, ConceptApprovalForm } from './concept-suggestion';
import type { ChatMessage, ChatConfig, QuickAction } from './types';
import type { Draft, DraftAction } from './draft-preview';
import type { ConceptCandidate, ConceptAction, ConceptApproval } from './concept-suggestion';
import { ContextProvider } from '@/lib/mastra/context/provider';
import { useProject } from '@/components/project/project-context';

type ChatContainerProps = {
  config: ChatConfig;
  onClose: () => void;
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
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [conceptCandidates, setConceptCandidates] = useState<ConceptCandidate[]>([]);
  const [showConceptForm, setShowConceptForm] = useState<string | null>(null);

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
      let assistantMessage: ChatMessage | null = null;

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
        assistantMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          isStreaming: true,
        };

        // アシスタントメッセージを追加
        setMessages((prev) => [...prev, assistantMessage]);

        // チャンクタイムアウト検出用
        let lastChunkTime = Date.now();
        const CHUNK_TIMEOUT = 30000; // 30秒間チャンクがない場合は終了とみなす

        while (!aborted) {
          const { done, value } = await reader.read();
          if (done) break;

          if (value) {
            lastChunkTime = Date.now(); // チャンク受信時刻を更新
            console.log('[Chat] Chunk received, length:', value.byteLength);
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

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

          // タイムアウトチェック
          if (Date.now() - lastChunkTime > CHUNK_TIMEOUT) {
            console.warn('[Chat] No chunk received for 5 seconds - assuming stream ended');
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
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage?.id
              ? { ...msg, isStreaming: false }
              : msg
          )
        );
      }

      // クリーンアップ関数を返す
      return () => {
        aborted = true;
        abortController.abort();
      };
    },
    [threadId, config.resourceId, config.location, currentProjectId]
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

  /**
   * 草案アクションを処理する
   */
  const handleDraftAction = useCallback(
    async (draft: Draft, action: DraftAction) => {
      switch (action) {
        case 'commit':
          // TODO: commit_draft Tool呼び出し
          console.log('Commit draft:', draft.id);
          setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
          break;

        case 'edit':
          // TODO: 編集画面に遷移
          console.log('Edit draft:', draft.id);
          break;

        case 'discard':
          setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
          break;

        case 'retry':
          // TODO: 再生成
          console.log('Retry draft:', draft.id);
          break;
      }
    },
    []
  );

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

        {/* 草案プレビュー */}
        {drafts.length > 0 && (
          <div className="px-6 py-4 space-y-3 max-w-3xl mx-auto">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-2">
              生成された草案
            </div>
            {drafts.map((draft) => (
              <DraftPreviewCard
                key={draft.id}
                draft={draft}
                onAction={(action) => handleDraftAction(draft, action)}
                disabled={isLoading}
              />
            ))}
          </div>
        )}

        {/* 概念候補提案 */}
        {conceptCandidates.length > 0 && (
          <div className="px-6 py-4 space-y-3 max-w-3xl mx-auto">
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

      <ChatInput onSendMessage={sendMessage} disabled={isLoading} />
    </div>
  );
}
