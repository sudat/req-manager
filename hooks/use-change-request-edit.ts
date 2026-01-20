"use client";

import { useEffect, useState } from "react";
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
	deleteImpactScopesByChangeRequestId,
} from "@/lib/data/impact-scopes";
import {
	createAcceptanceConfirmations,
	deleteAcceptanceConfirmationsByChangeRequestId,
} from "@/lib/data/acceptance-confirmations";
import {
	transformImpactScopesToSelectedRequirements,
} from "@/lib/data/transformers/impact-scope-transformer";
import {
	buildAcceptanceInputs,
	buildImpactScopeInputs,
} from "@/lib/data/transformers/acceptance-input-builder";

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

	// データフェッチ
	useEffect(() => {
		let active = true;

		async function fetchData(): Promise<void> {
			setLoading(true);

			// 変更要求を取得
			const { data, error: fetchError } = await getChangeRequestById(changeRequestId);
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
			const { data: impactScopes } = await listImpactScopesByChangeRequestId(changeRequestId);
			if (!active) return;

			if (impactScopes && impactScopes.length > 0) {
				try {
					const result = await transformImpactScopesToSelectedRequirements(impactScopes);
					if (active) {
						setSelectedRequirements(result.selectedRequirements);
					}
				} catch (err) {
					if (active) {
						setError(err instanceof Error ? err.message : "影響範囲の読み込みに失敗しました");
					}
				}
			}

			setLoading(false);
		}

		fetchData();
		return () => {
			active = false;
		};
	}, [changeRequestId]);

	// 保存処理
	const handleSubmit = async (): Promise<void> => {
		setSubmitting(true);
		setError(null);

		// 変更要求を更新
		const { error: updateError } = await updateChangeRequest(changeRequestId, {
			title,
			description: description || null,
			background: background || null,
			expectedBenefit: expectedBenefit || null,
			status,
			priority,
		});

		if (updateError) {
			setError(updateError);
			setSubmitting(false);
			return;
		}

		// 影響範囲を更新（一度削除して再作成）
		await deleteImpactScopesByChangeRequestId(changeRequestId);
		await deleteAcceptanceConfirmationsByChangeRequestId(changeRequestId);

		if (selectedRequirements.length > 0) {
			// 影響範囲を作成
			const impactScopeInputs = buildImpactScopeInputs(
				selectedRequirements,
				changeRequestId
			);

			const { error: scopeError } = await createImpactScopes(impactScopeInputs);
			if (scopeError) {
				setError(`影響範囲の保存に失敗しました: ${scopeError}`);
				setSubmitting(false);
				return;
			}

			// 受入条件を自動登録
			const acceptanceInputs = buildAcceptanceInputs(
				selectedRequirements,
				changeRequestId
			);

			if (acceptanceInputs.length > 0) {
				const { error: acceptanceError } = await createAcceptanceConfirmations(
					acceptanceInputs
				);
				if (acceptanceError) {
					setError(`受入条件の登録に失敗しました: ${acceptanceError}`);
					setSubmitting(false);
					return;
				}
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
