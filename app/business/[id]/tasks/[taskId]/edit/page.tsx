"use client";

import { use, useEffect, useMemo, useState } from "react";
import { RequirementListSection } from "@/components/forms/requirement-list-section";
import { SelectionDialog } from "@/components/forms/SelectionDialog";
import type { TaskKnowledge, SelectionDialogType } from "@/lib/domain";
import { getDefaultTaskKnowledge } from "@/lib/domain";
import { listBusinessRequirementsByTaskId } from "@/lib/data/business-requirements";
import { listSystemRequirementsByTaskId } from "@/lib/data/system-requirements";
import { fromBusinessRequirement, fromSystemRequirement } from "@/lib/data/requirement-mapper";
import { removeFromStorage } from "@/lib/utils/local-storage";

// Hooks
import { useMasterData } from "./hooks/useMasterData";
import { useTaskSave } from "./hooks/useTaskSave";
import { useTaskEditForm } from "./hooks/useTaskEditForm";

// Components
import { TaskEditHeader } from "./components/TaskEditHeader";
import { TaskBasicInfoCard } from "./components/TaskBasicInfoCard";
import { SaveStatusAlert } from "./components/SaveStatusAlert";

export default function TaskDetailEditPage({
	params,
}: {
	params: Promise<{ id: string; taskId: string }>;
}): React.ReactElement {
	const { id, taskId } = use(params);
	const storageKey = `task-knowledge:${id}:${taskId}`;

	const defaultKnowledge = useMemo(
		() => getDefaultTaskKnowledge({ bizId: id, taskId }),
		[id, taskId]
	);

	// データロード状態
	const [isLoading, setIsLoading] = useState(true);

	// マスターデータ取得
	const {
		concepts,
		systemFunctions,
		systemDomains,
		conceptMap,
		systemFunctionMap,
		systemDomainMap,
	} = useMasterData();

	// フォーム状態管理
	const { knowledge, updateField, updateRequirement, removeRequirement, addRequirement, reset } =
		useTaskEditForm({
			defaultKnowledge,
			taskId,
			onReset: () => {
				clearError();
				removeFromStorage(storageKey);
			},
		});

	// 保存処理
	const { handleSave, isSaving, saveError, clearError } = useTaskSave({
		bizId: id,
		taskId,
		storageKey,
	});

	// マウント時にDBから既存データを読み込む
	useEffect(() => {
		async function loadExistingData(): Promise<void> {
			setIsLoading(true);

			try {
				const { data: businessReqs } = await listBusinessRequirementsByTaskId(taskId);
				const { data: systemReqs } = await listSystemRequirementsByTaskId(taskId);

				const loadedBusinessRequirements =
					businessReqs?.map((br) => fromBusinessRequirement(br)) ?? [];
				const loadedSystemRequirements =
					systemReqs?.map((sr) => fromSystemRequirement(sr)) ?? [];

				if (loadedBusinessRequirements.length > 0 || loadedSystemRequirements.length > 0) {
					updateField("businessRequirements", loadedBusinessRequirements);
					updateField("systemRequirements", loadedSystemRequirements);
				}
			} catch (e) {
				console.error("データ読み込みエラー:", e);
			} finally {
				setIsLoading(false);
			}
		}

		loadExistingData();
	}, [taskId]);

	// ダイアログ状態管理
	const [dialogState, setDialogState] = useState<{
		type: SelectionDialogType;
		reqId: string;
	} | null>(null);

	// アクティブな要件
	const activeRequirement = useMemo(
		() =>
			dialogState
				? [...knowledge.businessRequirements, ...knowledge.systemRequirements].find(
						(r) => r.id === dialogState.reqId
				  ) ?? null
				: null,
		[dialogState, knowledge.businessRequirements, knowledge.systemRequirements]
	);

	// ダイアログハンドラー
	function handleOpenDialog(type: SelectionDialogType, reqId: string): void {
		setDialogState({ type, reqId });
	}

	function handleCloseDialog(): void {
		setDialogState(null);
	}

	return (
		<div className="flex-1 min-h-screen bg-white">
			<div className="mx-auto max-w-[1400px] px-8 py-6">
				{/* ヘッダー */}
				<TaskEditHeader
					bizId={id}
					taskId={taskId}
					isLoading={isLoading}
					isSaving={isSaving}
					onReset={reset}
					onSave={() => handleSave(knowledge)}
				/>

				<h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-2">
					業務タスク編集
				</h1>

				{/* ローディング・エラー表示 */}
				<SaveStatusAlert isLoading={isLoading} saveError={saveError} />

				{/* 基本情報カード */}
				<TaskBasicInfoCard knowledge={knowledge} onFieldChange={updateField} />

				{/* 業務要件セクション */}
				<RequirementListSection
					title="業務要件"
					requirements={knowledge.businessRequirements}
					onAdd={() => addRequirement("業務要件")}
					onUpdate={(reqId, patch) => updateRequirement("businessRequirements", reqId, patch)}
					onRemove={(reqId) => removeRequirement("businessRequirements", reqId)}
					conceptMap={conceptMap}
					systemFunctionMap={systemFunctionMap}
					systemDomainMap={systemDomainMap}
					onOpenDialog={handleOpenDialog}
				/>

				{/* システム要件セクション */}
				<RequirementListSection
					title="システム要件"
					requirements={knowledge.systemRequirements}
					onAdd={() => addRequirement("システム要件")}
					onUpdate={(reqId, patch) =>
						updateRequirement("systemRequirements", reqId, patch)
					}
					onRemove={(reqId) => removeRequirement("systemRequirements", reqId)}
					conceptMap={conceptMap}
					systemFunctionMap={systemFunctionMap}
					systemDomainMap={systemDomainMap}
					onOpenDialog={handleOpenDialog}
				/>
			</div>

			{/* 選択ダイアログ */}
			<SelectionDialog
				dialogState={dialogState}
				onClose={handleCloseDialog}
				activeRequirement={activeRequirement}
				concepts={concepts}
				systemFunctions={systemFunctions}
				systemDomains={systemDomains}
				onUpdateRequirement={(reqId, patch) => {
					const listKey = knowledge.businessRequirements.find((r) => r.id === reqId)
						? "businessRequirements"
						: "systemRequirements";
					updateRequirement(listKey, reqId, patch);
				}}
			/>
		</div>
	);
}
