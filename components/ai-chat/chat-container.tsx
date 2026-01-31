"use client";

import { useState, useCallback, useEffect } from 'react';
import { ChatHeader } from './chat-header';
import { QuickActions } from './quick-actions';
import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';
// Note: DraftPreviewCard removed - drafts are now displayed as markdown in chat
import { ConceptSuggestionCard, ConceptApprovalForm } from './concept-suggestion';
import type { ChatConfig, QuickAction } from './types';
import type { ConceptCandidate, ConceptAction, ConceptApproval } from './concept-suggestion';
import { ContextProvider } from '@/lib/mastra/context/provider';
import { useProject } from '@/components/project/project-context';
import type { ReasoningEffort } from '@/lib/mastra/reasoning-effort';
import { DEFAULT_REASONING_EFFORT } from '@/lib/mastra/reasoning-effort';
import { useStreamingChat } from '@/hooks/use-streaming-chat';

type ChatContainerProps = {
  config: ChatConfig;
  onClose?: () => void;
};

/**
 * チャットコンテナ
 *
 * チャットの状態管理とAPIとの通信を担当する。
 */
export function ChatContainer({ config, onClose }: ChatContainerProps) {
  const { currentProjectId } = useProject();
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

  // ストリーミングチャットフックを使用
  const { messages, setMessages, isLoading, sendMessage } = useStreamingChat({
    threadId,
    resourceId: config.resourceId,
    location: config.location,
    projectId: currentProjectId || config.location?.projectId,
    reasoningEffort,
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
  }, [config.initialPrompt, setMessages]);

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
      <ChatHeader location={config.location} />
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
