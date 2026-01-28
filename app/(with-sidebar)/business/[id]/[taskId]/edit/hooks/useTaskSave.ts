"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { TaskKnowledge } from "@/lib/domain";
import {
	syncTaskBasicInfo,
	syncBusinessRequirements,
	syncBrSrLinksToRequirementLinks,
} from "@/lib/data/task-sync";
import { saveToStorage, removeFromStorage } from "@/lib/utils/local-storage";
import { useProject } from "@/components/project/project-context";

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

// 業務タスク編集画面からはシステム要件を編集しないため、
// レガシーなリンク同期関数は削除済み

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
	const { currentProjectId, loading: projectLoading } = useProject();

	const handleSave = useCallback(
		async (knowledge: TaskKnowledge): Promise<void> => {
			setIsSaving(true);
			setSaveError(null);

			try {
				if (projectLoading || !currentProjectId) {
					setSaveError("プロジェクトが選択されていません");
					return;
				}
				// LocalStorageにバックアップ
				saveToStorage(storageKey, knowledge);

				// タスク基本情報を同期
				const taskError = await syncTaskBasicInfo(
					taskId,
					knowledge.taskName,
					knowledge.taskSummary,
					knowledge.businessContext,
					knowledge.processSteps,
					knowledge.person ?? "",
					knowledge.input ?? "",
					knowledge.output ?? "",
					knowledge.conceptIdsYaml,
					currentProjectId
				);
				if (taskError) {
					setSaveError(taskError);
					return;
				}

				// 業務要件を同期（変更された要件IDとフィールドを取得）
				const bizResult = await syncBusinessRequirements(
					taskId,
					knowledge.businessRequirements,
					currentProjectId
				);
				if (typeof bizResult === "string") {
					setSaveError(bizResult);
					return;
				}
				const changedBrMap = bizResult; // 変更されたBRのIDとフィールドのマップ

				// システム要件は業務タスク編集画面から編集しないため同期スキップ
				// BR↔SRリンク同期も実施しない（システム機能詳細画面で管理）

				// 変更されたBRに対して疑義フラグを設定
				for (const [brId, changedFields] of changedBrMap) {
					const { markChangedFieldsSuspect } = await import("@/lib/data/suspect-detection");
					await markChangedFieldsSuspect(brId, "br", changedFields, currentProjectId);
				}

				// 成功時はLocalStorageをクリア
				removeFromStorage(storageKey);

				router.push(`/business/${bizId}/${taskId}`);
			} catch (e) {
				setSaveError(e instanceof Error ? e.message : String(e));
			} finally {
				setIsSaving(false);
			}
		},
		[bizId, taskId, storageKey, router, currentProjectId, projectLoading]
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
