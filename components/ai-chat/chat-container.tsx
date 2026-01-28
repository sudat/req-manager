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
      // ユーザーメッセージを追加
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
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
            location: config.location,
            streaming: true,
          }),
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
        let assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          isStreaming: true,
        };

        // アシスタントメッセージを追加
        setMessages((prev) => [...prev, assistantMessage]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6);
              try {
                const data = JSON.parse(jsonStr);
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
              } catch (e) {
                // JSONパースエラーは無視
              }
            }
          }
        }

        // ストリーミング終了
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? { ...msg, isStreaming: false }
              : msg
          )
        );

      } catch (error: any) {
        console.error('Chat error:', error);

        // エラーメッセージを追加
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'system',
          content: `エラーが発生しました: ${error.message}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [threadId, config.resourceId, config.location]
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
    <div className="flex flex-col h-screen bg-white">
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
