"use client";

import { use, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RequirementListSection } from "@/components/forms/requirement-list-section";
import { SelectionDialog } from "@/components/forms/SelectionDialog";
import { useBusinessRequirementsForm } from "../hooks/useBusinessRequirementsForm";
import { useMasterData } from "../hooks/useMasterData";
import type { SelectionDialogState } from "@/lib/domain/forms";

export default function TaskEditRequirementsPage({
	params,
}: {
	params: Promise<{ id: string; taskId: string }>;
}) {
	const { id: businessKey, taskId } = use(params);
	const router = useRouter();
	const storageKey = `task-requirements:${businessKey}:${taskId}`;

	const {
		loading,
		saving,
		error,
		existingTask,
		businessRequirements,
		addRequirement,
		updateRequirement,
		removeRequirement,
		handleSave,
	} = useBusinessRequirementsForm({
		taskId,
		bizId: businessKey,
		storageKey,
	});

	const {
		concepts,
		systemFunctions,
		systemDomains,
		conceptMap,
		systemFunctionMap,
		systemDomainMap,
	} = useMasterData();

	const [dialogState, setDialogState] = useState<SelectionDialogState>(null);

	const openDialog = (type: NonNullable<SelectionDialogState>["type"], reqId: string) => {
		setDialogState({ type, reqId });
	};

	const closeDialog = () => {
		setDialogState(null);
	};

	const activeRequirement = dialogState
		? businessRequirements.find((r) => r.id === dialogState.reqId) || null
		: null;

	const businessRequirementMap = useMemo(
		() =>
			new Map(
				businessRequirements.map((req) => [req.id, req.title || req.id])
			),
		[businessRequirements]
	);

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Loader2 className="h-8 w-8 animate-spin text-slate-400" />
			</div>
		);
	}

	if (error || !existingTask) {
		return (
			<div className="p-8">
				<div className="text-center text-rose-600">
					エラー: {error || "タスクが見つかりません"}
				</div>
			</div>
		);
	}

	return (
		<div className="p-8">
			<Link
				href={`/business/${businessKey}/${taskId}`}
				className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
			>
				<ArrowLeft className="h-4 w-4" />
				業務タスク詳細に戻る
			</Link>

			<div className="mb-6">
			<h1 className="text-2xl font-bold text-slate-900">
				編集: {existingTask.taskName} - 業務要件名
			</h1>
			</div>

			<div className="max-w-[1400px]">
				<RequirementListSection
					title="業務要件"
					requirements={businessRequirements}
					onAdd={addRequirement}
					onUpdate={updateRequirement}
					onRemove={removeRequirement}
					conceptMap={conceptMap}
					systemFunctionMap={systemFunctionMap}
					systemDomainMap={systemDomainMap}
					businessRequirementMap={businessRequirementMap}
					onOpenDialog={openDialog}
				/>

				<div className="mt-6 flex items-center gap-3">
					<Button
						onClick={() => handleSave(() => toast.success("業務要件を保存しました"))}
						disabled={saving}
					>
						{saving ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin mr-2" />
								保存中...
							</>
						) : (
							"保存"
						)}
					</Button>
					<Button
						variant="outline"
						onClick={() => router.push(`/business/${businessKey}/${taskId}`)}
						disabled={saving}
					>
						キャンセル
					</Button>
				</div>

				{error && (
					<div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-md text-rose-700">
						{error}
					</div>
				)}
			</div>

			<SelectionDialog
				dialogState={dialogState}
				onClose={closeDialog}
				activeRequirement={activeRequirement}
				concepts={concepts}
				systemFunctions={systemFunctions}
				systemDomains={systemDomains}
				businessRequirements={businessRequirements.map((req) => ({
					id: req.id,
					name: req.title || req.id,
				}))}
				systemRequirements={[]}
				onUpdateRequirement={updateRequirement}
			/>
		</div>
	);
}
