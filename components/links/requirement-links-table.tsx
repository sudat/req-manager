import Link from "next/link";
import { Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RequirementLink } from "@/lib/domain";
import { getRequirementLinkTypeLabel } from "@/lib/data/requirement-links";
import { getRequirementUrl } from "@/hooks/use-requirement-titles";

interface RequirementLinksTableProps {
	links: RequirementLink[];
	loading: boolean;
	filterMode: "all" | "suspect";
	titles: Map<string, { title: string; metadata?: Record<string, unknown> }>;
	selectedIds: Set<string>;
	confirmingId: string | null;
	onToggleSelect: (linkId: string) => void;
	onToggleSelectAll: () => void;
	onConfirmLink: (linkId: string) => void;
}

export function RequirementLinksTable({
	links,
	loading,
	filterMode,
	titles,
	selectedIds,
	confirmingId,
	onToggleSelect,
	onToggleSelectAll,
	onConfirmLink,
}: RequirementLinksTableProps) {
	if (loading) {
		return (
			<div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
				<div className="p-8">
					<div className="animate-pulse space-y-3">
						<div className="h-12 bg-slate-200 rounded"></div>
						<div className="h-12 bg-slate-200 rounded"></div>
						<div className="h-12 bg-slate-200 rounded"></div>
						<div className="h-12 bg-slate-200 rounded"></div>
						<div className="h-12 bg-slate-200 rounded"></div>
					</div>
				</div>
			</div>
		);
	}

	if (links.length === 0) {
		return (
			<div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
				<div className="text-center py-20">
					<p className="text-sm text-slate-600">
						{filterMode === "suspect" ? "疑義リンクはありません" : "リンクがありません"}
					</p>
				</div>
			</div>
		);
	}

	const suspectLinks = links.filter((l) => l.suspect);

	return (
		<div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
			<div className="overflow-x-auto">
				<table className="w-full">
					<thead className="bg-slate-50 border-b border-slate-200">
						<tr>
							<th className="px-4 py-3 w-10">
								<input
									type="checkbox"
									checked={selectedIds.size === suspectLinks.length && suspectLinks.length > 0}
									onChange={onToggleSelectAll}
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
						{links.map((link) => {
							const sourceInfo = titles.get(`${link.sourceType}:${link.sourceId}`);
							const sourceUrl = getRequirementUrl(link.sourceType, link.sourceId, sourceInfo);
							const showSourceLink = sourceUrl !== "#";

							const targetInfo = titles.get(`${link.targetType}:${link.targetId}`);
							const targetUrl = getRequirementUrl(link.targetType, link.targetId, targetInfo);
							const showTargetLink = targetUrl !== "#";

							return (
								<tr key={link.id} className="hover:bg-slate-50">
									<td className="px-4 py-3">
										{link.suspect && (
											<input
												type="checkbox"
												checked={selectedIds.has(link.id)}
												onChange={() => onToggleSelect(link.id)}
												className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
											/>
										)}
									</td>
									<td className="px-4 py-3 text-sm">
										<div className="flex flex-col gap-0.5">
											{showSourceLink ? (
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
									</td>
									<td className="px-4 py-3 text-sm">
										<div className="flex flex-col gap-0.5">
											{showTargetLink ? (
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
												onClick={() => onConfirmLink(link.id)}
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
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
}
