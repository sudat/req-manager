"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { TaskKnowledge } from "@/lib/domain";
import {
	syncTaskBasicInfo,
	syncBusinessRequirements,
	syncSystemRequirements,
} from "@/lib/data/task-sync";
import { saveToStorage, removeFromStorage } from "@/lib/utils/local-storage";

type UseTaskSaveParams = {
	bizId: string;
	taskId: string;
	storageKey: string;
};

type UseTaskSaveResult = {
	handleSave: (knowledge: TaskKnowledge) => Promise<void>;
	isSaving: boolean;
	saveError: string | null;
	clearError: () => void;
};

/**
 * タスク保存処理を行うカスタムフック
 * - LocalStorageへのバックアップ
 * - タスク基本情報の同期
 * - 業務要件・システム要件の同期
 */
export function useTaskSave({
	bizId,
	taskId,
	storageKey,
}: UseTaskSaveParams): UseTaskSaveResult {
	const router = useRouter();
	const [isSaving, setIsSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	const handleSave = useCallback(
		async (knowledge: TaskKnowledge): Promise<void> => {
			setIsSaving(true);
			setSaveError(null);

			try {
				// LocalStorageにバックアップ
				saveToStorage(storageKey, knowledge);

				// タスク基本情報を同期
				const taskError = await syncTaskBasicInfo(
					taskId,
					knowledge.taskName,
					knowledge.taskSummary,
					knowledge.person ?? "",
					knowledge.input ?? "",
					knowledge.output ?? ""
				);
				if (taskError) {
					setSaveError(taskError);
					return;
				}

				// 業務要件を同期
				const bizError = await syncBusinessRequirements(
					taskId,
					knowledge.businessRequirements
				);
				if (bizError) {
					setSaveError(bizError);
					return;
				}

				// システム要件を同期
				const sysError = await syncSystemRequirements(
					taskId,
					knowledge.systemRequirements
				);
				if (sysError) {
					setSaveError(sysError);
					return;
				}

				// 成功時はLocalStorageをクリア
				removeFromStorage(storageKey);

				router.push(`/business/${bizId}/tasks/${taskId}`);
			} catch (e) {
				setSaveError(e instanceof Error ? e.message : String(e));
			} finally {
				setIsSaving(false);
			}
		},
		[bizId, taskId, storageKey, router]
	);

	const clearError = useCallback(() => {
		setSaveError(null);
	}, []);

	return {
		handleSave,
		isSaving,
		saveError,
		clearError,
	};
}
