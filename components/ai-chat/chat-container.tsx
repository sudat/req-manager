"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { QuickActions } from './quick-actions';
import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';
// Note: DraftPreviewCard removed - drafts are now displayed as markdown in chat
import { ConceptSuggestionCard, ConceptApprovalForm } from './concept-suggestion';
import type { ChatConfig, QuickAction } from './types';
import type { ConceptCandidate, ConceptAction, ConceptApproval } from './concept-suggestion';
import { ContextProvider } from '@/lib/mastra/context/provider';
import { DEFAULT_PROJECT_ID, useProject } from '@/components/project/project-context';
import type { ReasoningEffort } from '@/lib/mastra/reasoning-effort';
import { DEFAULT_REASONING_EFFORT } from '@/lib/mastra/reasoning-effort';
import { useStreamingChat } from '@/hooks/use-streaming-chat';
import type { ChatMessage } from './types';

type ChatContainerProps = {
  config: ChatConfig;
  onClose?: () => void;
};

type SerializedChatMessage = Omit<ChatMessage, 'timestamp'> & { timestamp: string };

type ThreadSummary = {
  threadId: string;
  title: string;
  updatedAt: string; // ISO
  contextKey: string;
};

const CHAT_STORAGE_PREFIX = 'req-manager:chat';

const buildContextKey = (config: ChatConfig): string => {
  const loc = config.location;
  if (!loc) return 'project';
  const parts = [
    `screen=${loc.screen}`,
    loc.bdId ? `bdId=${loc.bdId}` : null,
    loc.btId ? `btId=${loc.btId}` : null,
    loc.brId ? `brId=${loc.brId}` : null,
    loc.sdId ? `sdId=${loc.sdId}` : null,
    loc.sfId ? `sfId=${loc.sfId}` : null,
    loc.srId ? `srId=${loc.srId}` : null,
  ].filter(Boolean);
  return parts.join('&') || 'project';
};

const getThreadIdStorageKey = (projectId: string, resourceId: string, contextKey: string) =>
  `${CHAT_STORAGE_PREFIX}:threadId:${projectId}:${resourceId}:${contextKey}`;

const getMessagesStorageKey = (projectId: string, resourceId: string, threadId: string) =>
  `${CHAT_STORAGE_PREFIX}:messages:${projectId}:${resourceId}:${threadId}`;

const getThreadsStorageKey = (projectId: string, resourceId: string, contextKey: string) =>
  `${CHAT_STORAGE_PREFIX}:threads:${projectId}:${resourceId}:${contextKey}`;

const serializeMessages = (messages: ChatMessage[]): SerializedChatMessage[] =>
  messages.map((m) => ({
    ...m,
    timestamp: m.timestamp.toISOString(),
    isStreaming: false,
  }));

const deserializeMessages = (raw: unknown): ChatMessage[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((m) => m as Partial<SerializedChatMessage>)
    .filter((m) => typeof m?.id === 'string' && typeof m?.role === 'string' && typeof m?.content === 'string')
    .map((m) => ({
      id: m.id as string,
      role: m.role as ChatMessage['role'],
      content: m.content as string,
      timestamp: new Date((m.timestamp as string) ?? Date.now()),
      isStreaming: false,
      progressSteps: m.progressSteps,
      btDraft: m.btDraft,
    }));
};

const loadThreads = (projectId: string, resourceId: string, contextKey: string): ThreadSummary[] => {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(getThreadsStorageKey(projectId, resourceId, contextKey));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((t) => t as Partial<ThreadSummary>)
      .filter((t) => typeof t.threadId === 'string' && typeof t.updatedAt === 'string')
      .map((t) => ({
        threadId: t.threadId as string,
        title: (t.title as string) || '無題のチャット',
        updatedAt: t.updatedAt as string,
        contextKey: (t.contextKey as string) || 'project',
      }))
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  } catch {
    return [];
  }
};

const saveThreads = (projectId: string, resourceId: string, contextKey: string, threads: ThreadSummary[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    getThreadsStorageKey(projectId, resourceId, contextKey),
    JSON.stringify(threads.slice(0, 50))
  );
};

