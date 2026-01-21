"use client";

import { use, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MobileHeader } from "@/components/layout/mobile-header";
import { useSystemRequirements } from "./hooks/useSystemRequirements";
import { useSystemFunctionCreate } from "./hooks/useSystemFunctionCreate";
import { SystemRequirementsSection } from "./components/SystemRequirementsSection";
import { BusinessRequirementDialog } from "./components/BusinessRequirementDialog";
import { SystemFunctionBasicInfoForm } from "./components/SystemFunctionBasicInfoForm";
import type { BusinessRequirementDialogState } from "./types";

export default function SystemFunctionCreatePage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);

	// システム要件管理
	const {
		systemRequirements,
		addSystemRequirement,
		updateSystemRequirement,
		removeSystemRequirement,
	} = useSystemRequirements();

	// フォーム状態・保存処理
	const {
		nextId,
		title,
		summary,
		category,
		status,
		businessRequirements,
		loading,
		saving,
		error,
		setTitle,
		setSummary,
		setCategory,
		setStatus,
		handleSubmit,
	} = useSystemFunctionCreate(id);

	// ダイアログ状態
	const [dialogState, setDialogState] = useState<BusinessRequirementDialogState>(null);

	// アクティブなシステム要件
	const activeSystemRequirement = useMemo(
		() =>
			dialogState
				? systemRequirements.find((sr) => sr.id === dialogState.sysReqId) ?? null
				: null,
		[dialogState, systemRequirements]
	);

	// 送信可否判定
	const canSubmit = useMemo(
		() => title.trim().length > 0 && systemRequirements.length > 0,
		[title, systemRequirements.length]
	);

	// handleSubmitのラッパー
	const handleFormSubmit = (event: FormEvent) => {
		handleSubmit(event, systemRequirements);
	};

	return (
		<>
			<div className="flex-1 min-h-screen bg-slate-50">
				<MobileHeader />
				<div className="mx-auto max-w-[1200px] p-8">
					<Link
						href={`/system-domains/${id}`}
						className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-4"
					>
						<ArrowLeft className="h-4 w-4" />
						システム機能一覧に戻る
					</Link>

					<h1 className="text-2xl font-semibold text-slate-900 mb-6">システム機能を新規作成</h1>

					<Card className="p-6">
						<form className="space-y-6" onSubmit={handleFormSubmit}>
							<SystemFunctionBasicInfoForm
								nextId={nextId}
								title={title}
								summary={summary}
								category={category}
								status={status}
								onTitleChange={setTitle}
								onSummaryChange={setSummary}
								onCategoryChange={setCategory}
								onStatusChange={setStatus}
							/>

							<SystemRequirementsSection
								systemRequirements={systemRequirements}
								businessRequirements={businessRequirements}
								loading={loading}
								onAddSystemRequirement={() => addSystemRequirement(id)}
								onUpdateSystemRequirement={updateSystemRequirement}
								onRemoveSystemRequirement={removeSystemRequirement}
								onOpenBusinessRequirementDialog={(sysReqId) =>
									setDialogState({ sysReqId })
								}
							/>

							{error && <p className="text-sm text-rose-600">{error}</p>}

							<div className="flex gap-3">
								<Link href={`/system-domains/${id}`}>
									<Button type="button" variant="outline">
										キャンセル
									</Button>
								</Link>
								<Button
									type="submit"
									className="bg-slate-900 hover:bg-slate-800"
									disabled={!canSubmit || saving}
								>
									{saving ? "保存中..." : "保存"}
								</Button>
							</div>
						</form>
					</Card>
				</div>
			</div>

			<BusinessRequirementDialog
				open={!!dialogState}
				onClose={() => setDialogState(null)}
				activeSystemRequirement={activeSystemRequirement}
				businessRequirements={businessRequirements}
				onUpdateSystemRequirement={updateSystemRequirement}
			/>
		</>
	);
}
