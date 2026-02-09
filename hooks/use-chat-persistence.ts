"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ContextProvider } from "@/lib/mastra/context/provider";
import { loadFromStorage, saveToStorage } from "@/lib/utils/local-storage";
import type { ChatConfig, ChatMessage, ThreadSummary } from "@/components/ai-chat/types";

// ---------------------------------------------------------------------------
// 定数・キー生成
// ---------------------------------------------------------------------------

const CHAT_STORAGE_PREFIX = "req-manager:chat";

const buildContextKey = (config: ChatConfig): string => {
	const loc = config.location;
	if (!loc) return "project";
	const parts = [
		`screen=${loc.screen}`,
		loc.bdId ? `bdId=${loc.bdId}` : null,
		loc.btId ? `btId=${loc.btId}` : null,
		loc.brId ? `brId=${loc.brId}` : null,
		loc.sdId ? `sdId=${loc.sdId}` : null,
		loc.sfId ? `sfId=${loc.sfId}` : null,
		loc.srId ? `srId=${loc.srId}` : null,
	].filter(Boolean);
	return parts.join("&") || "project";
};

const getThreadIdStorageKey = (
	projectId: string,
	resourceId: string,
	contextKey: string,
) => `${CHAT_STORAGE_PREFIX}:threadId:${projectId}:${resourceId}:${contextKey}`;

const getMessagesStorageKey = (
	projectId: string,
	resourceId: string,
	threadId: string,
) => `${CHAT_STORAGE_PREFIX}:messages:${projectId}:${resourceId}:${threadId}`;

const getThreadsStorageKey = (
	projectId: string,
	resourceId: string,
	contextKey: string,
) => `${CHAT_STORAGE_PREFIX}:threads:${projectId}:${resourceId}:${contextKey}`;

// ---------------------------------------------------------------------------
// シリアライズ
// ---------------------------------------------------------------------------

type SerializedChatMessage = Omit<ChatMessage, "timestamp"> & {
	timestamp: string;
};

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
		.filter(
			(m) =>
				typeof m?.id === "string" &&
				typeof m?.role === "string" &&
				typeof m?.content === "string",
		)
		.map((m) => ({
			id: m.id as string,
			role: m.role as ChatMessage["role"],
			content: m.content as string,
			timestamp: new Date((m.timestamp as string) ?? Date.now()),
			isStreaming: false,
			progressSteps: m.progressSteps,
			btDraft: m.btDraft,
			brDraft: m.brDraft,
			brDrafts: m.brDrafts,
			sfDraft: m.sfDraft,
			srDraft: m.srDraft,
			srDrafts: m.srDrafts,
		}));
};

// ---------------------------------------------------------------------------
// スレッド一覧の読み書き
// ---------------------------------------------------------------------------

const loadThreads = (
	projectId: string,
	resourceId: string,
	contextKey: string,
): ThreadSummary[] => {
	if (typeof window === "undefined") return [];
	const parsed = loadFromStorage<unknown>(
		getThreadsStorageKey(projectId, resourceId, contextKey),
	);
	if (!Array.isArray(parsed)) return [];
	return parsed
		.map((t) => t as Partial<ThreadSummary>)
		.filter(
			(t) =>
				typeof t.threadId === "string" && typeof t.updatedAt === "string",
		)
		.map((t) => ({
			threadId: t.threadId as string,
			title: (t.title as string) || "無題のチャット",
			updatedAt: t.updatedAt as string,
			contextKey: (t.contextKey as string) || "project",
		}))
		.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
};

const saveThreads = (
	projectId: string,
	resourceId: string,
	contextKey: string,
	threads: ThreadSummary[],
) => {
	if (typeof window === "undefined") return;
	saveToStorage(
		getThreadsStorageKey(projectId, resourceId, contextKey),
		threads.slice(0, 50),
	);
};

const deriveThreadTitle = (messages: ChatMessage[], fallback: string) => {
	const firstUser = messages.find((m) => m.role === "user" && m.content.trim());
	const title = firstUser?.content.trim().split("\n")[0] ?? "";
	return title ? title.slice(0, 40) : fallback;
};

// ---------------------------------------------------------------------------
// useState 初期化関数（container で使用）
// ---------------------------------------------------------------------------

/**
 * threadId の初期値を計算する。
 * useState の初期化関数として使用する。
 */
export function initThreadId(config: ChatConfig, projectId: string): string {
	if (config.threadId) return config.threadId;
	if (typeof window === "undefined") return `thread-${Date.now()}`;

	const contextKey = buildContextKey(config);
	const key = getThreadIdStorageKey(projectId, config.resourceId, contextKey);
	const existing = window.localStorage.getItem(key);
	if (existing) return existing;

	const uiLocation = {
		type: "project" as const,
		id: projectId,
		name: "Project",
		breadcrumb: ["Project"],
		projectId,
	};
	const created = ContextProvider.generateThreadId(uiLocation, "chat");
	window.localStorage.setItem(key, created);
	return created;
}