const deriveThreadTitle = (messages: ChatMessage[], fallback: string) => {
  const firstUser = messages.find((m) => m.role === 'user' && m.content.trim());
  const title = firstUser?.content.trim().split('\n')[0] ?? '';
  return title ? title.slice(0, 40) : fallback;
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

  const resolvedProjectId =
    currentProjectId || config.location?.projectId || DEFAULT_PROJECT_ID;
  const contextKey = buildContextKey(config);

  // threadIdを生成（過去ログを見れるように、localStorageから復元して安定化する）
  const [threadId, setThreadId] = useState<string>(() => {
    if (config.threadId) return config.threadId;

    if (typeof window === 'undefined') return `thread-${Date.now()}`;

    const key = getThreadIdStorageKey(resolvedProjectId, config.resourceId, contextKey);
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;

    const uiLocation = {
      type: 'project' as const,
      id: resolvedProjectId,
      name: 'Project',
      breadcrumb: ['Project'],
      projectId: resolvedProjectId,
    };
    const created = ContextProvider.generateThreadId(uiLocation, 'chat');
    window.localStorage.setItem(key, created);
    return created;
  });

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);

  // ストリーミングチャットフックを使用
  const { messages, setMessages, isLoading, sendMessage } = useStreamingChat({
    threadId,
    resourceId: config.resourceId,
    location: config.location,
    projectId: currentProjectId || config.location?.projectId || DEFAULT_PROJECT_ID,
    reasoningEffort,
    onConceptCandidates: setConceptCandidates,
  });

  const hasLoadedHistoryRef = useRef(false);

  // 履歴一覧（スレッドリスト）を読み込み
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setThreads(loadThreads(resolvedProjectId, config.resourceId, contextKey));
  }, [config.resourceId, resolvedProjectId, contextKey]);

  // 既存履歴を復元（localStorage）
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (hasLoadedHistoryRef.current) return;

    const key = getMessagesStorageKey(resolvedProjectId, config.resourceId, threadId);
    const raw = window.localStorage.getItem(key);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const restored = deserializeMessages(parsed);
        if (restored.length > 0) {
          setMessages(restored);
          hasLoadedHistoryRef.current = true;
          return;
        }
      } catch {
        // ignore corrupted localStorage
      }
    }

    hasLoadedHistoryRef.current = true;
  }, [config.resourceId, resolvedProjectId, setMessages, threadId]);

  // 初期プロンプトがある場合はシステムメッセージとして追加（履歴がない場合のみ）
  useEffect(() => {
    if (!hasLoadedHistoryRef.current) return;
    if (messages.length > 0) return;
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
  }, [config.initialPrompt, messages.length, setMessages]);

  const persistTimerRef = useRef<number | null>(null);
  // メッセージを永続化（localStorage）
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!hasLoadedHistoryRef.current) return;

    if (persistTimerRef.current) {
      window.clearTimeout(persistTimerRef.current);
    }

    persistTimerRef.current = window.setTimeout(() => {
      const key = getMessagesStorageKey(resolvedProjectId, config.resourceId, threadId);
      const trimmed = messages.slice(-200);
      window.localStorage.setItem(key, JSON.stringify(serializeMessages(trimmed)));

      // スレッド一覧も更新
      const updatedAt = new Date().toISOString();
      const title = deriveThreadTitle(trimmed, config.initialPrompt ?? 'AI要件アシスタント');
      const nextThreads = loadThreads(resolvedProjectId, config.resourceId, contextKey);
      const index = nextThreads.findIndex((t) => t.threadId === threadId);
      const next: ThreadSummary = { threadId, title, updatedAt, contextKey };
      if (index >= 0) nextThreads[index] = next;
      else nextThreads.unshift(next);
      saveThreads(resolvedProjectId, config.resourceId, contextKey, nextThreads);
      setThreads(nextThreads);
    }, 400);

    return () => {
      if (persistTimerRef.current) {
        window.clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
      }
    };
  }, [config.resourceId, messages, resolvedProjectId, threadId]);

  const openHistory = useCallback(() => {
    setThreads(loadThreads(resolvedProjectId, config.resourceId, contextKey));
    setIsHistoryOpen(true);
  }, [config.resourceId, resolvedProjectId, contextKey]);

  const closeHistory = useCallback(() => {
    setIsHistoryOpen(false);
  }, []);

  const handleSelectThread = useCallback(
    (selectedThreadId: string) => {
      if (typeof window === 'undefined') return;
      const key = getMessagesStorageKey(resolvedProjectId, config.resourceId, selectedThreadId);
      const raw = window.localStorage.getItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          const restored = deserializeMessages(parsed);
          setMessages(restored);
        } catch {
          setMessages([]);
        }
      } else {
        setMessages([]);
      }

      // 最後に開いたスレッドとして保存（同一コンテキスト）
      const pointerKey = getThreadIdStorageKey(resolvedProjectId, config.resourceId, contextKey);
      window.localStorage.setItem(pointerKey, selectedThreadId);

      setThreadId(selectedThreadId);
      setIsHistoryOpen(false);
    },
    [config.resourceId, contextKey, resolvedProjectId, setMessages]
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
      try {
        console.log('Approve concept:', approval);

        const projectId = currentProjectId || config.location?.projectId || DEFAULT_PROJECT_ID;
        if (!projectId) {
          console.error('No projectId available');
          // TODO: エラーをユーザーに通知
          return;
        }

        // 概念登録APIを呼び出し
        const response = await fetch('/api/concepts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId,
            term: approval.term,
            definition: approval.definition,
            aliases: approval.aliases || [],
            category: approval.category || 'common',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Failed to create concept:', errorData);
          // TODO: エラーをユーザーに通知
          return;
        }

        const result = await response.json();
        console.log('Concept created successfully:', result);

        // 成功したら概念候補を削除
        setConceptCandidates((prev) =>
          prev.filter((c) => c.term !== approval.term)
        );
        setShowConceptForm(null);
      } catch (error) {
        console.error('Error approving concept:', error);
        // TODO: エラーをユーザーに通知
      }
    },
    [currentProjectId, config.location?.projectId]
  );

  /**
   * 新規チャットを開始する
   */
  const handleNewChat = useCallback(() => {
    if (typeof window === 'undefined') return;

    // 一意な threadId を生成（タイムスタンプ + ランダム値）
    const newThreadId = `thread-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    setMessages([]);
    setThreadId(newThreadId);
    setIsHistoryOpen(false);

    // ポインターを新しいスレッドに更新
    const pointerKey = getThreadIdStorageKey(resolvedProjectId, config.resourceId, contextKey);
    window.localStorage.setItem(pointerKey, newThreadId);
  }, [config.resourceId, contextKey, resolvedProjectId, setMessages]);

  return (
    <div className="flex flex-col h-[calc(100dvh)] bg-white">
      <QuickActions onActionClick={handleQuickAction} disabled={isLoading} />

      {/* メインコンテンツエリア */}
      <div className="relative flex-1 overflow-y-auto">
        {/* 履歴オーバーレイ - アニメーション付き */}
        <div
          className={[
            'absolute inset-0 z-40 transition-opacity duration-300 ease-out',
            isHistoryOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
          ].join(' ')}
          onClick={closeHistory}
          role="presentation"
        >
          <div className="absolute inset-0 bg-slate-900/5" />
          <div
            className={[
              'absolute left-0 top-0 h-full w-[280px] border-r border-slate-200 bg-white shadow-xl',
              'transform transition-transform duration-300 ease-out',
              isHistoryOpen ? 'translate-x-0' : '-translate-x-full',
            ].join(' ')}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="チャット履歴"
          >
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                <div className="text-[13px] font-semibold text-slate-900">
                  チャット履歴
                </div>
              </div>
              <div className="p-2">
                {threads.length === 0 ? (
                  <div className="px-3 py-4 text-[12px] text-slate-500">
                    まだ履歴がありません
                  </div>
                ) : (
                  <div className="space-y-1">
                    {threads.map((t) => (
                      <button
                        key={t.threadId}
                        type="button"
                        onClick={() => handleSelectThread(t.threadId)}
                        className={[
                          'w-full rounded-md px-3 py-2 text-left transition',
                          t.threadId === threadId
                            ? 'bg-slate-100'
                            : 'hover:bg-slate-50',
                        ].join(' ')}
                      >
                        <div className="text-[12px] font-medium text-slate-900 line-clamp-1">
                          {t.title}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {new Date(t.updatedAt).toLocaleString()}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

        <ChatMessages
          messages={messages}
          isLoading={isLoading}
          onToggleHistory={openHistory}
          onNewChat={handleNewChat}
        />

        {/* Note: Draft preview removed - drafts are now displayed as markdown in chat */}

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

      {/* チャット入力欄 - 画面下部に固定 */}
      <div className="bg-white">
        <ChatInput
          onSendMessage={sendMessage}
          reasoningEffort={reasoningEffort}
          onReasoningEffortChange={setReasoningEffort}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}
