"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HealthScoreCard } from "@/components/health-score/health-score-card";
import { MobileHeader } from "@/components/layout/mobile-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listChangeRequests } from "@/lib/data/change-requests";
import { listBusinessRequirements } from "@/lib/data/business-requirements";
import { listConcepts } from "@/lib/data/concepts";
import { listSystemFunctions } from "@/lib/data/system-functions";
import { listSystemRequirements } from "@/lib/data/system-requirements";
import { listDesignDocuments } from "@/lib/data/design-documents";
import { useProject } from "@/components/project/project-context";
import { getLatestBaseline } from "@/lib/mock/data/baselines";
import {
	buildHealthScoreSummary,
	healthIssueFilters,
	type HealthScoreSummary,
} from "@/lib/health-score";
import { buildBusinessRequirementsForHealth } from "@/lib/health-score/utils";
import { SuspectLinksCard } from "./components/suspect-links-card";
import type { ChangeRequest } from "@/lib/domain/value-objects";
import { priorityLabels } from "@/lib/utils/ticket-labels";

export default function DashboardPage() {
	const router = useRouter();
	const [healthSummary, setHealthSummary] = useState<HealthScoreSummary | null>(
		null,
	);
	const [healthLoading, setHealthLoading] = useState(true);
	const [healthError, setHealthError] = useState<string | null>(null);
	const { currentProjectId, loading: projectLoading } = useProject();
	const latestBaseline = currentProjectId ? getLatestBaseline(currentProjectId) : undefined;
	const [crLoading, setCrLoading] = useState(true);
	const [crError, setCrError] = useState<string | null>(null);
	const [openCrCount, setOpenCrCount] = useState(0);
	const [reviewCrCount, setReviewCrCount] = useState(0);
	const [reviewCrList, setReviewCrList] = useState<ChangeRequest[]>([]);

	const handleIssueClick = (issueId: string) => {
		const filter = healthIssueFilters[issueId];
		if (!filter) return;
		router.push(`/${filter.targetPath}?filter=${filter.filterParam}`);
	};

	useEffect(() => {
		if (projectLoading) return;
		if (!currentProjectId) {
			setHealthError("プロジェクトが選択されていません");
			setHealthSummary(null);
			setHealthLoading(false);
			return;
		}
		const projectId = currentProjectId;
		let active = true;

		async function fetchHealth(): Promise<void> {
			setHealthLoading(true);
			const [businessResult, systemResult, functionResult, conceptResult, implUnitResult] =
				await Promise.all([
					listBusinessRequirements(projectId),
					listSystemRequirements(projectId),
					listSystemFunctions(projectId),
					listConcepts(projectId),
					listDesignDocuments(projectId),
				]);

			if (!active) return;

			const fetchError =
				businessResult.error ??
				systemResult.error ??
				functionResult.error ??
				conceptResult.error ??
				implUnitResult.error;

			if (fetchError) {
				setHealthError(fetchError);
				setHealthSummary(null);
				setHealthLoading(false);
				return;
			}

			const businessRequirementsForHealth = buildBusinessRequirementsForHealth(
				businessResult.data ?? [],
				functionResult.data ?? []
			);

			const summary = buildHealthScoreSummary({
				businessRequirements: businessRequirementsForHealth,
				systemRequirements: systemResult.data ?? [],
				systemFunctions: functionResult.data ?? [],
				designDocuments: implUnitResult.data ?? [],
				concepts: conceptResult.data ?? [],
			});

			setHealthSummary(summary);
			setHealthError(null);
			setHealthLoading(false);
		}

		fetchHealth();
		return () => {
			active = false;
		};
	}, [currentProjectId, projectLoading]);

	useEffect(() => {
		if (projectLoading) return;
		if (!currentProjectId) {
			setCrError("プロジェクトが選択されていません");
			setCrLoading(false);
			setOpenCrCount(0);
			setReviewCrCount(0);
			setReviewCrList([]);
			return;
		}

		const projectId = currentProjectId;
		let active = true;

		async function fetchChangeRequests(): Promise<void> {
			setCrLoading(true);
			const { data, error } = await listChangeRequests(projectId);
			if (!active) return;

			if (error) {
				setCrError(error);
				setOpenCrCount(0);
				setReviewCrCount(0);
				setReviewCrList([]);
				setCrLoading(false);
				return;
			}

			const list = data ?? [];
			const open = list.filter((cr) => cr.status === "open").length;
			const review = list.filter((cr) => cr.status === "review");
			const reviewSorted = [...review].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

			setCrError(null);
			setOpenCrCount(open);
			setReviewCrCount(review.length);
			setReviewCrList(reviewSorted.slice(0, 3));
			setCrLoading(false);
		}

		fetchChangeRequests();
		return () => {
			active = false;
		};
	}, [currentProjectId, projectLoading]);

	return (
		<>
			<MobileHeader />
			<div className="flex-1 min-h-screen bg-white">
				<div className="mx-auto max-w-[1400px] px-8 py-6">
					{/* ページヘッダー */}
					<div className="mb-6">
						<div className="flex items-baseline justify-between mb-2">
							<h1 className="text-[32px] font-semibold tracking-tight text-slate-900">
								ダッシュボード
							</h1>
							<div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1">
								<span className="text-[11px] font-medium text-slate-700">
									{latestBaseline ? `ベースライン ${latestBaseline.version}` : "ベースライン 未設定"}
								</span>
							</div>
						</div>
						<p className="text-[13px] text-slate-500">
							作成: {latestBaseline?.date ?? "-"}
						</p>
					</div>

					{/* コンパクトメトリクスバー */}
					<div className="mb-6 flex items-center gap-6 rounded-md border border-slate-200 bg-slate-50/50 px-4 py-3">
						<div className="flex items-baseline gap-2">
							<span className="text-[12px] font-medium text-slate-500">
								オープン変更要求
							</span>
							<span className="font-mono text-[18px] font-semibold tabular-nums text-slate-900">
								{crLoading ? "-" : openCrCount}
							</span>
						</div>
						<div className="h-4 w-px bg-slate-200" />
						<div className="flex items-baseline gap-2">
							<span className="text-[12px] font-medium text-slate-500">
								レビュー待ち
							</span>
							<span className="font-mono text-[18px] font-semibold tabular-nums text-slate-900">
								{crLoading ? "-" : reviewCrCount}
							</span>
						</div>
						<div className="h-4 w-px bg-slate-200" />
						<div className="flex items-baseline gap-2">
							<span className="text-[12px] font-medium text-slate-500">
								次回リリースまで
							</span>
							<span className="font-mono text-[18px] font-semibold tabular-nums text-slate-900">
								27
							</span>
							<span className="text-[11px] text-slate-500">日</span>
						</div>
					</div>

					{/* 疑義リンクカード（Phase 4.7で追加） */}
					{currentProjectId && (
						<div className="mb-6">
							<SuspectLinksCard projectId={currentProjectId} />
						</div>
					)}

					{/* メインコンテンツ */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
						{/* ヘルススコア */}
						<HealthScoreCard
							title="正本ヘルススコア"
							summary={healthSummary}
							loading={healthLoading}
							error={healthError}
							maxIssues={4}
							showStats
							onIssueClick={handleIssueClick}
							defaultExpanded
						/>

						{/* レビュー待ち変更要求 */}
						<Card className="rounded-md border border-slate-200 bg-white">
							<CardHeader className="border-b border-slate-100 px-4 py-3">
								<CardTitle className="text-[15px] font-semibold text-slate-900">
									レビュー待ち変更要求
								</CardTitle>
								<p className="text-[11px] text-slate-500 mt-0.5">
									優先度: 作成日の新しい順（MVP）
								</p>
							</CardHeader>
							<CardContent className="p-0">
								{crLoading ? (
									<div className="px-4 py-3 text-[13px] text-slate-500">読み込み中...</div>
								) : crError ? (
									<div className="px-4 py-3 text-[13px] text-rose-600">エラー: {crError}</div>
								) : reviewCrList.length === 0 ? (
									<div className="px-4 py-3 text-[13px] text-slate-500">レビュー待ちの変更要求はありません</div>
								) : (
									<ul className="divide-y divide-slate-100">
										{reviewCrList.map((cr) => (
											<li key={cr.id} className="px-4 py-3">
												<div className="flex items-start justify-between gap-4 mb-2">
													<div className="flex-1 min-w-0">
														<div className="flex items-center gap-2 mb-1">
															<span className="font-mono text-[11px] text-slate-400">
																{cr.ticketId}
															</span>
															<Badge
																variant="outline"
																className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] px-1.5 py-0 font-medium"
															>
																レビュー中
															</Badge>
														</div>
														<div className="text-[14px] font-medium text-slate-900 mb-0.5">
															{cr.title}
														</div>
														<div className="text-[13px] text-slate-500">
															優先度: {priorityLabels[cr.priority]}
														</div>
													</div>
												</div>
												<div className="flex items-center gap-2 flex-wrap">
													<Badge
														variant="outline"
														className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] font-mono px-2 py-0.5"
													>
														{cr.createdAt.split("T")[0]}
													</Badge>
													<Link href={`/tickets/${cr.id}`} className="ml-auto">
														<Button
															size="sm"
															variant="outline"
															className="h-7 px-3 text-[14px] font-medium border-slate-200 hover:bg-slate-50"
														>
															開く
														</Button>
													</Link>
												</div>
											</li>
										))}
									</ul>
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</>
	);
}
