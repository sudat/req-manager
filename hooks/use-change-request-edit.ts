"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
	ChangeRequest,
	ChangeRequestPriority,
	ChangeRequestStatus,
} from "@/lib/domain/value-objects";
import type { SelectedRequirement } from "@/components/tickets/impact-scope-selector";
import {
	getChangeRequestById,
	updateChangeRequest,
} from "@/lib/data/change-requests";
import {
	listImpactScopesByChangeRequestId,
	createImpactScopes,
	deleteImpactScope,
	updateImpactScope,
} from "@/lib/data/impact-scopes";
import {
	listAcceptanceConfirmationsByChangeRequestId,
	createAcceptanceConfirmations,
	deleteAcceptanceConfirmation,
} from "@/lib/data/acceptance-confirmations";
import {
	transformImpactScopesToSelectedRequirements,
} from "@/lib/data/transformers/impact-scope-transformer";
import {
	buildAcceptanceInputs,
	buildImpactScopeInputs,
} from "@/lib/data/transformers/acceptance-input-builder";
import { useProject } from "@/components/project/project-context";

// ========================================
// Type Definitions
// ========================================

export interface UseChangeRequestEditResult {
	// データ
	changeRequest: ChangeRequest | null;
	selectedRequirements: SelectedRequirement[];

	// フォーム状態
	title: string;
	setTitle: (value: string) => void;
	description: string;
	setDescription: (value: string) => void;
	background: string;
	setBackground: (value: string) => void;
	expectedBenefit: string;
	setExpectedBenefit: (value: string) => void;
	status: ChangeRequestStatus;
	setStatus: (value: ChangeRequestStatus) => void;
	priority: ChangeRequestPriority;
	setPriority: (value: ChangeRequestPriority) => void;

	// UI状態
	loading: boolean;
	submitting: boolean;
	error: string | null;

	// アクション
	handleSubmit: () => Promise<void>;
	setSelectedRequirements: (value: SelectedRequirement[]) => void;
}

// ========================================
// Hook Implementation
// ========================================

/**
 * 変更要求編集ページの状態管理とデータフェッチを行うフック
 * @param changeRequestId - 変更要求ID
 * @returns 状態とハンドラー
 */
