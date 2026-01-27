import { useCallback } from "react";
import type { SystemDesignItem } from "@/lib/domain";
import type { Requirement } from "@/lib/domain/forms";
import type { NewDesignItem, CodeRef } from "./types";

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

type UseSystemFunctionFormActionsInput = {
	srfId: string;
	newDesignItem: NewDesignItem;
	setSystemDesign: (fn: (prev: SystemDesignItem[]) => SystemDesignItem[]) => void;
	setNewDesignItem: (item: NewDesignItem) => void;
	newCodeRef: CodeRef;
	setCodeRefs: (fn: (prev: CodeRef[]) => CodeRef[]) => void;
	setNewCodeRef: (fn: (prev: CodeRef) => CodeRef) => void;
	systemRequirements: Requirement[];
	setSystemRequirements: (fn: (prev: Requirement[]) => Requirement[]) => void;
};

/**
 * システム機能フォームのアクション管理フック
 */
export function useSystemFunctionFormActions(input: UseSystemFunctionFormActionsInput) {
	const {
		srfId,
		newDesignItem,
		setSystemDesign,
		setNewDesignItem,
		newCodeRef,
		setCodeRefs,
		setNewCodeRef,
		systemRequirements,
		setSystemRequirements,
	} = input;

	// 設計項目を追加
	const addDesignItem = useCallback((): void => {
		if (!newDesignItem.title || !newDesignItem.description) return;

		const newItem: SystemDesignItem = {
			id: `SD-${srfId}-${Date.now()}`,
			...newDesignItem,
		};

		setSystemDesign((prev) => [...prev, newItem]);
		setNewDesignItem(INITIAL_DESIGN_ITEM);
	}, [newDesignItem, srfId, setSystemDesign, setNewDesignItem]);

	// 設計項目を削除
	const removeDesignItem = useCallback(
		(itemId: string): void => {
			setSystemDesign((prev) => prev.filter((item) => item.id !== itemId));
		},
		[setSystemDesign]
	);

	// コード参照を追加
	const addCodeRef = useCallback((): void => {
		if (!newCodeRef.githubUrl) return;

		const validPaths = newCodeRef.paths.filter((p) => p.trim() !== "");
		if (validPaths.length === 0) return;

		setCodeRefs((prev) => [...prev, { ...newCodeRef, paths: validPaths }]);
		setNewCodeRef(() => INITIAL_CODE_REF);
	}, [newCodeRef, setCodeRefs, setNewCodeRef]);

	// コード参照を削除
	const removeCodeRef = useCallback(
		(index: number): void => {
			setCodeRefs((prev) => prev.filter((_, i) => i !== index));
		},
		[setCodeRefs]
	);

	// パスを追加
	const addPath = useCallback((): void => {
		setNewCodeRef((prev) => ({ ...prev, paths: [...prev.paths, ""] }));
	}, [setNewCodeRef]);

	// パスを更新
	const updatePath = useCallback(
		(index: number, value: string): void => {
			setNewCodeRef((prev) => {
				const newPaths = [...prev.paths];
				newPaths[index] = value;
				return { ...prev, paths: newPaths };
			});
		},
		[setNewCodeRef]
	);

	// パスを削除
	const removePath = useCallback(
		(index: number): void => {
			setNewCodeRef((prev) => ({
				...prev,
				paths: prev.paths.filter((_, i) => i !== index),
			}));
		},
		[setNewCodeRef]
	);

	// システム要件を追加
	const addSystemRequirement = useCallback((): void => {
		const newId = `SR-${srfId}-${String(systemRequirements.length + 1).padStart(3, "0")}`;
		const existingTaskId = systemRequirements[0]?.taskId ?? "";

		setSystemRequirements((prev) => [
			...prev,
			{
				id: newId,
				type: "システム要件",
				title: "",
				summary: "",
				goal: "",
				constraints: "",
				owner: "",
				conceptIds: [],
				srfId: srfId,
				systemDomainIds: [],
				acceptanceCriteria: [],
				acceptanceCriteriaJson: [],
				category: "function",
				businessRequirementIds: [],
				relatedSystemRequirementIds: [],
				relatedDeliverableIds: [],
				taskId: existingTaskId,
			},
		]);
	}, [srfId, systemRequirements, setSystemRequirements]);

	// システム要件を更新
	const updateSystemRequirement = useCallback(
		(reqId: string, patch: Partial<Requirement>): void => {
			setSystemRequirements((prev) =>
				prev.map((req) => (req.id === reqId ? { ...req, ...patch } : req))
			);
		},
		[setSystemRequirements]
	);

	// システム要件を削除
	const removeSystemRequirement = useCallback(
		(reqId: string): void => {
			setSystemRequirements((prev) => prev.filter((req) => req.id !== reqId));
		},
		[setSystemRequirements]
	);

	return {
		addDesignItem,
		removeDesignItem,
		addCodeRef,
		removeCodeRef,
		addPath,
		updatePath,
		removePath,
		addSystemRequirement,
		updateSystemRequirement,
		removeSystemRequirement,
	};
}
