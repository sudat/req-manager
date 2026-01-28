"use client";

import { useState, useCallback } from "react";
import type { TaskKnowledge, Requirement } from "@/lib/domain";
import { nextSequentialId } from "@/lib/utils/requirement-id";

type UseTaskEditFormResult = {
	knowledge: TaskKnowledge;
	setKnowledge: (knowledge: TaskKnowledge | ((prev: TaskKnowledge) => TaskKnowledge)) => void;
	updateField: <K extends keyof TaskKnowledge>(key: K, value: TaskKnowledge[K]) => void;
	updateRequirement: (
		listKey: "businessRequirements" | "systemRequirements",
		reqId: string,
		patch: Partial<Requirement>
	) => void;
	removeRequirement: (
		listKey: "businessRequirements" | "systemRequirements",
		reqId: string
	) => void;
	addRequirement: (type: Requirement["type"]) => void;
	reset: () => void;
};

type UseTaskEditFormParams = {
	defaultKnowledge: TaskKnowledge;
	taskId: string;
	onReset?: () => void;
};

/**
 * タスク編集フォームの状態管理とCRUD操作を行うカスタムフック
 */
export function useTaskEditForm({
	defaultKnowledge,
	taskId,
	onReset,
}: UseTaskEditFormParams): UseTaskEditFormResult {
	const [knowledge, setKnowledge] = useState<TaskKnowledge>(defaultKnowledge);

	const updateField = useCallback(<K extends keyof TaskKnowledge>(
		key: K,
		value: TaskKnowledge[K]
	): void => {
		setKnowledge((prev) => ({ ...prev, [key]: value }));
	}, []);

	const updateRequirement = useCallback((
		listKey: "businessRequirements" | "systemRequirements",
		reqId: string,
		patch: Partial<Requirement>
	): void => {
		setKnowledge((prev) => ({
			...prev,
			[listKey]: prev[listKey].map((r) => (r.id === reqId ? { ...r, ...patch } : r)),
		}));
	}, []);

	const removeRequirement = useCallback((
		listKey: "businessRequirements" | "systemRequirements",
		reqId: string
	): void => {
		setKnowledge((prev) => ({
			...prev,
			[listKey]: prev[listKey].filter((r) => r.id !== reqId),
		}));
	}, []);

	const addRequirement = useCallback((type: Requirement["type"]): void => {
		setKnowledge((prev) => {
			const listKey = type === "業務要件" ? "businessRequirements" : "systemRequirements";
			const existingIds = [...prev.businessRequirements, ...prev.systemRequirements].map(
				(r) => r.id
			);
			const prefix = type === "業務要件" ? `BR-${taskId}` : `SR-${taskId}`;
			const newId = nextSequentialId(prefix, existingIds);

			const nextReq: Requirement = {
				id: newId,
				type,
				title: "",
				summary: "",
				goal: "",
				constraints: "",
				owner: "",
				conceptIds: [],
				srfIds: [],
				systemDomainIds: [],
				acceptanceCriteria: [],
				acceptanceCriteriaJson: [],
				category: type === "システム要件" ? "function" : undefined,
				businessRequirementIds: [],
				relatedSystemRequirementIds: [],
				relatedDeliverableIds: [],
			};

			return {
				...prev,
				[listKey]: [...prev[listKey], nextReq],
			};
		});
	}, [taskId]);

	const reset = useCallback((): void => {
		setKnowledge(defaultKnowledge);
		onReset?.();
	}, [defaultKnowledge, onReset]);

	return {
		knowledge,
		setKnowledge,
		updateField,
		updateRequirement,
		removeRequirement,
		addRequirement,
		reset,
	};
}
