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

const syncLegacyBusinessRequirementLinks = (
	businessRequirements: TaskKnowledge["businessRequirements"],
	systemRequirements: TaskKnowledge["systemRequirements"]
): TaskKnowledge["businessRequirements"] => {
	const links = new Map<string, Set<string>>(
		businessRequirements.map((br) => [
			br.id,
			new Set(br.relatedSystemRequirementIds ?? []),
		])
	);

	for (const sysReq of systemRequirements) {
		if (sysReq.businessRequirementIds.length === 0) continue;

		for (const set of links.values()) {
			set.delete(sysReq.id);
		}

		for (const bizId of sysReq.businessRequirementIds) {
			if (!links.has(bizId)) {
				links.set(bizId, new Set());
			}
			links.get(bizId)?.add(sysReq.id);
		}
	}

	return businessRequirements.map((br) => ({
		...br,
		relatedSystemRequirementIds: Array.from(links.get(br.id) ?? []),
	}));
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

				const syncedBusinessRequirements = syncLegacyBusinessRequirementLinks(
					knowledge.businessRequirements,
					knowledge.systemRequirements
				);

				// 業務要件を同期
				const bizError = await syncBusinessRequirements(
					taskId,
					syncedBusinessRequirements
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