export function useChangeRequestEdit(
	changeRequestId: string
): UseChangeRequestEditResult {
	const router = useRouter();

	// データ状態
	const [changeRequest, setChangeRequest] = useState<ChangeRequest | null>(null);
	const [selectedRequirements, setSelectedRequirements] = useState<SelectedRequirement[]>([]);
	const initialSelectionKeysRef = useRef<string[]>([]);

	// フォーム状態
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [background, setBackground] = useState("");
	const [expectedBenefit, setExpectedBenefit] = useState("");
	const [status, setStatus] = useState<ChangeRequestStatus>("open");
	const [priority, setPriority] = useState<ChangeRequestPriority>("medium");

	// UI状態
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { currentProjectId, loading: projectLoading } = useProject();

	const toSelectionKey = (item: SelectedRequirement): string => `${item.type}:${item.id}`;
	const toSortedUniqueKeys = (items: SelectedRequirement[]): string[] =>
		Array.from(new Set(items.map(toSelectionKey))).sort();
	const isSameKeySet = (a: string[], b: string[]): boolean => {
		if (a.length !== b.length) return false;
		for (let i = 0; i < a.length; i += 1) {
			if (a[i] !== b[i]) return false;
		}
		return true;
	};

	// データフェッチ
	useEffect(() => {
		if (projectLoading) return;
		if (!currentProjectId) {
			setError("プロジェクトが選択されていません");
			setLoading(false);
			return;
		}
		const projectId = currentProjectId;
		let active = true;

		async function fetchData(): Promise<void> {
			setLoading(true);

			// 変更要求を取得
			const { data, error: fetchError } = await getChangeRequestById(changeRequestId, projectId);
			if (!active) return;
			if (fetchError || !data) {
				setError(fetchError ?? "変更要求が見つかりません");
				setLoading(false);
				return;
			}

			setChangeRequest(data);
			setTitle(data.title);
			setDescription(data.description ?? "");
			setBackground(data.background ?? "");
			setExpectedBenefit(data.expectedBenefit ?? "");
			setStatus(data.status);
			setPriority(data.priority);

			// 既存の影響範囲を読み込む
			const { data: impactScopes } = await listImpactScopesByChangeRequestId(changeRequestId, projectId);
			if (!active) return;

			let nextSelectedRequirements: SelectedRequirement[] = [];
			if (impactScopes && impactScopes.length > 0) {
				try {
					const result = await transformImpactScopesToSelectedRequirements(
						impactScopes,
						projectId
					);
					nextSelectedRequirements = result.selectedRequirements;
				} catch (err) {
					if (active) {
						setError(err instanceof Error ? err.message : "影響範囲の読み込みに失敗しました");
					}
				}
			}

			if (active) {
				setSelectedRequirements(nextSelectedRequirements);
				// 影響範囲が変わっていない保存で、confirmed/確認状態などを飛ばさないための基準点
				initialSelectionKeysRef.current = toSortedUniqueKeys(nextSelectedRequirements);
			}

			setLoading(false);
		}

		fetchData();
		return () => {
			active = false;
		};
	}, [changeRequestId, currentProjectId, projectLoading]);

	// 保存処理
	const handleSubmit = async (): Promise<void> => {
		setSubmitting(true);
		setError(null);
		if (projectLoading || !currentProjectId) {
			setError("プロジェクトが選択されていません");
			setSubmitting(false);
			return;
		}

		const currentKeys = toSortedUniqueKeys(selectedRequirements);
		const selectionChanged = !isSameKeySet(currentKeys, initialSelectionKeysRef.current);

		// 変更要求を更新
		const { error: updateError } = await updateChangeRequest(changeRequestId, {
			title,
			description: description || null,
			background: background || null,
			expectedBenefit: expectedBenefit || null,
			status,
			priority,
		}, currentProjectId);

		if (updateError) {
			setError(updateError);
			setSubmitting(false);
			return;
		}

		// 影響範囲が変わっていないのに confirmed / 受入確認の状態をリセットするのを防ぐ
		if (!selectionChanged) {
			setSubmitting(false);
			router.push(`/tickets/${changeRequestId}`);
			return;
		}

		// 影響範囲を同期（confirmedなどは維持し、追加/削除のみ反映）
		const { data: existingScopes, error: existingScopesError } =
			await listImpactScopesByChangeRequestId(changeRequestId, currentProjectId);
		if (existingScopesError) {
			setError(`影響範囲の読み込みに失敗しました: ${existingScopesError}`);
			setSubmitting(false);
			return;
		}

		const existingByKey = new Map<string, NonNullable<typeof existingScopes>[number]>();
		for (const scope of existingScopes ?? []) {
			existingByKey.set(`${scope.targetType}:${scope.targetId}`, scope);
		}

		const desiredScopeInputs = buildImpactScopeInputs(selectedRequirements, changeRequestId);
		const desiredByKey = new Map<string, (typeof desiredScopeInputs)[number]>();
		for (const input of desiredScopeInputs) {
			desiredByKey.set(`${input.targetType}:${input.targetId}`, input);
		}

		const scopesToDelete = (existingScopes ?? []).filter((scope) => !desiredByKey.has(`${scope.targetType}:${scope.targetId}`));
		const scopesToCreate = desiredScopeInputs.filter((input) => !existingByKey.has(`${input.targetType}:${input.targetId}`));
		const scopesToUpdateTitle = (existingScopes ?? []).filter((scope) => {
			const desired = desiredByKey.get(`${scope.targetType}:${scope.targetId}`);
			return desired && desired.targetTitle !== scope.targetTitle;
		});

		for (const scope of scopesToUpdateTitle) {
			const desired = desiredByKey.get(`${scope.targetType}:${scope.targetId}`);
			if (!desired) continue;
			const { error: scopeUpdateError } = await updateImpactScope(scope.id, {
				targetType: scope.targetType,
				targetId: scope.targetId,
				targetTitle: desired.targetTitle,
				rationale: scope.rationale ?? null,
				confirmed: scope.confirmed,
				confirmedBy: scope.confirmedBy ?? null,
				confirmedAt: scope.confirmedAt ?? null,
			}, currentProjectId);
			if (scopeUpdateError) {
				setError(`影響範囲の更新に失敗しました: ${scopeUpdateError}`);
				setSubmitting(false);
				return;
			}
		}

		for (const scope of scopesToDelete) {
			const { error: scopeDeleteError } = await deleteImpactScope(scope.id, currentProjectId);
			if (scopeDeleteError) {
				setError(`影響範囲の削除に失敗しました: ${scopeDeleteError}`);
				setSubmitting(false);
				return;
			}
		}

		if (selectedRequirements.length > 0) {
			// 影響範囲の追加分のみ作成
			if (scopesToCreate.length > 0) {
				const { error: scopeCreateError } = await createImpactScopes(scopesToCreate, currentProjectId);
				if (scopeCreateError) {
					setError(`影響範囲の保存に失敗しました: ${scopeCreateError}`);
					setSubmitting(false);
					return;
				}
			}
		}

		// 受入条件を同期（既存の確認結果は維持）
		const desiredAcceptanceInputsRaw = buildAcceptanceInputs(selectedRequirements, changeRequestId);
		const desiredAcceptanceById = new Map<string, (typeof desiredAcceptanceInputsRaw)[number]>();
		for (const input of desiredAcceptanceInputsRaw) {
			if (!desiredAcceptanceById.has(input.acceptanceCriterionId)) {
				desiredAcceptanceById.set(input.acceptanceCriterionId, input);
			}
		}
		const desiredAcceptanceInputs = Array.from(desiredAcceptanceById.values());

		const { data: existingConfirmations, error: existingConfirmationsError } =
			await listAcceptanceConfirmationsByChangeRequestId(changeRequestId, currentProjectId);
		if (existingConfirmationsError) {
			setError(`受入条件の読み込みに失敗しました: ${existingConfirmationsError}`);
			setSubmitting(false);
			return;
		}

		const existingByCriterionId = new Map<string, NonNullable<typeof existingConfirmations>[number]>();
		for (const confirmation of existingConfirmations ?? []) {
			existingByCriterionId.set(confirmation.acceptanceCriterionId, confirmation);
		}

		const confirmationsToDelete = (existingConfirmations ?? []).filter(
			(confirmation) => !desiredAcceptanceById.has(confirmation.acceptanceCriterionId)
		);
		const confirmationsToCreate = desiredAcceptanceInputs.filter(
			(input) => !existingByCriterionId.has(input.acceptanceCriterionId)
		);

		for (const confirmation of confirmationsToDelete) {
			const { error: deleteError } = await deleteAcceptanceConfirmation(confirmation.id, currentProjectId);
			if (deleteError) {
				setError(`受入条件の削除に失敗しました: ${deleteError}`);
				setSubmitting(false);
				return;
			}
		}

		if (confirmationsToCreate.length > 0) {
			const { error: acceptanceError } = await createAcceptanceConfirmations(
				confirmationsToCreate,
				currentProjectId
			);
			if (acceptanceError) {
				setError(`受入条件の登録に失敗しました: ${acceptanceError}`);
				setSubmitting(false);
				return;
			}
		}

		setSubmitting(false);
		router.push(`/tickets/${changeRequestId}`);
	};

	return {
		changeRequest,
		selectedRequirements,
		title,
		setTitle,
		description,
		setDescription,
		background,
		setBackground,
		expectedBenefit,
		setExpectedBenefit,
		status,
		setStatus,
		priority,
		setPriority,
		loading,
		submitting,
		error,
		handleSubmit,
		setSelectedRequirements,
	};
}
