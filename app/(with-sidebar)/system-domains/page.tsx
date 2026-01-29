"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Plus, AlertCircle } from "lucide-react";
import { MobileHeader } from "@/components/layout/mobile-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/skeleton";
import { deleteSystemDomain, listSystemDomains } from "@/lib/data/system-domains";
import { listSystemFunctions } from "@/lib/data/system-functions";
import { useProject } from "@/components/project/project-context";
import type { SystemDomain } from "@/lib/data/system-domains";
import type { SystemFunction } from "@/lib/domain";
import { listSystemRequirements } from "@/lib/data/system-requirements";
import { healthIssueFilters } from "@/lib/health-score";

type SystemDomainWithCount = SystemDomain & { functionCount: number };

function SystemDomainsPageContent(): React.ReactNode {
	const searchParams = useSearchParams();
	const healthFilter = searchParams?.get("filter");
	const { currentProjectId, loading: projectLoading } = useProject();

	const [items, setItems] = useState<SystemDomainWithCount[]>([]);
	const [query, setQuery] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	// データフェッチ
	useEffect(() => {
		if (projectLoading || !currentProjectId) {
			setItems([]);
			setLoading(false);
			return;
		}
		let active = true;
		const fetchDataInternal = async () => {
			setLoading(true);
			const [{ data: domainRows, error: domainError }, { data: functionRows, error: functionError }] =
				await Promise.all([
					listSystemDomains(currentProjectId),
					listSystemFunctions(currentProjectId)
				]);
			if (!active) return;
			const fetchError = domainError ?? functionError;
			if (fetchError) {
				setError(fetchError);
				setItems([]);
			} else {
				setError(null);
				// 機能数を計算
				const map = new Map<string, number>();
				(functionRows ?? []).forEach((fn: SystemFunction) => {
					const domainId = fn.systemDomainId ?? "";
					if (!domainId) return;
					map.set(domainId, (map.get(domainId) ?? 0) + 1);
				});

				const data = (domainRows ?? []).map(
					(d: SystemDomain): SystemDomainWithCount => ({
						...d,
						functionCount: map.get(d.id) ?? 0,
					}),
				);
				setItems(data);
			}
			setLoading(false);
		};
		fetchDataInternal();
		return () => {
			active = false;
		};
	}, [currentProjectId, projectLoading]);

	// ヘルススコアフィルタ用のシステム要件データを取得
	const [systemRequirements, setSystemRequirements] = useState<any[]>([]);
	const [systemRequirementsLoading, setSystemRequirementsLoading] = useState(false);

	useEffect(() => {
		if (!healthFilter || !currentProjectId) return;
		let active = true;
		const fetchSystemRequirements = async () => {
			setSystemRequirementsLoading(true);
			const { data } = await listSystemRequirements(currentProjectId);
			if (active) {
				setSystemRequirements(data ?? []);
				setSystemRequirementsLoading(false);
			}
		};
		fetchSystemRequirements();
		return () => { active = false; };
	}, [healthFilter, currentProjectId]);

	// 検索フィルタ + ヘルススコアフィルタ
	const filtered = useMemo(() => {
		let result = items;

		// 検索フィルタ
		const normalized = query.trim().toLowerCase();
		if (normalized) {
			result = result.filter((item) => {
				const searchText = `${item.id} ${item.name} ${item.description}`.toLowerCase();
				return searchText.includes(normalized);
			});
		}

		// ヘルススコアフィルタ
		if (healthFilter === 'missing_br_link' || healthFilter === 'missing_entrypoint' ||
			healthFilter === 'missing_category' || healthFilter === 'missing_acceptance') {
			// 問題のあるシステム要件を持つシステムドメインを抽出
			const problemDomainIds = new Set<string>();
			systemRequirements.forEach((req) => {
				let hasProblem = false;
				if (healthFilter === 'missing_br_link') {
					hasProblem = !req.businessRequirementIds || req.businessRequirementIds.length === 0;
				} else if (healthFilter === 'missing_category') {
					hasProblem = !req.categoryRaw || !['function', 'data', 'exception', 'non_functional'].includes(req.categoryRaw);
				} else if (healthFilter === 'missing_acceptance') {
					hasProblem = !req.acceptanceCriteriaJson || req.acceptanceCriteriaJson.length === 0;
				}
				if (hasProblem && req.srfId) {
					// srfId から systemDomainId を取得
					const fn = systemRequirements.find((sr) => sr.id === req.srfId);
					if (fn) {
						// システム機能からシステムドメインIDを取得
						// ここでは簡易的に、システム要件の systemDomainIds を使用
						if (req.systemDomainIds && req.systemDomainIds.length > 0) {
							req.systemDomainIds.forEach((domainId: string) => {
								problemDomainIds.add(domainId);
							});
						}
					}
				}
			});

			result = result.filter((domain) => problemDomainIds.has(domain.id));
		}

		return result;
	}, [items, query, healthFilter, systemRequirements]);

	return (
		<>
			<MobileHeader />
			<div className="flex-1 min-h-screen bg-white">
				<div className="mx-auto max-w-[1400px] px-8 py-4">
					{/* Page Header */}
					<div className="mb-4">
						<h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-2">
							システム領域一覧
						</h1>
						<p className="text-[13px] text-slate-500">システム領域ごとに機能を整理します</p>
					</div>

					{/* ヘルススコアフィルタ表示 */}
					{healthFilter && (
						<div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-md flex items-center justify-between">
							<div className="flex items-center gap-2">
								<AlertCircle className="h-4 w-4 text-amber-600" />
								<span className="text-[13px] text-amber-800">
									ヘルススコア フィルタ適用中: {healthIssueFilters[healthFilter]?.label || healthFilter}
								</span>
							</div>
							<Link href="/system" className="text-[13px] text-amber-700 underline hover:no-underline">
								クリア
							</Link>
						</div>
					)}

					{/* Search Bar */}
					<div className="mb-4 flex items-center gap-4 rounded-md border border-slate-200 bg-slate-50/50 px-4 py-3">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
							<input
								type="text"
								placeholder="システム領域を検索..."
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								className="w-full pl-10 pr-3 py-1.5 bg-transparent border-0 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
							/>
						</div>
						<Link href="/system/create">
							<Button className="h-8 px-4 text-[14px] font-medium bg-slate-900 hover:bg-slate-800 gap-2">
								<Plus className="h-4 w-4" />
								新規作成
							</Button>
						</Link>
					</div>

					{/* Table */}
					<div className="rounded-md border border-slate-200 bg-white overflow-hidden">
						<Table>
							<TableHeader>
								<TableRow className="border-b border-slate-200">
									<TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
										ID
									</TableHead>
									<TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
										システム領域
									</TableHead>
									<TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
										説明
									</TableHead>
									<TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
										機能数
									</TableHead>
									<TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
										操作
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{loading ? (
									<TableSkeleton cols={5} rows={5} />
								) : error ? (
									<TableRow>
										<TableCell colSpan={5} className="px-4 py-10 text-center text-[14px] text-rose-600">
											{error}
										</TableCell>
									</TableRow>
								) : filtered.length === 0 ? (
									<TableRow>
										<TableCell colSpan={5} className="px-4 py-10 text-center text-[14px] text-slate-500">
											{healthFilter ? "該当するシステム領域がありません（ヘルススコアフィルタ適用中）" : "該当するシステム領域がありません。"}
										</TableCell>
									</TableRow>
								) : (
									filtered.map((domain) => (
										<TableRow
											key={domain.id}
											className="cursor-pointer border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"
											onClick={() => {
												if (typeof window !== 'undefined') {
													window.location.href = `/system/${domain.id}`;
												}
											}}
										>
											<TableCell className="px-4 py-3">
												<Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 font-mono text-[12px] font-medium px-2 py-0.5">
													{domain.id}
												</Badge>
											</TableCell>
											<TableCell className="px-4 py-3">
												<span className="text-[14px] font-medium text-slate-900">{domain.name}</span>
											</TableCell>
											<TableCell className="px-4 py-3">
												<span className="text-[13px] text-slate-600">{domain.description}</span>
											</TableCell>
											<TableCell className="px-4 py-3">
												<div className="flex items-baseline gap-1.5">
													<span className="font-mono text-[16px] font-semibold text-slate-900 tabular-nums">{domain.functionCount ?? 0}</span>
													<span className="text-[11px] text-slate-400">件</span>
												</div>
											</TableCell>
											<TableCell className="px-4 py-3">
												<div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
													<Link href={`/system/${domain.id}`}>
														<Button
															size="icon"
															variant="outline"
															className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900"
															title="照会"
														>
															<span className="text-xs">👁</span>
														</Button>
													</Link>
													<Link href={`/system/${domain.id}/edit`}>
														<Button
															size="icon"
															variant="outline"
															className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900"
															title="編集"
														>
															<span className="text-xs">✏</span>
														</Button>
													</Link>
												</div>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
				</div>
			</div>
		</>
	);
}

export default function SystemDomainsPage(): React.ReactNode {
	return (
		<Suspense fallback={
			<div className="flex-1 min-h-screen bg-white">
				<div className="mx-auto max-w-[1400px] px-8 py-4">
					<div className="animate-pulse">
						<div className="h-8 bg-slate-200 rounded w-48 mb-6"></div>
						<div className="h-64 bg-slate-200 rounded"></div>
					</div>
				</div>
			</div>
		}>
			<SystemDomainsPageContent />
		</Suspense>
	);
}
