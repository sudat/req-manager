"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useChangeRequestEdit } from "@/hooks/use-change-request-edit";
import { ChangeRequestEditForm } from "@/components/tickets/change-request-edit-form";

/**
 * 変更要求編集ページ
 */
export default function TicketEditPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	const editState = useChangeRequestEdit(id);

	// ローディング状態
	if (editState.loading) {
		return (
			<div className="flex-1 min-h-screen bg-white">
				<div className="mx-auto max-w-[1400px] px-8 py-4">
					<p className="text-slate-600">読み込み中...</p>
				</div>
			</div>
		);
	}

	// エラー状態（データが取得できなかった場合）
	if (editState.error && !editState.changeRequest) {
		return (
			<div className="flex-1 min-h-screen bg-white">
				<div className="mx-auto max-w-[1400px] px-8 py-4">
					<p className="text-rose-600">{editState.error}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex-1 min-h-screen bg-slate-50">
			<div className="mx-auto max-w-[1400px] p-8">
				<Link
					href={`/tickets/${id}`}
					className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-4"
				>
					<ArrowLeft className="h-4 w-4" />
					チケット詳細に戻る
				</Link>

				<h1 className="text-2xl font-semibold text-slate-900 mb-6">変更要求を編集</h1>

				<ChangeRequestEditForm
					title={editState.title}
					onTitleChange={editState.setTitle}
					description={editState.description}
					onDescriptionChange={editState.setDescription}
					background={editState.background}
					onBackgroundChange={editState.setBackground}
					expectedBenefit={editState.expectedBenefit}
					onExpectedBenefitChange={editState.setExpectedBenefit}
					status={editState.status}
					onStatusChange={editState.setStatus}
					priority={editState.priority}
					onPriorityChange={editState.setPriority}
					selectedRequirements={editState.selectedRequirements}
					onSelectionChange={editState.setSelectedRequirements}
					submitting={editState.submitting}
					error={editState.error}
					changeRequestId={id}
					onSubmit={editState.handleSubmit}
				/>
			</div>
		</div>
	);
}
