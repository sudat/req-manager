"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useProject } from "@/components/project/project-context";
import { useRequirementTitles } from "@/hooks/use-requirement-titles";
import { useRequirementLinks } from "@/hooks/use-requirement-links";
import { useLinkBatchOperations } from "@/hooks/use-link-batch-operations";
import { LinkFilterControls } from "@/components/links/link-filter-controls";
import { LinkBatchActions } from "@/components/links/link-batch-actions";
import { RequirementLinksTable } from "@/components/links/requirement-links-table";

type FilterMode = "all" | "suspect";

function RequirementLinksPageContent(): React.ReactNode {
	const searchParams = useSearchParams();
	const initialFilter = (searchParams?.get("filter") as FilterMode) || "all";
	const [filterMode, setFilterMode] = useState<FilterMode>(initialFilter);
	const { currentProjectId, loading: projectLoading } = useProject();

	// データフェッチ
	const { links, setLinks, loading, error } = useRequirementLinks(
		currentProjectId ?? null,
		filterMode,
		projectLoading
	);

	// 要件タイトルとメタデータを取得
	const titles = useRequirementTitles(links, currentProjectId);

	// バッチ操作
	const {
		confirmingId,
		actionError,
		setActionError,
		selectedIds,
		isBatchConfirming,
		handleConfirmLink,
		handleToggleSelect,
		handleToggleSelectAll,
		handleBatchConfirm,
	} = useLinkBatchOperations(links, setLinks, currentProjectId ?? null);

	if (error) {
		return (
			<div className="flex-1 min-h-screen bg-slate-50">
				<div className="mx-auto max-w-[1400px] px-8 py-6">
					<div className="text-center py-20">
						<p className="text-sm text-rose-600">{error}</p>
					</div>
				</div>
			</div>
		);
	}

	const suspectCount = links.filter((link) => link.suspect).length;

	return (
		<div className="flex-1 min-h-screen bg-slate-50">
			<div className="mx-auto max-w-[1400px] px-8 py-6">
				{/* ページヘッダー */}
				<div className="mb-6">
					<h1 className="text-[28px] font-semibold tracking-tight text-slate-900 mb-2">
						要件リンク
					</h1>
					<p className="text-sm text-slate-600">
						業務要件とシステム要件の関係を管理します
					</p>
				</div>

				{/* フィルターバー */}
				<LinkFilterControls
					filterMode={filterMode}
					onFilterChange={setFilterMode}
					suspectCount={suspectCount}
					totalCount={links.length}
				/>

				{/* アクションエラー表示 */}
				{actionError && (
					<div className="bg-rose-50 border border-rose-200 rounded-lg p-3 mb-4 flex items-center justify-between">
						<p className="text-sm text-rose-700">{actionError}</p>
						<button
							onClick={() => setActionError(null)}
							className="text-rose-500 hover:text-rose-700"
						>
							×
						</button>
					</div>
				)}

				{/* バッチ操作バー */}
				<LinkBatchActions
					suspectCount={suspectCount}
					selectedCount={selectedIds.size}
					isBatchConfirming={isBatchConfirming}
					onToggleSelectAll={handleToggleSelectAll}
					onBatchConfirm={handleBatchConfirm}
				/>

				{/* リンク一覧テーブル */}
				<RequirementLinksTable
					links={links}
					loading={loading}
					filterMode={filterMode}
					titles={titles}
					selectedIds={selectedIds}
					confirmingId={confirmingId}
					onToggleSelect={handleToggleSelect}
					onToggleSelectAll={handleToggleSelectAll}
					onConfirmLink={handleConfirmLink}
				/>
			</div>
		</div>
	);
}

export default function RequirementLinksPage(): React.ReactNode {
	return (
		<Suspense fallback={
			<div className="flex-1 min-h-screen bg-slate-50">
				<div className="mx-auto max-w-[1400px] px-8 py-6">
					<div className="animate-pulse">
						<div className="h-8 bg-slate-200 rounded w-48 mb-6"></div>
						<div className="h-64 bg-slate-200 rounded"></div>
					</div>
				</div>
			</div>
		}>
			<RequirementLinksPageContent />
		</Suspense>
	);
}
