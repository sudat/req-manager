"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RequirementListSection } from "@/components/forms/requirement-list-section";
import { SelectionDialog } from "@/components/forms/SelectionDialog";
import { useSystemRequirementsForm } from "../hooks/useSystemRequirementsForm";
import { useMasterData } from "@/app/(with-sidebar)/business/[id]/[taskId]/edit/hooks/useMasterData";
import { DEFAULT_PROJECT_ID, useProject } from "@/components/project/project-context";
import type { SelectionDialogState } from "@/lib/domain/forms";

export default function SystemFunctionEditRequirementsPage({
	params,
}: {
	params: Promise<{ id: string; srfId: string }>;
}) {
	const { id: systemDomainId, srfId } = use(params);
	const router = useRouter();
	const { currentProjectId, loading: projectLoading } = useProject();
	const projectId = currentProjectId ?? DEFAULT_PROJECT_ID;

	const {
		loading,
		saving,
		error,
		existingSrf,
		systemRequirements,
		addSystemRequirement,
		updateSystemRequirement,
		removeSystemRequirement,
		handleSave,
	} = useSystemRequirementsForm(srfId, systemDomainId, projectId);

	const {
		concepts,
		systemFunctions,
		systemDomains,
		conceptMap,
		systemFunctionMap,
	} = useMasterData();

	const businessRequirementMap = useMemo(() => new Map<string, string>(), []);

	const [dialogState, setDialogState] = useState<SelectionDialogState>(null);

	const openDialog = (type: NonNullable<SelectionDialogState>["type"], reqId: string) => {
		setDialogState({ type, reqId });
	};

	const closeDialog = () => {
		setDialogState(null);
	};

	const activeRequirement = dialogState
		? systemRequirements.find((r) => r.id === dialogState.reqId) || null
		: null;

	if (projectLoading || loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Loader2 className="h-8 w-8 animate-spin text-slate-400" />
			</div>
		);
	}

	if (error || !existingSrf) {
		return (
			<div className="p-8">
				<div className="text-center text-rose-600">
					エラー: {error || "システム機能が見つかりません"}
				</div>
			</div>
		);
	}

	return (
		<div className="p-8">
			<Link
				href={`/system/${systemDomainId}/${srfId}`}
				className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
			>
				<ArrowLeft className="h-4 w-4" />
				システム機能詳細に戻る
			</Link>

			<div className="mb-6 flex items-center gap-2">
				<h1 className="text-2xl font-bold text-slate-900">
					編集: {existingSrf.title} - システム要件
				</h1>
				<Badge
					variant="outline"
					className="font-mono text-xs font-semibold border-emerald-300 bg-emerald-100 text-emerald-800 px-2 py-0.5"
				>
					{systemRequirements.length}
				</Badge>
			</div>

			<div className="max-w-[1400px]">
				<RequirementListSection
					title="システム要件"
					requirements={systemRequirements}
					onAdd={addSystemRequirement}
					onUpdate={updateSystemRequirement}
					onRemove={removeSystemRequirement}
					conceptMap={conceptMap}
					systemFunctionMap={systemFunctionMap}
					businessRequirementMap={businessRequirementMap}
					onOpenDialog={openDialog}
					withoutCard
					showTitle={false}
					showCountBadge={false}
				/>

				<div className="mt-6 flex items-center gap-3">
					<Button onClick={() => handleSave(() => toast.success("システム要件を保存しました"))} disabled={saving}>
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
						onClick={() => router.push(`/system/${systemDomainId}/${srfId}`)}
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
				businessRequirements={[]}
				systemRequirements={[]}
				onUpdateRequirement={updateSystemRequirement}
			/>
		</div>
	);
}
