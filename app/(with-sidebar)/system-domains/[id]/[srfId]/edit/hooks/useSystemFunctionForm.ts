"use client";

import { useState, useEffect, useCallback } from "react";
import {
	getSystemFunctionById,
	updateSystemFunction,
} from "@/lib/data/system-functions";
import { listSystemRequirementsBySrfId } from "@/lib/data/system-requirements";
import { fromSystemRequirement } from "@/lib/data/requirement-mapper";
import { deleteSystemRequirementsBySrfId, createSystemRequirements, updateSystemRequirement } from "@/lib/data/system-requirements";
import { listBusinessRequirementsByIds } from "@/lib/data/business-requirements";
import { linkBusinessRequirements } from "@/lib/utils/system-functions/link-business-requirements";
import { useProject } from "@/components/project/project-context";
import type {
	SystemFunction,
	SrfCategory,
	SrfStatus,
	DesignItemCategory,
	SystemDesignItem,
	EntryPoint,
} from "@/lib/domain";
import type { Requirement } from "@/lib/domain/forms";
import type { DesignTarget, SystemDesignItemV2 } from "@/lib/domain/schemas/system-design";
import type { Deliverable } from "@/lib/domain/schemas/deliverable";
import { classifyDesignItems, extractTargetsFromLegacyItems } from "@/lib/data/system-design-migration";

// ============================================
// 型定義
// ============================================

interface SystemRequirementCard {
	id: string;
	title: string;
	summary: string;
	businessRequirementIds: string[];
	acceptanceCriteriaJson: any[];
}

export interface NewDesignItem {
	category: DesignItemCategory;
	title: string;
	description: string;
	priority: "high" | "medium" | "low";
}

export interface CodeRef {
	githubUrl: string;
	paths: string[];
	note: string;
}

export interface SystemFunctionFormState {
	// ローディング状態
	loading: boolean;
	saving: boolean;
	error: string | null;
	existingSrf: SystemFunction | null;

	// 基本情報
	category: SrfCategory;
	status: SrfStatus;
	title: string;
	summary: string;

	// 成果物（新構造）
	deliverables: Deliverable[];

	// システム設計（V2）
	designTargets: DesignTarget[];
	designItemsV2: SystemDesignItemV2[];

	// システム設計（レガシー）
	systemDesign: SystemDesignItem[];
	newDesignItem: NewDesignItem;

	// コード参照
	codeRefs: SystemFunction["codeRefs"];
	newCodeRef: CodeRef;

	// エントリポイント
	entryPoints: EntryPoint[];

	// システム要件
	systemRequirements: Requirement[];
}

export interface SystemFunctionFormActions {
	// 基本情報の更新
	setCategory: (value: SrfCategory) => void;
	setStatus: (value: SrfStatus) => void;
	setTitle: (value: string) => void;
	setSummary: (value: string) => void;

	// 成果物操作
	setDeliverables: (deliverables: Deliverable[]) => void;

	// システム設計操作（V2）
	setDesignTargets: (targets: DesignTarget[]) => void;
	setDesignItemsV2: (items: SystemDesignItemV2[]) => void;

	// システム設計操作（レガシー）
	setNewDesignItem: (item: NewDesignItem) => void;
	addDesignItem: () => void;
	removeDesignItem: (itemId: string) => void;

	// コード参照操作
	setNewCodeRef: (ref: CodeRef) => void;
	addCodeRef: () => void;
	removeCodeRef: (index: number) => void;
	addPath: () => void;
	updatePath: (index: number, value: string) => void;
	removePath: (index: number) => void;

	// エントリポイント操作
	setEntryPoints: (entryPoints: EntryPoint[]) => void;

	// システム要件操作
	addSystemRequirement: () => void;
	updateSystemRequirement: (reqId: string, patch: Partial<Requirement>) => void;
	removeSystemRequirement: (reqId: string) => void;

	// 保存
	save: (systemDomainId: string) => Promise<boolean>;
}

// ============================================
// 初期値
// ============================================

const INITIAL_DESIGN_ITEM: NewDesignItem = {
	category: "database",
	title: "",
	description: "",
	priority: "medium",
};

