"use client";

import { useCallback, useState } from "react";
import {
	DEFAULT_PROJECT_ID,
	useProject,
} from "@/components/project/project-context";
import { initThreadId, useChatPersistence } from "@/hooks/use-chat-persistence";
import { useConceptManagement } from "@/hooks/use-concept-management";
import { useDraftCommit } from "@/hooks/use-draft-commit";
import { useStreamingChat } from "@/hooks/use-streaming-chat";
import type { ReasoningEffort } from "@/lib/mastra/reasoning-effort";
import { DEFAULT_REASONING_EFFORT } from "@/lib/mastra/reasoning-effort";
import { ChatInput } from "./chat-input";
import { ChatMessages } from "./chat-messages";
import {
	ConceptApprovalForm,
	ConceptSuggestionCard,
} from "./concept-suggestion";
import { ThreadHistoryPanel } from "./thread-history-panel";
import type { ChatConfig } from "./types";

type ChatContainerProps = {
	config: ChatConfig;
	onClose?: () => void;
};

/**
 * チャットコンテナ
 *
 * チャットの状態管理とAPIとの通信を担当する。
 */
export function ChatContainer({ config }: ChatContainerProps) {
	// ---------------------------------------------------------------------------
	// Hook呼び出し（順序固定）
	// ---------------------------------------------------------------------------
	const { currentProjectId } = useProject();

	const resolvedProjectId =
		currentProjectId || config.location?.projectId || DEFAULT_PROJECT_ID;

	const [threadId, setThreadId] = useState<string>(() =>
		initThreadId(config, resolvedProjectId),
	);
	const [reasoningEffort, setReasoningEffort] = useState<ReasoningEffort>(
		DEFAULT_REASONING_EFFORT,
	);
	const [isHistoryOpen, setIsHistoryOpen] = useState(false);

	const concept = useConceptManagement({ projectId: resolvedProjectId });

	const { messages, setMessages, isLoading, sendMessage } = useStreamingChat({
		threadId,
		resourceId: config.resourceId,
		location: config.location,
		projectId: resolvedProjectId,
		reasoningEffort,
		onConceptCandidates: concept.setCandidates,
	});

	const persistence = useChatPersistence({
		config,
		projectId: resolvedProjectId,
		threadId,
		setThreadId,
		messages,
		setMessages,
	});

	const draft = useDraftCommit({ setMessages });

	// ---------------------------------------------------------------------------
	// イベントハンドラー
	// ---------------------------------------------------------------------------

	const openHistory = useCallback(() => {
		persistence.refreshThreads();
		setIsHistoryOpen(true);
	}, [persistence.refreshThreads]);

	const closeHistory = useCallback(() => {
		setIsHistoryOpen(false);
	}, []);

	const handleSelectThread = useCallback(
		(selectedThreadId: string) => {
			persistence.selectThread(selectedThreadId);
			setIsHistoryOpen(false);
		},
		[persistence.selectThread],
	);

	const handleNewChat = useCallback(() => {
		persistence.startNewChat();
		setIsHistoryOpen(false);
	}, [persistence.startNewChat]);

	// ---------------------------------------------------------------------------
	// JSX
	// ---------------------------------------------------------------------------

	return (
		<div className="relative h-screen flex flex-col min-h-0 overflow-hidden bg-white">
			{/* スクロール可能なメインエリア */}
			<div className="flex-1 overflow-y-auto hide-scrollbar">
				{/* 履歴オーバーレイ */}
				<ThreadHistoryPanel
					isOpen={isHistoryOpen}
					threads={persistence.threads}
					currentThreadId={threadId}
					onSelect={handleSelectThread}
					onClose={closeHistory}
				/>

				<ChatMessages
					messages={messages}
					isLoading={isLoading}
					onToggleHistory={openHistory}
					onNewChat={handleNewChat}
					onCommitDraft={draft.commitDraft}
					getCommitState={draft.getCommitState}
				/>

				{/* 概念候補提案 */}
				{concept.candidates.length > 0 && (
					<div className="px-6 py-4 space-y-3 max-w-3xl mx-auto">
						<div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-2">
							検出された概念候補
						</div>
						{concept.candidates.map((candidate) => (
							<div key={candidate.term}>
								{concept.activeFormTerm === candidate.term ? (
									<ConceptApprovalForm
										initialTerm={candidate.term}
										onSubmit={concept.handleApproval}
										onCancel={() => concept.setActiveFormTerm(null)}
									/>
								) : (
									<ConceptSuggestionCard
										candidate={candidate}
										onAction={(action) =>
											concept.handleAction(candidate, action)
										}
										disabled={isLoading}
									/>
								)}
							</div>
						))}
					</div>
				)}

				{/* 入力欄分のスペーサー */}
				<div className="h-40 shrink-0" />
			</div>

			{/* チャット入力欄 - 画面下部に固定 */}
			<div className="absolute bottom-0 left-0 right-0 z-10 pt-6 bg-gradient-to-b from-white/0 to-white">
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
