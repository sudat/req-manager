"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Filter, Check, CheckSquare, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useProject } from "@/components/project/project-context";
import {
	listRequirementLinksByProjectId,
	listSuspectLinks,
	updateRequirementLink,
	getRequirementLinkTypeLabel,
} from "@/lib/data/requirement-links";
import type { RequirementLink } from "@/lib/domain";
import { useRequirementTitles, getRequirementUrl } from "@/hooks/use-requirement-titles";

type FilterMode = "all" | "suspect";

function RequirementLinksPageContent(): React.ReactNode {
	const searchParams = useSearchParams();
	const initialFilter = (searchParams?.get("filter") as FilterMode) || "all";

	const [links, setLinks] = useState<RequirementLink[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [filterMode, setFilterMode] = useState<FilterMode>(initialFilter);
	const [confirmingId, setConfirmingId] = useState<string | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [isBatchConfirming, setIsBatchConfirming] = useState(false);
	const { currentProjectId, loading: projectLoading } = useProject();

	// 要件タイトルとメタデータを取得
	const titles = useRequirementTitles(links, currentProjectId);

	useEffect(() => {
		if (projectLoading) return;
		if (!currentProjectId) {
			setError("プロジェクトが選択されていません");
			setLoading(false);
			return;
		}

		let active = true;
		const projectId = currentProjectId; // 型narrowingのため

		async function fetchLinks(): Promise<void> {
			setLoading(true);
			setError(null);

			try {
				let fetchedLinks: RequirementLink[];

				if (filterMode === "suspect") {
					fetchedLinks = await listSuspectLinks(projectId);
				} else {
					const { data, error: fetchError } = await listRequirementLinksByProjectId(projectId);
					if (fetchError) {
						setError(fetchError);
						setLoading(false);
						return;
					}
					fetchedLinks = data || [];
				}

				if (active) {
					setLinks(fetchedLinks);
					setLoading(false);
				}
			} catch (e) {
				if (active) {
					setError(e instanceof Error ? e.message : String(e));
					setLoading(false);
				}
			}
		}

		fetchLinks();

		return () => {
			active = false;
		};
	}, [currentProjectId, projectLoading, filterMode]);

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

	// 疑義リンクを確認するハンドラー
	const handleConfirmLink = async (linkId: string) => {
		setConfirmingId(linkId);
		setActionError(null);

		const { data, error } = await updateRequirementLink(
			linkId,
			{ suspect: false },
			currentProjectId
		);

		if (error) {
			setActionError(`リンクの確認に失敗しました: ${error}`);
		} else if (data) {
			// ローカルstateを更新（再fetchを回避）
			setLinks((prev) => prev.map((link) => (link.id === linkId ? data : link)));
		}

		setConfirmingId(null);
	};

	// 選択状態をトグルするハンドラー
	const handleToggleSelect = (linkId: string) => {
		setSelectedIds((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(linkId)) {
				newSet.delete(linkId);
			} else {
				newSet.add(linkId);
			}
			return newSet;
		});
	};

	// 全選択/全解除ハンドラー
	const handleToggleSelectAll = () => {
		const suspectLinks = links.filter((link) => link.suspect);
		if (selectedIds.size === suspectLinks.length) {
			// 全選択されている場合は全解除
			setSelectedIds(new Set());
		} else {
			// 全選択
			setSelectedIds(new Set(suspectLinks.map((link) => link.id)));
		}
	};

	// 一括確認ハンドラー
	const handleBatchConfirm = async () => {
		if (selectedIds.size === 0) return;

		setIsBatchConfirming(true);
		setActionError(null);

		const idsToUpdate = Array.from(selectedIds);
		let successCount = 0;
		let firstError: string | null = null;

		for (const linkId of idsToUpdate) {
			const { error } = await updateRequirementLink(
				linkId,
				{ suspect: false },
				currentProjectId
			);

			if (error) {
				if (!firstError) firstError = error;
			} else {
				successCount++;
				// ローカルstateを更新
				setLinks((prev) =>
					prev.map((link) =>
						link.id === linkId ? { ...link, suspect: false, updatedAt: new Date().toISOString() } : link
					)
				);
			}
		}

		if (firstError) {
			setActionError(`一括確認で一部エラーが発生しました: ${firstError}（成功: ${successCount}/${idsToUpdate.length}）`);
		}

		setSelectedIds(new Set());
		setIsBatchConfirming(false);
	};

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
				<div className="bg-white rounded-lg border border-slate-200 p-4 mb-4 flex items-center gap-4">
					<Filter className="h-5 w-5 text-slate-400" />
					<Select
						value={filterMode}
						onValueChange={(value) => setFilterMode(value as FilterMode)}
					>
						<SelectTrigger className="w-[200px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">全件表示</SelectItem>
							<SelectItem value="suspect">
								疑義のみ {suspectCount > 0 && `(${suspectCount}件)`}
							</SelectItem>
						</SelectContent>
					</Select>
					<div className="ml-auto text-sm text-slate-600">
						{links.length}件のリンク
					</div>
				</div>

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

				{/* バッチ操作バー（疑義リンクがある場合のみ表示） */}
				{links.some((link) => link.suspect) && (
					<div className="bg-white rounded-lg border border-slate-200 p-3 mb-4 flex items-center gap-3">
						<input
							type="checkbox"
							checked={selectedIds.size === links.filter((l) => l.suspect).length}
							onChange={handleToggleSelectAll}
							className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
						/>
						<span className="text-sm text-slate-600">
							{selectedIds.size > 0
								? `${selectedIds.size}件を選択中`
								: "疑義リンクを一括選択"}
						</span>
						{selectedIds.size > 0 && (
							<Button
								variant="outline"
								size="sm"
								className="h-8 px-3 text-[13px] ml-auto"
								onClick={handleBatchConfirm}
								disabled={isBatchConfirming}
							>
								{isBatchConfirming ? (
									<>
										<Check className="h-4 w-4 mr-1.5" />
										確認中...
									</>
								) : (
									<>
										<CheckSquare className="h-4 w-4 mr-1.5" />
										一括確認 ({selectedIds.size}件)
									</>
								)}
							</Button>
						)}
					</div>
				)}

				{/* リンク一覧テーブル */}
				<div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
					{loading ? (
						<div className="p-8">
							<div className="animate-pulse space-y-3">
								<div className="h-12 bg-slate-200 rounded"></div>
								<div className="h-12 bg-slate-200 rounded"></div>
								<div className="h-12 bg-slate-200 rounded"></div>
								<div className="h-12 bg-slate-200 rounded"></div>
								<div className="h-12 bg-slate-200 rounded"></div>
							</div>
						</div>
					) : links.length === 0 ? (
						<div className="text-center py-20">
							<p className="text-sm text-slate-600">
								{filterMode === "suspect" ? "疑義リンクはありません" : "リンクがありません"}
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead className="bg-slate-50 border-b border-slate-200">
									<tr>
										<th className="px-4 py-3 w-10">
											<input
												type="checkbox"
												checked={selectedIds.size === links.filter((l) => l.suspect).length && links.filter((l) => l.suspect).length > 0}
												onChange={handleToggleSelectAll}
												className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
											/>
										</th>
										<th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
											ソース
										</th>
										<th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
											ターゲット
										</th>
										<th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
											リンク種別
										</th>
										<th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
											疑義
										</th>
										<th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
											更新日時
										</th>
										<th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
											アクション
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-200">
									{links.map((link) => (
										<tr key={link.id} className="hover:bg-slate-50">
											<td className="px-4 py-3">
												{link.suspect && (
													<input
														type="checkbox"
														checked={selectedIds.has(link.id)}
														onChange={() => handleToggleSelect(link.id)}
														className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
													/>
												)}
											</td>
											<td className="px-4 py-3 text-sm">
												{(() => {
													const sourceInfo = titles.get(`${link.sourceType}:${link.sourceId}`);
													const sourceUrl = getRequirementUrl(link.sourceType, link.sourceId, sourceInfo);
													const showLink = sourceUrl !== "#";

													return (
														<div className="flex flex-col gap-0.5">
															{showLink ? (
																<Link
																	href={sourceUrl}
																	className="font-medium text-slate-900 hover:text-brand-600 flex items-center gap-1 group"
																>
																	{sourceInfo?.title || `${link.sourceType.toUpperCase()}: ${link.sourceId}`}
																	<ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
																</Link>
															) : (
																<div className="font-medium text-slate-900">
																	{sourceInfo?.title || `${link.sourceType.toUpperCase()}: ${link.sourceId}`}
																</div>
															)}
															<div className="text-xs text-slate-500">
																{link.sourceType.toUpperCase()}: {link.sourceId}
															</div>
														</div>
													);
												})()}
											</td>
											<td className="px-4 py-3 text-sm">
												{(() => {
													const targetInfo = titles.get(`${link.targetType}:${link.targetId}`);
													const targetUrl = getRequirementUrl(link.targetType, link.targetId, targetInfo);
													const showLink = targetUrl !== "#";

													return (
														<div className="flex flex-col gap-0.5">
															{showLink ? (
																<Link
																	href={targetUrl}
																	className="font-medium text-slate-900 hover:text-brand-600 flex items-center gap-1 group"
																>
																	{targetInfo?.title || `${link.targetType.toUpperCase()}: ${link.targetId}`}
																	<ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
																</Link>
															) : (
																<div className="font-medium text-slate-900">
																	{targetInfo?.title || `${link.targetType.toUpperCase()}: ${link.targetId}`}
																</div>
															)}
															<div className="text-xs text-slate-500">
																{link.targetType.toUpperCase()}: {link.targetId}
															</div>
														</div>
													);
												})()}
											</td>
											<td className="px-4 py-3 text-sm text-slate-600">
												{getRequirementLinkTypeLabel(link.linkType as any)}
											</td>
											<td className="px-4 py-3 text-sm">
												{link.suspect ? (
													<span className="inline-flex items-center px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-medium">
														⚠️ 疑義あり
													</span>
												) : (
													<span className="text-slate-400">-</span>
												)}
											</td>
											<td className="px-4 py-3 text-sm text-slate-600">
												{new Date(link.updatedAt).toLocaleString("ja-JP")}
											</td>
											<td className="px-4 py-3 text-sm">
												{link.suspect && (
													<Button
														variant="outline"
														size="sm"
														className="h-7 px-2 text-[11px]"
														onClick={() => handleConfirmLink(link.id)}
														disabled={confirmingId !== null}
													>
														{confirmingId === link.id ? (
															<>
																<Check className="h-3 w-3 mr-1" />
																確認中...
															</>
														) : (
															<>
																<Check className="h-3 w-3 mr-1" />
																確認
															</>
														)}
													</Button>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
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