const INITIAL_CODE_REF: CodeRef = {
	githubUrl: "",
	paths: [""],
	note: "",
};

const validateEntryPoints = (entryPoints: EntryPoint[]): string | null => {
	const trimmed = entryPoints.map((entry) => entry.path.trim());
	if (trimmed.some((path) => path.length === 0)) {
		return "エントリポイントのパスは必須です。";
	}
	const seen = new Set<string>();
	for (const path of trimmed) {
		if (seen.has(path)) {
			return "エントリポイントのパスが重複しています。";
		}
		seen.add(path);
	}
	return null;
};

// ============================================
// カスタムフック
// ============================================

export function useSystemFunctionForm(srfId: string): {
	state: SystemFunctionFormState;
	actions: SystemFunctionFormActions;
} {
	// ローディング状態
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [existingSrf, setExistingSrf] = useState<SystemFunction | null>(null);

	// 基本情報
	const [category, setCategory] = useState<SrfCategory>("screen");
	const [status, setStatus] = useState<SrfStatus>("not_implemented");
	const [title, setTitle] = useState("");
	const [summary, setSummary] = useState("");

	// 成果物
	const [deliverables, setDeliverables] = useState<Deliverable[]>([]);

	// システム設計（V2）
	const [designTargets, setDesignTargets] = useState<DesignTarget[]>([]);
	const [designItemsV2, setDesignItemsV2] = useState<SystemDesignItemV2[]>([]);

	// システム設計（レガシー）
	const [systemDesign, setSystemDesign] = useState<SystemDesignItem[]>([]);
	const [newDesignItem, setNewDesignItem] =
		useState<NewDesignItem>(INITIAL_DESIGN_ITEM);

	// コード参照
	const [codeRefs, setCodeRefs] = useState<SystemFunction["codeRefs"]>([]);
	const [newCodeRef, setNewCodeRef] = useState<CodeRef>(INITIAL_CODE_REF);

	// エントリポイント
	const [entryPoints, setEntryPoints] = useState<EntryPoint[]>([]);

	// システム要件
	const [systemRequirements, setSystemRequirements] = useState<Requirement[]>([]);
	const { currentProjectId, loading: projectLoading } = useProject();

	// データ読み込み
	useEffect(() => {
		if (projectLoading || !currentProjectId) {
			setError("プロジェクトが選択されていません");
			setExistingSrf(null);
			setLoading(false);
			return;
		}
		let active = true;

		async function fetchData(): Promise<void> {
			setLoading(true);
			const { data, error: fetchError } = await getSystemFunctionById(srfId, currentProjectId ?? undefined);

			if (!active) return;

			if (fetchError) {
				setError(fetchError);
				setExistingSrf(null);
			} else {
				setError(null);
				setExistingSrf(data ?? null);
				if (data) {
					setCategory(data.category);
					setStatus(data.status);
					setTitle(data.title);
					setSummary(data.summary);

					// 成果物を設定
					setDeliverables(data.deliverables ?? []);

					// システム設計項目をV2とレガシーに分類
					const { v2Items, legacyItems } = classifyDesignItems(data.systemDesign ?? []);
					setDesignItemsV2(v2Items);
					setSystemDesign(legacyItems);

					// V2アイテムから対象物を抽出
					let uniqueTargets = v2Items.reduce((acc, item) => {
						const existing = acc.find((t) => t.name === item.target.name);
						if (!existing) {
							acc.push(item.target);
						}
						return acc;
					}, [] as DesignTarget[]);

					// V2アイテムがない場合はレガシーアイテムから対象物を生成
					if (uniqueTargets.length === 0 && legacyItems.length > 0) {
						uniqueTargets = extractTargetsFromLegacyItems(legacyItems);
					}

					setDesignTargets(uniqueTargets);

					setCodeRefs(data.codeRefs ?? []);
					setEntryPoints(data.entryPoints ?? []);
				}
			}

			// システム要件をロード
			const { data: sysReqs, error: sysReqError } = await listSystemRequirementsBySrfId(srfId, currentProjectId ?? undefined);
			if (!active) return;

			if (sysReqError) {
				console.error("システム要件読み込みエラー:", sysReqError);
			} else {
				setSystemRequirements(sysReqs?.map((sr) => fromSystemRequirement(sr)) ?? []);
			}

			setLoading(false);
		}

		fetchData();
		return () => {
			active = false;
		};
	}, [srfId, currentProjectId, projectLoading]);

	// 設計項目を追加
	const addDesignItem = useCallback((): void => {
		if (!newDesignItem.title || !newDesignItem.description) return;

		const newItem: SystemDesignItem = {
			id: `SD-${srfId}-${Date.now()}`,
			...newDesignItem,
		};

		setSystemDesign((prev) => [...prev, newItem]);
		setNewDesignItem(INITIAL_DESIGN_ITEM);
	}, [newDesignItem, srfId]);

	// 設計項目を削除
	const removeDesignItem = useCallback((itemId: string): void => {
		setSystemDesign((prev) => prev.filter((item) => item.id !== itemId));
	}, []);

	// コード参照を追加
	const addCodeRef = useCallback((): void => {
		if (!newCodeRef.githubUrl) return;

		const validPaths = newCodeRef.paths.filter((p) => p.trim() !== "");
		if (validPaths.length === 0) return;

		setCodeRefs((prev) => [...prev, { ...newCodeRef, paths: validPaths }]);
		setNewCodeRef(INITIAL_CODE_REF);
	}, [newCodeRef]);

	// コード参照を削除
	const removeCodeRef = useCallback((index: number): void => {
		setCodeRefs((prev) => prev.filter((_, i) => i !== index));
	}, []);

	// パスを追加
	const addPath = useCallback((): void => {
		setNewCodeRef((prev) => ({ ...prev, paths: [...prev.paths, ""] }));
	}, []);

	// パスを更新
	const updatePath = useCallback((index: number, value: string): void => {
		setNewCodeRef((prev) => {
			const newPaths = [...prev.paths];
			newPaths[index] = value;
			return { ...prev, paths: newPaths };
		});
	}, []);

	// パスを削除
	const removePath = useCallback((index: number): void => {
		setNewCodeRef((prev) => ({
			...prev,
			paths: prev.paths.filter((_, i) => i !== index),
		}));
	}, []);

	// システム要件を追加
	const addSystemRequirement = useCallback((): void => {
		const newId = `SR-${srfId}-${String(systemRequirements.length + 1).padStart(3, "0")}`;
		// 既存のシステム要件からtaskIdを取得（最初の要件のtaskIdを使用）
		const existingTaskId = systemRequirements.length > 0 ? systemRequirements[0].taskId : "";

		setSystemRequirements((prev) => [
			...prev,
			{
				id: newId,
				type: "システム要件",
				title: "",
				summary: "",
				conceptIds: [],
				srfId: srfId,
				systemDomainIds: [],
				acceptanceCriteria: [],
				acceptanceCriteriaJson: [],
				category: "function",
				businessRequirementIds: [],
				relatedSystemRequirementIds: [],
				taskId: existingTaskId, // 既存のtaskIdを継承
			},
		]);
	}, [srfId, systemRequirements.length]);

	// システム要件を更新
	const updateSystemRequirement = useCallback((reqId: string, patch: Partial<Requirement>): void => {
		setSystemRequirements((prev) =>
			prev.map((req) => (req.id === reqId ? { ...req, ...patch } : req))
		);
	}, []);

	// システム要件を削除
	const removeSystemRequirement = useCallback((reqId: string): void => {
		setSystemRequirements((prev) => prev.filter((req) => req.id !== reqId));
	}, []);

	// 保存
	const save = useCallback(
		async (systemDomainId: string): Promise<boolean> => {
			if (!existingSrf) return false;
			if (projectLoading || !currentProjectId) {
				setError("プロジェクトが選択されていません");
				return false;
			}

			const entryValidationError = validateEntryPoints(entryPoints);
			if (entryValidationError) {
				setError(entryValidationError);
				return false;
			}

			setSaving(true);
			const normalizedEntryPoints = entryPoints.map((entry) => ({
				path: entry.path.trim(),
				type: entry.type?.trim() || null,
				responsibility: entry.responsibility?.trim() || null,
			}));

			// V2とレガシーをマージ
			const mergedDesignItems = [...designItemsV2, ...systemDesign];

			// システム機能を更新
			const { error: saveError } = await updateSystemFunction(srfId, {
				systemDomainId,
				category,
				status,
				title,
				summary,
				relatedTaskIds: existingSrf.relatedTaskIds ?? [],
				requirementIds: existingSrf.requirementIds ?? [],
				systemDesign: mergedDesignItems,
				entryPoints: normalizedEntryPoints,
				deliverables,
				codeRefs,
			}, currentProjectId);

			if (saveError) {
				setError(saveError);
				setSaving(false);
				return false;
			}

			// システム要件を保存：一旦削除して再作成
			await deleteSystemRequirementsBySrfId(srfId, currentProjectId);

			if (systemRequirements.length > 0) {
				const sysReqInputs = systemRequirements.map((req, index) => ({
					id: req.id,
					taskId: req.taskId || "", // 既存のtaskIdを維持（外部キー制約対応）
					srfId: srfId,
					title: req.title,
					summary: req.summary,
					conceptIds: req.conceptIds,
					impacts: [],
					category: req.category,
					businessRequirementIds: req.businessRequirementIds ?? [],
					acceptanceCriteriaJson: req.acceptanceCriteriaJson,
					acceptanceCriteria: req.acceptanceCriteria,
					systemDomainIds: req.systemDomainIds,
					sortOrder: index,
					projectId: currentProjectId,
				}));

				const { error: sysReqError } = await createSystemRequirements(sysReqInputs);
				if (sysReqError) {
					setError(sysReqError);
					setSaving(false);
					return false;
				}
			}

			// 双方向参照の同期：システム要件から関連する業務要件を収集
			const relatedBizReqIds = Array.from(
				new Set(
					systemRequirements.flatMap((req) => req.businessRequirementIds ?? [])
				)
			);

			if (relatedBizReqIds.length > 0) {
				// 業務要件を取得
				const { data: relatedBizReqs, error: bizFetchError } =
					await listBusinessRequirementsByIds(relatedBizReqIds, currentProjectId);

				if (!bizFetchError && relatedBizReqs && relatedBizReqs.length > 0) {
					// SystemRequirementCard型に変換
					const sysReqCards: SystemRequirementCard[] = systemRequirements
						.filter((req) => (req.businessRequirementIds?.length ?? 0) > 0)
						.map((req) => ({
							id: req.id,
							title: req.title,
							summary: req.summary,
							businessRequirementIds: req.businessRequirementIds ?? [],
							acceptanceCriteriaJson: req.acceptanceCriteriaJson ?? [],
						}));

					// 双方向参照を同期
					const linkError = await linkBusinessRequirements(sysReqCards, relatedBizReqs, currentProjectId);
					if (linkError) {
						setError(`双方向参照同期エラー: ${linkError}`);
						setSaving(false);
						return false;
					}
				}
			}

			setSaving(false);
			return true;
		},
		[
			existingSrf,
			srfId,
			category,
			status,
			title,
			summary,
			deliverables,
			designItemsV2,
			systemDesign,
			entryPoints,
			codeRefs,
			systemRequirements,
			currentProjectId,
			projectLoading,
		],
	);

	return {
		state: {
			loading,
			saving,
			error,
			existingSrf,
			category,
			status,
			title,
			summary,
			deliverables,
			designTargets,
			designItemsV2,
			systemDesign,
			newDesignItem,
			codeRefs,
			newCodeRef,
			entryPoints,
			systemRequirements,
		},
		actions: {
			setCategory,
			setStatus,
			setTitle,
			setSummary,
			setDeliverables,
			setDesignTargets,
			setDesignItemsV2,
			setNewDesignItem,
			addDesignItem,
			removeDesignItem,
			setNewCodeRef,
			addCodeRef,
			removeCodeRef,
			addPath,
			updatePath,
			removePath,
			setEntryPoints,
			addSystemRequirement,
			updateSystemRequirement,
			removeSystemRequirement,
			save,
		},
	};
}
