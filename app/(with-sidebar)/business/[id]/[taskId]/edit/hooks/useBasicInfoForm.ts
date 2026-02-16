"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getTaskById } from "@/lib/data/tasks";
import { syncTaskBasicInfo } from "@/lib/data/task-sync";
import { useProject } from "@/components/project/project-context";
import type { TaskKnowledge } from "@/lib/domain";
import { createEmptyTaskKnowledge } from "@/lib/utils/task-knowledge";
import { removeFromStorage, saveToStorage } from "@/lib/utils/local-storage";

type UseBasicInfoFormParams = {
	taskId: string;
	bizId: string;
	storageKey: string;
};

type UseBasicInfoFormResult = {
	loading: boolean;
	saving: boolean;
	error: string | null;
	existingTask: TaskKnowledge | null;
	// フォーム状態
	taskName: string;
	setTaskName: (value: string) => void;
	taskSummary: string;
	setTaskSummary: (value: string) => void;
	triggerDescription: string;
	setTriggerDescription: (value: string) => void;
	triggerTaskIds: string[];
	setTriggerTaskIds: (value: string[]) => void;
	frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'irregular';
	setFrequency: (value: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'irregular') => void;
	frequencyDescription: string;
	setFrequencyDescription: (value: string) => void;
	processSteps: string;
	setProcessSteps: (value: string) => void;
	input: string;
	setInput: (value: string) => void;
	output: string;
	setOutput: (value: string) => void;
	conceptIdsYaml: string;
	setConceptIdsYaml: (value: string) => void;
	handleSave: (onSuccess?: () => void) => Promise<void>;
};

export function useBasicInfoForm({
	taskId,
	bizId,
	storageKey,
}: UseBasicInfoFormParams): UseBasicInfoFormResult {
	const router = useRouter();
	const { currentProjectId, loading: projectLoading } = useProject();

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [existingTask, setExistingTask] = useState<TaskKnowledge | null>(null);

	// フォーム状態
	const [taskName, setTaskName] = useState("");
	const [taskSummary, setTaskSummary] = useState("");
	const [triggerDescription, setTriggerDescription] = useState("");
	const [triggerTaskIds, setTriggerTaskIds] = useState<string[]>([]);
	const [frequency, setFrequency] = useState<TaskKnowledge['frequency']>('daily');
	const [frequencyDescription, setFrequencyDescription] = useState("");
	const [processSteps, setProcessSteps] = useState("");
	const [input, setInput] = useState("");
	const [output, setOutput] = useState("");
	const [conceptIdsYaml, setConceptIdsYaml] = useState("");

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
				const result = await getTaskById(taskId, currentProjectId);

				if (!active) return;

				if (result.error) {
					setError(result.error);
					setLoading(false);
					return;
				}

				const task = result.data;
				if (!task) {
					setError("タスクが見つかりません");
					setLoading(false);
					return;
				}

				const loadedKnowledge: TaskKnowledge = {
					bizId,
					taskId,
				taskName: task.name ?? "",
				taskSummary: task.summary ?? "",
				triggerDescription: task.triggerDescription ?? "",
					triggerTaskIds: task.triggerTaskIds ?? [],
					frequency: task.frequency ?? 'daily',
					frequencyDescription: task.frequencyDescription ?? "",
					processSteps: task.processSteps ?? "",
					input: task.input ?? "",
					output: task.output ?? "",
					conceptIdsYaml: task.conceptIdsYaml ?? "",
					person: task.person ?? "",
					businessRequirements: [],
					systemRequirements: [],
					designDocs: [],
					codeRefs: [],
				};

				setExistingTask(loadedKnowledge);
				setTaskName(loadedKnowledge.taskName);
				setTaskSummary(loadedKnowledge.taskSummary);
				setTriggerDescription(loadedKnowledge.triggerDescription);
				setTriggerTaskIds(loadedKnowledge.triggerTaskIds);
				setFrequency(loadedKnowledge.frequency);
				setFrequencyDescription(loadedKnowledge.frequencyDescription);
				setProcessSteps(loadedKnowledge.processSteps);
				setInput(loadedKnowledge.input);
				setOutput(loadedKnowledge.output);
				setConceptIdsYaml(loadedKnowledge.conceptIdsYaml);
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
				const backupData: Partial<TaskKnowledge> = {
					taskName,
					taskSummary,
					triggerDescription,
					triggerTaskIds,
					frequency,
					frequencyDescription,
					processSteps,
					input,
					output,
					conceptIdsYaml,
				};
				saveToStorage(storageKey, backupData);

				// タスク基本情報を同期
				const taskError = await syncTaskBasicInfo(
					taskId,
					taskName,
					taskSummary,
					triggerDescription,
					triggerTaskIds,
					frequency,
					frequencyDescription,
					processSteps,
					"", // person
					input,
					output,
					conceptIdsYaml,
					currentProjectId
				);

				if (taskError) {
					setError(taskError);
					return;
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
		[
			taskId,
			bizId,
			storageKey,
			taskName,
				taskSummary,
				triggerDescription,
			triggerTaskIds,
			frequency,
			frequencyDescription,
			processSteps,
			input,
			output,
			conceptIdsYaml,
			router,
			currentProjectId,
			projectLoading,
		]
	);

	return {
		loading,
		saving,
		error,
		existingTask,
		taskName,
		setTaskName,
		taskSummary,
			setTaskSummary,
			triggerDescription,
		setTriggerDescription,
		triggerTaskIds,
		setTriggerTaskIds,
		frequency,
		setFrequency,
		frequencyDescription,
		setFrequencyDescription,
		processSteps,
		setProcessSteps,
		input,
		setInput,
		output,
		setOutput,
		conceptIdsYaml,
		setConceptIdsYaml,
		handleSave,
	};
}
