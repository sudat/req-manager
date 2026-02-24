"use client";

import { useCallback, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { ChatHeader } from "./chat-header";
import { ChatInput } from "./chat-input";
import { ChatMessages } from "./chat-messages";
import {
	ConceptApprovalForm,
	ConceptSuggestionCard,
} from "./concept-suggestion";
import { ThreadHistoryPanel } from "./thread-history-panel";
import { MinutesIntakeDialog } from "./minutes-intake-dialog";
import type { ChatConfig, DraftUpdatePayload, BtDraft, BrDraft, SfDraft, SrDraft, DdDraft, ChatMessage } from "./types";
import type { ConceptCandidate } from "./concept-suggestion";

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
	const [isConceptsOpen, setIsConceptsOpen] = useState(false);
	const [isMinutesIntakeOpen, setIsMinutesIntakeOpen] = useState(false);

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

	const openMinutesIntake = useCallback(() => {
		setIsMinutesIntakeOpen(true);
	}, []);

	const handleMinutesGenerated = useCallback(
		(args: {
			generated: Array<{
				itemId: string;
				btDraft: BtDraft;
				brDrafts: BrDraft[];
				conceptCandidates: ConceptCandidate[];
			}>;
			errors: Array<{ itemId: string; error: string }>;
		}) => {
			const now = Date.now();

			if (args.errors.length > 0) {
				setMessages((prev) => [
					...prev,
					{
						id: `system-intake-error-${now}`,
						role: "system",
						content: `草案生成に失敗した候補があります（${args.errors.length}件）。必要なら個別に試してください。`,
						timestamp: new Date(),
					},
				]);
			}

			const assistantMessages: ChatMessage[] = args.generated.map((g, idx) => ({
				id: `assistant-intake-${now}-${idx}`,
				role: "assistant",
				content: `📋 議事録から業務タスク草案を作成しました（候補: ${g.itemId}）。内容をご確認ください。`,
				timestamp: new Date(),
				btDraft: g.btDraft,
				brDrafts: g.brDrafts,
			}));

			if (assistantMessages.length > 0) {
				setMessages((prev) => [...prev, ...assistantMessages]);
			}

			const nextCandidates: ConceptCandidate[] = [];
			for (const g of args.generated) {
				for (const c of g.conceptCandidates ?? []) nextCandidates.push(c);
			}
			if (nextCandidates.length > 0) {
				// term重複は潰しておく（UIが見やすい）
				const seen = new Set<string>();
				const deduped = nextCandidates.filter((c) => {
					const key = String(c?.term ?? "");
					if (!key) return false;
					if (seen.has(key)) return false;
					seen.add(key);
					return true;
				});
				concept.setCandidates(deduped);
			}
		},
		[concept, setMessages],
	);

	/** 草案インライン編集 → メッセージ内のdraftを更新 */
	const handleUpdateDraft = useCallback(
		(payload: DraftUpdatePayload) => {
			setMessages((prev: ChatMessage[]) =>
				prev.map((msg) => {
					if (msg.id !== payload.messageId) return msg;
					const updated = { ...msg };
					switch (payload.type) {
						case "bt":
							updated.btDraft = payload.content as BtDraft;
							break;
						case "br": {
							const brContent = payload.content as BrDraft;
							if (updated.brDrafts?.length) {
								updated.brDrafts = updated.brDrafts.map((d) =>
									d.code === payload.code ? brContent : d,
								);
							} else {
								updated.brDraft = brContent;
							}
							break;
						}
						case "sf":
							updated.sfDraft = payload.content as SfDraft;
							break;
						case "sr": {
							const srContent = payload.content as SrDraft;
							if (updated.srDrafts?.length) {
								updated.srDrafts = updated.srDrafts.map((d) =>
									d.code === payload.code ? srContent : d,
								);
							} else {
								updated.srDraft = srContent;
							}
							break;
						}
						case "dd": {
							const ddContent = payload.content as DdDraft;
							if (updated.ddDrafts?.length) {
								updated.ddDrafts = updated.ddDrafts.map((d) =>
									d.id === payload.code ? ddContent : d,
								);
							} else {
								updated.ddDraft = ddContent;
							}
							break;
						}
					}
					return updated;
				}),
			);
		},
		[setMessages],
	);

	// ---------------------------------------------------------------------------
	// JSX
	// ---------------------------------------------------------------------------

	return (
		<div className="relative h-screen flex flex-col min-h-0 overflow-hidden bg-white">
			<ChatHeader
				location={config.location}
				onOpenMinutesIntake={openMinutesIntake}
				onToggleHistory={openHistory}
				onNewChat={handleNewChat}
			/>

			<MinutesIntakeDialog
				open={isMinutesIntakeOpen}
				onOpenChange={setIsMinutesIntakeOpen}
				projectId={resolvedProjectId}
				onGenerated={handleMinutesGenerated}
			/>

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
					onCommitDraft={draft.commitDraft}
					getCommitState={draft.getCommitState}
					onUpdateDraft={handleUpdateDraft}
				/>

				{/* 概念候補提案（折り畳み） */}
				{concept.candidates.length > 0 && (
					<div className="px-6 py-2 max-w-3xl mx-auto">
						{/* トグルヘッダー */}
						<button
							type="button"
							onClick={() => setIsConceptsOpen((prev) => !prev)}
							className="inline-flex items-center gap-2 text-[12px] text-slate-600 hover:text-slate-800 cursor-pointer"
							aria-expanded={isConceptsOpen || Boolean(concept.activeFormTerm)}
						>
							<ChevronDown className={`h-3 w-3 transition-transform ${isConceptsOpen || Boolean(concept.activeFormTerm) ? 'rotate-180' : ''}`} />
							<span>概念候補 ({concept.candidates.length}件)</span>
						</button>

						{/* 折り畳みコンテンツ */}
						<div
							className={cn(
								'overflow-hidden transition-all duration-300 ease-in-out',
								isConceptsOpen || Boolean(concept.activeFormTerm)
									? 'max-h-[600px] opacity-100 mt-2'
									: 'max-h-0 opacity-0 mt-0'
							)}
						>
							<div className="space-y-2">
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
						</div>
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
