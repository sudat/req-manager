"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getTaskById } from "@/lib/data/tasks";
import { listBusinessRequirementsByTaskId } from "@/lib/data/business-requirements";
import { syncBusinessRequirements } from "@/lib/data/task-sync";
import { useProject } from "@/components/project/project-context";
import type { TaskKnowledge, Requirement } from "@/lib/domain";
import { fromBusinessRequirement } from "@/lib/data/requirement-mapper";
import { nextSequentialId } from "@/lib/utils/requirement-id";
import { getBrIdSpecForTask } from "@/lib/utils/id-rules";
import { removeFromStorage, saveToStorage } from "@/lib/utils/local-storage";
import { markChangedFieldsSuspect } from "@/lib/data/suspect-detection";

type UseBusinessRequirementsFormParams = {
	taskId: string;
	bizId: string;
	storageKey: string;
};

type UseBusinessRequirementsFormResult = {
	loading: boolean;
	saving: boolean;
	error: string | null;
	existingTask: TaskKnowledge | null;
	businessRequirements: Requirement[];
	addRequirement: () => void;
	updateRequirement: (reqId: string, patch: Partial<Requirement>) => void;
	removeRequirement: (reqId: string) => void;
	handleSave: (onSuccess?: () => void) => Promise<void>;
};

export function useBusinessRequirementsForm({
	taskId,
	bizId,
	storageKey,
}: UseBusinessRequirementsFormParams): UseBusinessRequirementsFormResult {
	const router = useRouter();
	const { currentProjectId, loading: projectLoading } = useProject();

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [existingTask, setExistingTask] = useState<TaskKnowledge | null>(null);
	const [businessRequirements, setBusinessRequirements] = useState<Requirement[]>([]);

	// データ読み込み
	useEffect(() => {
		let active = true;

		async function loadData(): Promise<void> {
			setLoading(true);
			if (projectLoading || !currentProjectId) {
				setLoading(false);
				return;
			}

			try {
				const [taskResult, brResult] = await Promise.all([
					getTaskById(taskId, currentProjectId),
					listBusinessRequirementsByTaskId(taskId, currentProjectId),
				]);

				if (!active) return;

				if (taskResult.error) {
					setError(taskResult.error);
					setLoading(false);
					return;
				}

				const task = taskResult.data;
				if (!task) {
					setError("タスクが見つかりません");
					setLoading(false);
					return;
				}

				const loadedBr = brResult.data?.map((br) => fromBusinessRequirement(br)) ?? [];

				const loadedKnowledge: TaskKnowledge = {
					bizId,
					taskId,
					taskName: task.name ?? "",
					taskSummary: task.summary ?? "",
					triggerDescription: task.triggerDescription ?? "",
					triggerTaskIds: task.triggerTaskIds ?? [],
					frequency: task.frequency ?? "daily",
					frequencyDescription: task.frequencyDescription ?? "",
					processSteps: task.processSteps ?? "",
					input: task.input ?? "",
					output: task.output ?? "",
					conceptIdsYaml: task.conceptIdsYaml ?? "",
					person: task.person ?? "",
					businessRequirements: loadedBr,
					systemRequirements: [],
					designDocs: [],
					codeRefs: [],
				};

				setExistingTask(loadedKnowledge);
				setBusinessRequirements(loadedBr);
			} catch (e) {
				if (active) {
					setError(e instanceof Error ? e.message : String(e));
				}
			} finally {
				if (active) {
					setLoading(false);
				}
			}
		}

		loadData();

		return () => {
			active = false;
		};
	}, [taskId, bizId, currentProjectId, projectLoading]);

	const addRequirement = useCallback((): void => {
		const existingIds = businessRequirements.map((r) => r.id);
		const spec = getBrIdSpecForTask(taskId, existingIds);
		const prefix = spec.prefix.endsWith("-") ? spec.prefix.slice(0, -1) : spec.prefix;
		const newId = nextSequentialId(prefix, existingIds, spec.padLength);

		const newReq: Requirement = {
			id: newId,
			type: "業務要件",
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
			businessRequirementIds: [],
			relatedSystemRequirementIds: [],
		};

		setBusinessRequirements((prev) => [...prev, newReq]);
	}, [taskId, businessRequirements]);

	const updateRequirement = useCallback((reqId: string, patch: Partial<Requirement>): void => {
		setBusinessRequirements((prev) =>
			prev.map((r) => (r.id === reqId ? { ...r, ...patch } : r))
		);
	}, []);

	const removeRequirement = useCallback((reqId: string): void => {
		setBusinessRequirements((prev) => prev.filter((r) => r.id !== reqId));
	}, []);

	const handleSave = useCallback(
		async (onSuccess?: () => void): Promise<void> => {
			setSaving(true);
			setError(null);

			try {
				if (projectLoading || !currentProjectId) {
					setError("プロジェクトが選択されていません");
					return;
				}

				// LocalStorageにバックアップ
				const backupData = { businessRequirements };
				saveToStorage(storageKey, backupData);

				// 業務要件を同期
				const result = await syncBusinessRequirements(
					taskId,
					businessRequirements,
					currentProjectId
				);

				if (typeof result === "string") {
					setError(result);
					return;
				}

				const changedBrMap = result;

				// 変更されたBRに対して疑義フラグを設定
				for (const [brId, changedFields] of changedBrMap) {
					await markChangedFieldsSuspect(brId, "br", changedFields, currentProjectId);
				}

				// 成功時はLocalStorageをクリア
				removeFromStorage(storageKey);

				onSuccess?.();
				router.push(`/business/${bizId}/${taskId}`);
			} catch (e) {
				setError(e instanceof Error ? e.message : String(e));
			} finally {
				setSaving(false);
			}
		},
		[taskId, bizId, storageKey, businessRequirements, router, currentProjectId, projectLoading]
	);

	return {
		loading,
		saving,
		error,
		existingTask,
		businessRequirements,
		addRequirement,
		updateRequirement,
		removeRequirement,
		handleSave,
	};
}
