"use client";

import { useState, useCallback } from "react";
import type { BrDraft, BtDraft, ChatMessage, DraftCommitState } from "@/components/ai-chat/types";

// ---------------------------------------------------------------------------
// 内部ヘルパー
// ---------------------------------------------------------------------------

const buildDraftKey = (messageId: string, type: "bt" | "br", code: string) =>
	`${messageId}:${type}:${code}`;

// ---------------------------------------------------------------------------
// フック
// ---------------------------------------------------------------------------

type UseDraftCommitProps = {
	setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
};

export function useDraftCommit({ setMessages }: UseDraftCommitProps) {
	const [draftCommitStates, setDraftCommitStates] = useState<
		Record<string, DraftCommitState>
	>({});

	const getCommitState = useCallback(
		(messageId: string, type: "bt" | "br", code: string) => {
			return draftCommitStates[buildDraftKey(messageId, type, code)];
		},
		[draftCommitStates],
	);

	const commitDraft = useCallback(
		async (payload: {
			messageId: string;
			type: "bt" | "br";
			code: string;
			content: BtDraft | BrDraft;
		}) => {
			const key = buildDraftKey(payload.messageId, payload.type, payload.code);
			setDraftCommitStates((prev) => ({
				...prev,
				[key]: { status: "loading" },
			}));

			try {
				const response = await fetch("/api/drafts/commit", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						draftId: `draft-${payload.type}-${Date.now()}`,
						type: payload.type,
						content: payload.content,
					}),
				});

				const result = await response.json();
				if (response.ok && result?.success) {
					setDraftCommitStates((prev) => ({
						...prev,
						[key]: { status: "success", message: result.message },
					}));

					setMessages((prev) => [
						...prev,
						{
							id: `system-${Date.now()}`,
							role: "system",
							content: result.message ?? "登録しました。",
							timestamp: new Date(),
						},
					]);
					return;
				}

				const errorMessage =
					result?.message || result?.error || "草案の登録に失敗しました";
				setDraftCommitStates((prev) => ({
					...prev,
					[key]: { status: "error", message: errorMessage },
				}));
			} catch (error: any) {
				setDraftCommitStates((prev) => ({
					...prev,
					[key]: {
						status: "error",
						message: error?.message ?? "草案の登録に失敗しました",
					},
				}));
			}
		},
		[setMessages],
	);

	return { commitDraft, getCommitState };
}
