"use client";

import { useState, useEffect, useCallback } from "react";
import {
	getSystemFunctionById,
	updateSystemFunction,
} from "@/lib/data/system-functions";
import type {
	SystemFunction,
	SrfCategory,
	SrfStatus,
	DesignItemCategory,
	SystemDesignItem,
} from "@/lib/mock/data/types";

// ============================================
// 型定義
// ============================================

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
	designDocNo: string;
	category: SrfCategory;
	status: SrfStatus;
	title: string;
	summary: string;

	// システム設計
	systemDesign: SystemDesignItem[];
	newDesignItem: NewDesignItem;

	// コード参照
	codeRefs: SystemFunction["codeRefs"];
	newCodeRef: CodeRef;
}

export interface SystemFunctionFormActions {
	// 基本情報の更新
	setDesignDocNo: (value: string) => void;
	setCategory: (value: SrfCategory) => void;
	setStatus: (value: SrfStatus) => void;
	setTitle: (value: string) => void;
	setSummary: (value: string) => void;

	// システム設計操作
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
	const [designDocNo, setDesignDocNo] = useState("");
	const [category, setCategory] = useState<SrfCategory>("screen");
	const [status, setStatus] = useState<SrfStatus>("not_implemented");
	const [title, setTitle] = useState("");
	const [summary, setSummary] = useState("");

	// システム設計
	const [systemDesign, setSystemDesign] = useState<SystemDesignItem[]>([]);
	const [newDesignItem, setNewDesignItem] =
		useState<NewDesignItem>(INITIAL_DESIGN_ITEM);

	// コード参照
	const [codeRefs, setCodeRefs] = useState<SystemFunction["codeRefs"]>([]);
	const [newCodeRef, setNewCodeRef] = useState<CodeRef>(INITIAL_CODE_REF);

	// データ読み込み
	useEffect(() => {
		let active = true;

		async function fetchData(): Promise<void> {
			setLoading(true);
			const { data, error: fetchError } = await getSystemFunctionById(srfId);

			if (!active) return;

			if (fetchError) {
				setError(fetchError);
				setExistingSrf(null);
			} else {
				setError(null);
				setExistingSrf(data ?? null);
				if (data) {
					setDesignDocNo(data.designDocNo);
					setCategory(data.category);
					setStatus(data.status);
					setTitle(data.title);
					setSummary(data.summary);
					setSystemDesign(data.systemDesign ?? []);
					setCodeRefs(data.codeRefs ?? []);
				}
			}
			setLoading(false);
		}

		fetchData();
		return () => {
			active = false;
		};
	}, [srfId]);

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

	// 保存
	const save = useCallback(
		async (systemDomainId: string): Promise<boolean> => {
			if (!existingSrf) return false;

			setSaving(true);
			const { error: saveError } = await updateSystemFunction(srfId, {
				systemDomainId,
				designDocNo,
				category,
				status,
				title,
				summary,
				relatedTaskIds: existingSrf.relatedTaskIds ?? [],
				requirementIds: existingSrf.requirementIds ?? [],
				systemDesign,
				codeRefs,
			});
			setSaving(false);

			if (saveError) {
				setError(saveError);
				return false;
			}
			return true;
		},
		[
			existingSrf,
			srfId,
			designDocNo,
			category,
			status,
			title,
			summary,
			systemDesign,
			codeRefs,
		],
	);

	return {
		state: {
			loading,
			saving,
			error,
			existingSrf,
			designDocNo,
			category,
			status,
			title,
			summary,
			systemDesign,
			newDesignItem,
			codeRefs,
			newCodeRef,
		},
		actions: {
			setDesignDocNo,
			setCategory,
			setStatus,
			setTitle,
			setSummary,
			setNewDesignItem,
			addDesignItem,
			removeDesignItem,
			setNewCodeRef,
			addCodeRef,
			removeCodeRef,
			addPath,
			updatePath,
			removePath,
			save,
		},
	};
}
