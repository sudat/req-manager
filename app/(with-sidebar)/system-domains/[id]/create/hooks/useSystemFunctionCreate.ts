"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useProject } from "@/components/project/project-context";
import type { BusinessRequirement } from "@/lib/data/business-requirements";
import { listBusinessRequirements } from "@/lib/data/business-requirements";
import { nextSequentialIdFrom } from "@/lib/data/id";
import { listSystemFunctions } from "@/lib/data/system-functions";
import type { EntryPoint, SrfCategory, SrfStatus } from "@/lib/domain";
import type { Deliverable } from "@/lib/domain/schemas/deliverable";
import {
	validateSystemFunctionEntryPoints,
	validateImplUnitSds,
} from "@/lib/utils/system-functions/validate-system-function";
import { createSystemFunctionWithRelations } from "@/lib/utils/system-functions/create-system-function";
import type { ImplUnitSdDraft } from "@/components/forms/impl-unit-sd-list";
import type { SystemRequirementCard } from "../types";
import { normalizeAreaCode } from "@/lib/utils/id-rules";

type UseSystemFunctionCreateResult = {
	// フォーム状態
	nextId: string;
	title: string;
	summary: string;
	designPolicy: string;
	category: SrfCategory;
	status: SrfStatus;
	businessRequirements: BusinessRequirement[];
	deliverables: Deliverable[];
	entryPoints: EntryPoint[];
	implUnitSds: ImplUnitSdDraft[];

	// ローディング・エラー状態
	loading: boolean;
	saving: boolean;
	error: string | null;

	// セッター
	setTitle: (title: string) => void;
	setSummary: (summary: string) => void;
	setDesignPolicy: (designPolicy: string) => void;
	setCategory: (category: SrfCategory) => void;
	setStatus: (status: SrfStatus) => void;
	setDeliverables: (deliverables: Deliverable[]) => void;
	setEntryPoints: (entryPoints: EntryPoint[]) => void;
	setImplUnitSds: (implUnitSds: ImplUnitSdDraft[]) => void;

	// 操作
	handleSubmit: (event: FormEvent, systemRequirements: SystemRequirementCard[]) => Promise<void>;
};

/**
 * システム機能作成フォームの状態管理・保存処理を行うカスタムフック
 */
export function useSystemFunctionCreate(systemDomainId: string): UseSystemFunctionCreateResult {
	const router = useRouter();
	const normalizedDomainId = normalizeAreaCode(systemDomainId) || "SD";

	// フォーム状態
	const [nextId, setNextId] = useState(`SF-${normalizedDomainId}-0001`);
	const [title, setTitle] = useState("");
	const [summary, setSummary] = useState("");
	const [designPolicy, setDesignPolicy] = useState("");
	const [category, setCategory] = useState<SrfCategory>("screen");
	const [status, setStatus] = useState<SrfStatus>("not_implemented");
	const [businessRequirements, setBusinessRequirements] = useState<BusinessRequirement[]>([]);
	const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
	const [entryPoints, setEntryPoints] = useState<EntryPoint[]>([]);
	const [implUnitSds, setImplUnitSds] = useState<ImplUnitSdDraft[]>([]);

	// ローディング・エラー状態
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { currentProjectId, loading: projectLoading } = useProject();

	// nextIdと業務要件を取得
	useEffect(() => {
		if (projectLoading || !currentProjectId) {
			setError("プロジェクトが選択されていません");
			setLoading(false);
			return;
		}
		let active = true;

		async function fetchData(): Promise<void> {
			const [{ data: srfData, error: srfError }, { data: brData, error: brError }] =
				await Promise.all([
					listSystemFunctions(currentProjectId),
					listBusinessRequirements(currentProjectId),
				]);

			if (!active) return;

			if (srfError) {
				setError(srfError);
			} else {
				const prefix = `SF-${normalizedDomainId}-`;
				setNextId(nextSequentialIdFrom(prefix, srfData ?? [], (srf) => srf.id, 4));
			}

			if (brError) {
				setError(brError);
			} else {
				setBusinessRequirements(brData ?? []);
			}

			setLoading(false);
		}

		fetchData();

		return () => {
			active = false;
		};
	}, [currentProjectId, projectLoading]);

	// handleSubmit
	const handleSubmit = useCallback(
		async function handleSubmit(
			event: FormEvent,
			systemRequirements: SystemRequirementCard[]
		): Promise<void> {
			event.preventDefault();
			setSaving(true);
			setError(null);

			try {
				if (projectLoading || !currentProjectId) {
					setError("プロジェクトが選択されていません");
					setSaving(false);
					return;
				}

				// バリデーション
				const entryValidationError = validateSystemFunctionEntryPoints(entryPoints);
				if (entryValidationError) {
					setError(entryValidationError);
					setSaving(false);
					return;
				}

				const implValidationError = validateImplUnitSds(implUnitSds);
				if (implValidationError) {
					setError(implValidationError);
					setSaving(false);
					return;
				}

				// 保存処理
				const { error: saveError } = await createSystemFunctionWithRelations({
					nextId,
					systemDomainId,
					category,
					title,
					summary,
					designPolicy,
					status,
					deliverables,
					entryPoints,
					implUnitSds,
					systemRequirements,
					businessRequirements,
					projectId: currentProjectId,
				});

				if (saveError) {
					setError(saveError);
					setSaving(false);
					return;
				}

				// 成功時に一覧画面へ遷移
				setSaving(false);
				router.push(`/system/${systemDomainId}`);
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
			designPolicy,
			status,
			deliverables,
			entryPoints,
			implUnitSds,
			businessRequirements,
			router,
			currentProjectId,
			projectLoading,
		]
	);

	return {
		nextId,
		title,
		summary,
		designPolicy,
		category,
		status,
		businessRequirements,
		deliverables,
		entryPoints,
		implUnitSds,
		loading,
		saving,
		error,
		setTitle,
		setSummary,
		setDesignPolicy,
		setCategory,
		setStatus,
		setDeliverables,
		setEntryPoints,
		setImplUnitSds,
		handleSubmit,
	};
}
