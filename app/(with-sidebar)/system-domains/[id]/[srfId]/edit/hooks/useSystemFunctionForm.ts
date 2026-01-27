"use client";

import { useCallback } from "react";
import { useProject } from "@/components/project/project-context";
import type {
	SrfCategory,
	SrfStatus,
	SystemDesignItem,
	SystemFunction,
	EntryPoint,
} from "@/lib/domain";
import type { Requirement } from "@/lib/domain/forms";
import type { DesignTarget, SystemDesignItemV2 } from "@/lib/domain/schemas/system-design";
import type { Deliverable } from "@/lib/domain/schemas/deliverable";
import type { ImplUnitSdDraft } from "@/components/forms/impl-unit-sd-list";
import type { NewDesignItem, CodeRef } from "./types";
import {
	validateSystemFunctionEntryPoints,
	validateImplUnitSds,
} from "@/lib/utils/system-functions/validate-system-function";
import { saveSystemFunction } from "@/lib/utils/system-functions/save-system-function";
import { useSystemFunctionFormState } from "./useSystemFunctionFormState";
import { useSystemFunctionFormActions } from "./useSystemFunctionFormActions";
import { useSystemFunctionDataFetch } from "./useSystemFunctionDataFetch";

// 型の再エクスポート（公開インターフェース維持）
export type { NewDesignItem, CodeRef };

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
	designPolicy: string;

	// 成果物（新構造）
	deliverables: Deliverable[];

	// システム設計（V2）
	designTargets: DesignTarget[];
	designItemsV2: SystemDesignItemV2[];

	// システム設計（レガシー）
	systemDesign: SystemDesignItem[];
	newDesignItem: NewDesignItem;

	// コード参照
	codeRefs: CodeRef[];
	newCodeRef: CodeRef;

	// エントリポイント
	entryPoints: EntryPoint[];

	// 実装単位SD
	implUnitSds: ImplUnitSdDraft[];

	// システム要件
	systemRequirements: Requirement[];
}

export interface SystemFunctionFormActions {
	// 基本情報の更新
	setCategory: (value: SrfCategory) => void;
	setStatus: (value: SrfStatus) => void;
	setTitle: (value: string) => void;
	setSummary: (value: string) => void;
	setDesignPolicy: (value: string) => void;

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

	// 実装単位SD操作
	setImplUnitSds: (implUnitSds: ImplUnitSdDraft[]) => void;

	// システム要件操作
	addSystemRequirement: () => void;
	updateSystemRequirement: (reqId: string, patch: Partial<Requirement>) => void;
	removeSystemRequirement: (reqId: string) => void;

	// 保存
	save: (systemDomainId: string) => Promise<boolean>;
}

// ============================================
// カスタムフック
// ============================================

export function useSystemFunctionForm(srfId: string): {
	state: SystemFunctionFormState;
	actions: SystemFunctionFormActions;
} {
	const { currentProjectId, loading: projectLoading } = useProject();

	// 状態管理
	const state = useSystemFunctionFormState();

	// データフェッチ
	useSystemFunctionDataFetch(srfId, {
		setLoading: state.setLoading,
		setError: state.setError,
		setExistingSrf: state.setExistingSrf,
		setCategory: state.setCategory,
		setStatus: state.setStatus,
		setTitle: state.setTitle,
		setSummary: state.setSummary,
		setDesignPolicy: state.setDesignPolicy,
		setDeliverables: state.setDeliverables,
		setDesignTargets: state.setDesignTargets,
		setDesignItemsV2: state.setDesignItemsV2,
		setSystemDesign: state.setSystemDesign,
		setCodeRefs: state.setCodeRefs,
		setEntryPoints: state.setEntryPoints,
		setImplUnitSds: state.setImplUnitSds,
		setSystemRequirements: state.setSystemRequirements,
	});

	// アクション
	const actions = useSystemFunctionFormActions({
		srfId,
		newDesignItem: state.newDesignItem,
		setSystemDesign: state.setSystemDesign,
		setNewDesignItem: state.setNewDesignItem,
		newCodeRef: state.newCodeRef,
		setCodeRefs: state.setCodeRefs,
		setNewCodeRef: state.setNewCodeRef,
		systemRequirements: state.systemRequirements,
		setSystemRequirements: state.setSystemRequirements,
	});

	// 保存処理
	const save = useCallback(
		async (systemDomainId: string): Promise<boolean> => {
			if (!state.existingSrf) return false;
			if (projectLoading || !currentProjectId) {
				state.setError("プロジェクトが選択されていません");
				return false;
			}

			// バリデーション
			const entryValidationError = validateSystemFunctionEntryPoints(state.entryPoints);
			if (entryValidationError) {
				state.setError(entryValidationError);
				return false;
			}

			const implValidationError = validateImplUnitSds(state.implUnitSds);
			if (implValidationError) {
				state.setError(implValidationError);
				return false;
			}

			// 保存実行
			state.setSaving(true);
			const { error: saveError } = await saveSystemFunction({
				srfId,
				existingSrf: state.existingSrf,
				systemDomainId,
				category: state.category,
				status: state.status,
				title: state.title,
				summary: state.summary,
				designPolicy: state.designPolicy,
				deliverables: state.deliverables,
				designItemsV2: state.designItemsV2,
				systemDesign: state.systemDesign,
				entryPoints: state.entryPoints,
				implUnitSds: state.implUnitSds,
				codeRefs: state.codeRefs,
				systemRequirements: state.systemRequirements,
				projectId: currentProjectId,
			});

			if (saveError) {
				state.setError(saveError);
				state.setSaving(false);
				return false;
			}

			state.setSaving(false);
			return true;
		},
		[
			srfId,
			state,
			currentProjectId,
			projectLoading,
		]
	);

	return {
		state: {
			loading: state.loading,
			saving: state.saving,
			error: state.error,
			existingSrf: state.existingSrf,
			category: state.category,
			status: state.status,
			title: state.title,
			summary: state.summary,
			designPolicy: state.designPolicy,
			deliverables: state.deliverables,
			designTargets: state.designTargets,
			designItemsV2: state.designItemsV2,
			systemDesign: state.systemDesign,
			newDesignItem: state.newDesignItem,
			codeRefs: state.codeRefs,
			newCodeRef: state.newCodeRef,
			entryPoints: state.entryPoints,
			implUnitSds: state.implUnitSds,
			systemRequirements: state.systemRequirements,
		},
		actions: {
			setCategory: state.setCategory,
			setStatus: state.setStatus,
			setTitle: state.setTitle,
			setSummary: state.setSummary,
			setDesignPolicy: state.setDesignPolicy,
			setDeliverables: state.setDeliverables,
			setDesignTargets: state.setDesignTargets,
			setDesignItemsV2: state.setDesignItemsV2,
			setNewDesignItem: state.setNewDesignItem,
			addDesignItem: actions.addDesignItem,
			removeDesignItem: actions.removeDesignItem,
			setNewCodeRef: state.setNewCodeRef,
			addCodeRef: actions.addCodeRef,
			removeCodeRef: actions.removeCodeRef,
			addPath: actions.addPath,
			updatePath: actions.updatePath,
			removePath: actions.removePath,
			setEntryPoints: state.setEntryPoints,
			setImplUnitSds: state.setImplUnitSds,
			addSystemRequirement: actions.addSystemRequirement,
			updateSystemRequirement: actions.updateSystemRequirement,
			removeSystemRequirement: actions.removeSystemRequirement,
			save,
		},
	};
}
