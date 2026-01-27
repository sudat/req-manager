"use client";

import { use, useEffect, useMemo, useState } from "react";
import { RequirementListSection } from "@/components/forms/requirement-list-section";
import { SelectionDialog } from "@/components/forms/SelectionDialog";
import type { TaskKnowledge, SelectionDialogType, SelectableItem } from "@/lib/domain";
import { listBusinessRequirementsByTaskId } from "@/lib/data/business-requirements";
import { listSystemRequirementsByTaskId } from "@/lib/data/system-requirements";
import { fromBusinessRequirement, fromSystemRequirement } from "@/lib/data/requirement-mapper";
import { getTaskById } from "@/lib/data/tasks";
import { removeFromStorage } from "@/lib/utils/local-storage";
import { createEmptyTaskKnowledge } from "@/lib/utils/task-knowledge";
import { useProject } from "@/components/project/project-context";

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

	const [defaultKnowledge, setDefaultKnowledge] = useState<TaskKnowledge>(() =>
		createEmptyTaskKnowledge(id, taskId)
	);
	const { currentProjectId, loading: projectLoading } = useProject();

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
	const {
		knowledge,
		setKnowledge,
		updateField,
		updateRequirement,
		removeRequirement,
		addRequirement,
		reset,
	} = useTaskEditForm({
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

	const canSave = useMemo(() => {
		const requiredOk =
			knowledge.taskName.trim().length > 0 &&
			knowledge.taskSummary.trim().length > 0 &&
			knowledge.businessContext.trim().length > 0;
		return requiredOk;
	}, [
		knowledge.taskName,
		knowledge.taskSummary,
		knowledge.businessContext,
	]);

	// マウント時にDBから既存データを読み込む
	useEffect(() => {
		let active = true;

		async function loadExistingData(): Promise<void> {
			setIsLoading(true);
			if (projectLoading || !currentProjectId) {
				setIsLoading(false);
				return;
			}

			try {
				const [taskResult, businessReqResult, systemReqResult] = await Promise.all([
					getTaskById(taskId, currentProjectId),
					listBusinessRequirementsByTaskId(taskId, currentProjectId),
					listSystemRequirementsByTaskId(taskId, currentProjectId),
				]);

				if (!active) return;

				const task = taskResult.data;
				if (taskResult.error) {
					console.error("タスク読み込みエラー:", taskResult.error);
				}
				if (businessReqResult.error) {
					console.error("業務要件読み込みエラー:", businessReqResult.error);
				}
				if (systemReqResult.error) {
					console.error("システム要件読み込みエラー:", systemReqResult.error);
				}

				const loadedBusinessRequirements =
					businessReqResult.data?.map((br) => fromBusinessRequirement(br)) ?? [];
				const loadedSystemRequirements =
					systemReqResult.data?.map((sr) => fromSystemRequirement(sr)) ?? [];

				const loadedKnowledge: TaskKnowledge = {
					bizId: task?.businessId ?? id,
					taskId,
					taskName: task?.name ?? "",
					taskSummary: task?.summary ?? "",
					businessContext: task?.businessContext ?? "",
					processSteps: task?.processSteps ?? "",
					input: task?.input ?? "",
					output: task?.output ?? "",
					conceptIdsYaml: task?.conceptIdsYaml ?? "",
					person: task?.person ?? "",
					businessRequirements: loadedBusinessRequirements,
					systemRequirements: loadedSystemRequirements,
					designDocs: [],
					codeRefs: [],
				};

				setDefaultKnowledge(loadedKnowledge);
				setKnowledge(loadedKnowledge);
			} catch (e) {
				console.error("データ読み込みエラー:", e);
			} finally {
				if (active) {
					setIsLoading(false);
				}
			}
		}

		loadExistingData();

		return () => {
			active = false;
		};
	}, [id, taskId, setKnowledge, setDefaultKnowledge, currentProjectId, projectLoading]);

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

	const businessRequirementMap = useMemo(
		() =>
			new Map(
				knowledge.businessRequirements.map((req) => [
					req.id,
					req.title || req.id,
				])
			),
		[knowledge.businessRequirements]
	);

	const systemRequirementMap = useMemo(
		() =>
			new Map(
				knowledge.systemRequirements.map((req) => [
					req.id,
					req.title || req.id,
				])
			),
		[knowledge.systemRequirements]
	);

	const businessRequirementItems: SelectableItem[] = useMemo(
		() =>
			knowledge.businessRequirements.map((req) => ({
				id: req.id,
				name: req.title || req.id,
			})),
		[knowledge.businessRequirements]
	);

	const systemRequirementItems: SelectableItem[] = useMemo(
		() =>
			knowledge.systemRequirements.map((req) => ({
				id: req.id,
				name: req.title || req.id,
			})),
		[knowledge.systemRequirements]
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
					canSave={canSave}
					onReset={reset}
					onSave={() => handleSave(knowledge)}
				/>

				<h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-2">
					業務タスク編集
				</h1>

				{/* ローディング・エラー表示 */}
				<SaveStatusAlert isLoading={isLoading} saveError={saveError} />

				{/* 基本情報カード */}
				<TaskBasicInfoCard
					knowledge={knowledge}
					onFieldChange={updateField}
					concepts={concepts}
				/>

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
					businessRequirementMap={businessRequirementMap}
					systemRequirementMap={systemRequirementMap}
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
					businessRequirementMap={businessRequirementMap}
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
				businessRequirements={businessRequirementItems}
				systemRequirements={systemRequirementItems}
				deliverables={[]}
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