// ---------------------------------------------------------------------------
// メインフック
// ---------------------------------------------------------------------------

type UseChatPersistenceProps = {
	config: ChatConfig;
	projectId: string;
	threadId: string;
	setThreadId: (id: string) => void;
	messages: ChatMessage[];
	setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
};

export function useChatPersistence({
	config,
	projectId,
	threadId,
	setThreadId,
	messages,
	setMessages,
}: UseChatPersistenceProps) {
	const contextKey = buildContextKey(config);
	const [threads, setThreads] = useState<ThreadSummary[]>([]);
	const hasLoadedHistoryRef = useRef(false);
	const persistTimerRef = useRef<number | null>(null);

	// Effect 1: スレッド一覧の読み込み
	useEffect(() => {
		if (typeof window === "undefined") return;
		setThreads(loadThreads(projectId, config.resourceId, contextKey));
	}, [config.resourceId, projectId, contextKey]);

	// Effect 2: 既存履歴を復元（Mastra Memory + localStorage drafts）
	useEffect(() => {
		if (typeof window === "undefined") return;
		if (hasLoadedHistoryRef.current) return;

		const loadHistory = async () => {
			try {
				// 1. Mastra Memoryから基本メッセージを取得
				const response = await fetch(
					`/api/chat?threadId=${encodeURIComponent(threadId)}&resourceId=${encodeURIComponent(config.resourceId)}`,
				);
				
				if (!response.ok) {
					throw new Error(`Failed to load history: ${response.status}`);
				}
				
				const data = await response.json();
				const mastraMessages: Array<{
					id: string;
					role: 'user' | 'assistant' | 'system';
					content: string;
					createdAt: string;
				}> = data.messages || [];

				// 2. localStorageからdraftsデータを取得（IDマッチング用）
				const key = getMessagesStorageKey(projectId, config.resourceId, threadId);
				const raw = loadFromStorage<unknown>(key);
				const draftsData = raw ? deserializeMessages(raw) : [];
				const draftsMap = new Map(draftsData.map((d) => [d.id, d]));

				// 3. マージ（基本メッセージ + draftsデータ）
				const merged: ChatMessage[] = mastraMessages.map((m) => {
					const draft = draftsMap.get(m.id);
					return {
						id: m.id,
						role: m.role,
						content: m.content,
						timestamp: new Date(m.createdAt),
						isStreaming: false,
						// draftsデータがあればマージ（マッチしなければundefined）
						progressSteps: draft?.progressSteps,
						btDraft: draft?.btDraft,
						brDraft: draft?.brDraft,
						brDrafts: draft?.brDrafts,
						sfDraft: draft?.sfDraft,
						srDraft: draft?.srDraft,
						srDrafts: draft?.srDrafts,
						ddDraft: draft?.ddDraft,
						ddDrafts: draft?.ddDrafts,
					};
				});

				if (merged.length > 0) {
					setMessages(merged);
				}
			} catch (error) {
				console.error('[useChatPersistence] Failed to load history:', error);
				// エラー時はlocalStorageのフォールバック
				const key = getMessagesStorageKey(projectId, config.resourceId, threadId);
				const raw = loadFromStorage<unknown>(key);
				if (raw) {
					const restored = deserializeMessages(raw);
					if (restored.length > 0) {
						setMessages(restored);
					}
				}
			} finally {
				hasLoadedHistoryRef.current = true;
			}
		};

		loadHistory();
	}, [config.resourceId, projectId, setMessages, threadId]);

	// Effect 3: initialPrompt → 履歴なし時のシステムメッセージ
	useEffect(() => {
		if (!hasLoadedHistoryRef.current) return;
		if (messages.length > 0) return;
		if (config.initialPrompt) {
			setMessages([
				{
					id: "initial",
					role: "system",
					content: config.initialPrompt,
					timestamp: new Date(),
				},
			]);
		}
	}, [config.initialPrompt, messages.length, setMessages]);

	// Effect 4: draftsデータのみlocalStorageに保存（メッセージ本体はMastra Memoryが管理）
	useEffect(() => {
		if (typeof window === "undefined") return;
		if (!hasLoadedHistoryRef.current) return;

		if (persistTimerRef.current) {
			window.clearTimeout(persistTimerRef.current);
		}

		persistTimerRef.current = window.setTimeout(() => {
			// draftsデータのみ抽出して保存
			const draftsOnly = messages
				.filter((m) =>
					m.btDraft ||
					m.brDraft ||
					m.brDrafts ||
					m.sfDraft ||
					m.srDraft ||
					m.srDrafts ||
					m.ddDraft ||
					m.ddDrafts ||
					m.progressSteps,
				)
				.slice(-200);

			if (draftsOnly.length > 0) {
				const key = getMessagesStorageKey(projectId, config.resourceId, threadId);
				saveToStorage(key, serializeMessages(draftsOnly));
			}

			// スレッド一覧も更新
			const updatedAt = new Date().toISOString();
			const title = deriveThreadTitle(
				messages,
				config.initialPrompt ?? "AI要件アシスタント",
			);
			const nextThreads = loadThreads(projectId, config.resourceId, contextKey);
			const index = nextThreads.findIndex((t) => t.threadId === threadId);
			const next: ThreadSummary = { threadId, title, updatedAt, contextKey };
			if (index >= 0) nextThreads[index] = next;
			else nextThreads.unshift(next);
			saveThreads(projectId, config.resourceId, contextKey, nextThreads);
			setThreads(nextThreads);
		}, 400);

		return () => {
			if (persistTimerRef.current) {
				window.clearTimeout(persistTimerRef.current);
				persistTimerRef.current = null;
			}
		};
	}, [config.resourceId, config.initialPrompt, contextKey, messages, projectId, threadId]);

	// ---------------------------------------------------------------------------
	// アクション
	// ---------------------------------------------------------------------------

	const selectThread = useCallback(
		async (selectedThreadId: string) => {
			if (typeof window === "undefined") return;

			try {
				// 1. Mastra Memoryから基本メッセージを取得
				const response = await fetch(
					`/api/chat?threadId=${encodeURIComponent(selectedThreadId)}&resourceId=${encodeURIComponent(config.resourceId)}`,
				);

				if (!response.ok) {
					throw new Error(`Failed to load history: ${response.status}`);
				}

				const data = await response.json();
				const mastraMessages: Array<{
					id: string;
					role: 'user' | 'assistant' | 'system';
					content: string;
					createdAt: string;
				}> = data.messages || [];

				// 2. localStorageからdraftsデータを取得（IDマッチング用）
				const key = getMessagesStorageKey(projectId, config.resourceId, selectedThreadId);
				const raw = loadFromStorage<unknown>(key);
				const draftsData = raw ? deserializeMessages(raw) : [];
				const draftsMap = new Map(draftsData.map((d) => [d.id, d]));

				// 3. マージ（基本メッセージ + draftsデータ）
				const merged: ChatMessage[] = mastraMessages.map((m) => {
					const draft = draftsMap.get(m.id);
					return {
						id: m.id,
						role: m.role,
						content: m.content,
						timestamp: new Date(m.createdAt),
						isStreaming: false,
						// draftsデータがあればマージ（マッチしなければundefined）
						progressSteps: draft?.progressSteps,
						btDraft: draft?.btDraft,
						brDraft: draft?.brDraft,
						brDrafts: draft?.brDrafts,
						sfDraft: draft?.sfDraft,
						srDraft: draft?.srDraft,
						srDrafts: draft?.srDrafts,
						ddDraft: draft?.ddDraft,
						ddDrafts: draft?.ddDrafts,
					};
				});

				setMessages(merged);
			} catch (error) {
				console.error('[useChatPersistence] Failed to load thread:', error);
				// エラー時はlocalStorageのフォールバック
				const key = getMessagesStorageKey(projectId, config.resourceId, selectedThreadId);
				const raw = loadFromStorage<unknown>(key);
				if (raw) {
					setMessages(deserializeMessages(raw));
				} else {
					setMessages([]);
				}
			}

			// ポインタを更新（raw 文字列）
			const pointerKey = getThreadIdStorageKey(projectId, config.resourceId, contextKey);
			window.localStorage.setItem(pointerKey, selectedThreadId);

			setThreadId(selectedThreadId);
		},
		[config.resourceId, contextKey, projectId, setMessages, setThreadId],
	);

	const startNewChat = useCallback(() => {
		if (typeof window === "undefined") return;

		const newThreadId = `thread-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
		setMessages([]);
		setThreadId(newThreadId);

		// ポインタを更新（raw 文字列）
		const pointerKey = getThreadIdStorageKey(projectId, config.resourceId, contextKey);
		window.localStorage.setItem(pointerKey, newThreadId);
	}, [config.resourceId, contextKey, projectId, setMessages, setThreadId]);

	const refreshThreads = useCallback(() => {
		setThreads(loadThreads(projectId, config.resourceId, contextKey));
	}, [config.resourceId, projectId, contextKey]);

	return { threads, selectThread, startNewChat, refreshThreads };
}
