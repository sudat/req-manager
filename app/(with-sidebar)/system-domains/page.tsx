"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { MobileHeader } from "@/components/layout/mobile-header";
import { ResourceListPage } from "@/components/resource-page/resource-list-page";
import { systemDomainListConfig } from "@/config/resource-lists";
import { listSystemDomains } from "@/lib/data/system-domains";
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

	// データフェッチ
	const fetchData = async () => {
		if (!currentProjectId) {
			return { data: null, error: "プロジェクトが選択されていません" };
		}

		const [{ data: domainRows, error: domainError }, { data: functionRows, error: functionError }] =
			await Promise.all([
				listSystemDomains(currentProjectId),
				listSystemFunctions(currentProjectId)
			]);

		const fetchError = domainError ?? functionError;
		if (fetchError) {
			return { data: null, error: fetchError };
		}

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

		// ヘルススコアフィルタ適用
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
					if (req.systemDomainIds && req.systemDomainIds.length > 0) {
						req.systemDomainIds.forEach((domainId: string) => {
							problemDomainIds.add(domainId);
						});
					}
				}
			});

			return { data: data.filter((domain) => problemDomainIds.has(domain.id)), error: null };
		}

		return { data, error: null };
	};

	return (
		<>
			<MobileHeader />
			<div className="flex-1 min-h-screen bg-white">
				<div className="mx-auto max-w-[1400px] px-8 py-4">
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

					{/* ResourceListPage に委譲 */}
					<ResourceListPage
						config={systemDomainListConfig}
						fetchData={fetchData}
						deleteItem={async (id) => {
							const { deleteSystemDomain } = await import("@/lib/data/system-domains");
							return deleteSystemDomain(id);
						}}
					/>
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
