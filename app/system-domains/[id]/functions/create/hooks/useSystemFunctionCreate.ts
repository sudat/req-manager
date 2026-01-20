"use client";

import { useEffect, useState, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { listSystemFunctions, createSystemFunction } from "@/lib/data/system-functions";
import { listBusinessRequirements } from "@/lib/data/business-requirements";
import type { BusinessRequirement } from "@/lib/data/business-requirements";
import { createSystemRequirements } from "@/lib/data/system-requirements";
import { nextSequentialId } from "@/lib/data/id";
import type { SrfCategory, SrfStatus } from "@/lib/domain";
import { prepareSystemRequirementInputs } from "@/lib/utils/system-functions/prepare-system-requirements";
import { linkBusinessRequirements } from "@/lib/utils/system-functions/link-business-requirements";
import type { SystemRequirementCard } from "../types";

type UseSystemFunctionCreateResult = {
	// フォーム状態
	nextId: string;
	title: string;
	summary: string;
	category: SrfCategory;
	status: SrfStatus;
	businessRequirements: BusinessRequirement[];

	// ローディング・エラー状態
	loading: boolean;
	saving: boolean;
	error: string | null;

	// セッター
	setTitle: (title: string) => void;
	setSummary: (summary: string) => void;
	setCategory: (category: SrfCategory) => void;
	setStatus: (status: SrfStatus) => void;

	// 操作
	handleSubmit: (event: FormEvent, systemRequirements: SystemRequirementCard[]) => Promise<void>;
};

/**
 * システム機能作成フォームの状態管理・保存処理を行うカスタムフック
 */
export function useSystemFunctionCreate(systemDomainId: string): UseSystemFunctionCreateResult {
	const router = useRouter();

	// フォーム状態
	const [nextId, setNextId] = useState("SRF-001");
	const [title, setTitle] = useState("");
	const [summary, setSummary] = useState("");
	const [category, setCategory] = useState<SrfCategory>("screen");
	const [status, setStatus] = useState<SrfStatus>("not_implemented");
	const [businessRequirements, setBusinessRequirements] = useState<BusinessRequirement[]>([]);

	// ローディング・エラー状態
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// nextIdを取得
	useEffect(() => {
		let active = true;

		async function fetchNextId(): Promise<void> {
			const { data, error: fetchError } = await listSystemFunctions();
			if (!active) return;
			if (fetchError) {
				setError(fetchError);
				return;
			}
			const ids = (data ?? []).map((srf) => srf.id);
			setNextId(nextSequentialId("SRF-", ids));
		}

		fetchNextId();

		return () => {
			active = false;
		};
	}, []);

	// 業務要件を取得
	useEffect(() => {
		let active = true;

		async function fetchBusinessRequirements(): Promise<void> {
			const { data, error: fetchError } = await listBusinessRequirements();
			if (!active) return;
			if (fetchError) {
				setError(fetchError);
				return;
			}
			setBusinessRequirements(data ?? []);
			setLoading(false);
		}

		fetchBusinessRequirements();

		return () => {
			active = false;
		};
	}, []);

	// handleSubmit
	const handleSubmit = useCallback(
		async (event: FormEvent, systemRequirements: SystemRequirementCard[]): Promise<void> => {
			event.preventDefault();
			setSaving(true);
			setError(null);

			try {
				// 1. システム機能を作成
				const { error: saveError } = await createSystemFunction({
					id: nextId,
					systemDomainId: systemDomainId,
					category,
					title: title.trim(),
					summary: summary.trim(),
					status,
					relatedTaskIds: [],
					requirementIds: systemRequirements.map((sr) => sr.id),
					systemDesign: [],
					codeRefs: [],
				});

				if (saveError) {
					setError(saveError);
					setSaving(false);
					return;
				}

				// 2. システム要件を作成
				const sysReqInputs = prepareSystemRequirementInputs(
					systemRequirements,
					businessRequirements,
					nextId
				);

				const { error: sysReqError } = await createSystemRequirements(sysReqInputs);
				if (sysReqError) {
					setError(sysReqError);
					setSaving(false);
					return;
				}

				// 3. 業務要件の関連システム要件IDを更新
				const linkError = await linkBusinessRequirements(
					systemRequirements,
					businessRequirements
				);
				if (linkError) {
					setError(linkError);
					setSaving(false);
					return;
				}

				// 4. 成功時に一覧画面へ遷移
				setSaving(false);
				router.push(`/system-domains/${systemDomainId}`);
			} catch (e) {
				setError(e instanceof Error ? e.message : String(e));
				setSaving(false);
			}
		},
		[
			nextId,
			systemDomainId,
			category,
			title,
			summary,
			status,
			businessRequirements,
			router,
		]
	);

	return {
		nextId,
		title,
		summary,
		category,
		status,
		businessRequirements,
		loading,
		saving,
		error,
		setTitle,
		setSummary,
		setCategory,
		setStatus,
		handleSubmit,
	};
}
