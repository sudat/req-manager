"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { HealthScoreCard } from "@/components/health-score/health-score-card";
import { CardSkeleton, PageHeaderSkeleton } from "@/components/skeleton";
import {
	FunctionSummaryCard,
	SystemRequirementsSection,
	ImplUnitSdSection,
} from "@/components/system-domains";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { listConcepts } from "@/lib/data/concepts";
import { getSystemFunctionById } from "@/lib/data/system-functions";
import { listImplUnitSdsBySrfId } from "@/lib/data/impl-unit-sds";
import { listSystemRequirementsBySrfId } from "@/lib/data/system-requirements";
import { listBusinessRequirementsByIds } from "@/lib/data/business-requirements";
import type { SystemFunction, ImplUnitSd } from "@/lib/domain";
import { useProject } from "@/components/project/project-context";
import {
	buildHealthScoreSummary,
	type HealthScoreSummary,
} from "@/lib/health-score";

// ============================================================
// Page Layout Components
// ============================================================

function PageLayout({
	children,
}: {
	children: React.ReactNode;
}): React.ReactNode {
	return (
		<div className="flex-1 min-h-screen bg-slate-50">
			<div className="mx-auto max-w-[1400px] px-8 py-6">{children}</div>
		</div>
	);
}

function LoadingState(): React.ReactNode {
	return (
		<PageLayout>
			<PageHeaderSkeleton />
			<CardSkeleton />
			<CardSkeleton />
			<CardSkeleton />
			<CardSkeleton />
		</PageLayout>
	);
}

interface NotFoundStateProps {
	domainId: string;
	error: string | null;
}

function NotFoundState({
	domainId,
	error,
}: NotFoundStateProps): React.ReactNode {
	return (
		<PageLayout>
			<div className="text-center py-20">
				<h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-4">
					システム機能が見つかりません
				</h1>
				{error && <p className="text-sm text-rose-600 mb-4">{error}</p>}
				<Link href={`/system-domains/${domainId}`}>
					<Button className="bg-slate-900 hover:bg-slate-800">
						システム機能一覧に戻る
					</Button>
				</Link>
			</div>
		</PageLayout>
	);
}

// ============================================================
// Main Page Component
// ============================================================

export default function SystemFunctionDetailPage({
	params,
}: {
	params: Promise<{ id: string; srfId: string }>;
}): React.ReactNode {
	const { id, srfId } = use(params);
	const [srf, setSrf] = useState<SystemFunction | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [healthSummary, setHealthSummary] = useState<HealthScoreSummary | null>(
		null,
	);
	const [healthLoading, setHealthLoading] = useState(true);
	const [healthError, setHealthError] = useState<string | null>(null);
	const [implUnitSds, setImplUnitSds] = useState<ImplUnitSd[]>([]);
	const [implUnitsLoading, setImplUnitsLoading] = useState(true);
	const [implUnitsError, setImplUnitsError] = useState<string | null>(null);
	const { currentProjectId, loading: projectLoading } = useProject();

	useEffect(() => {
		if (projectLoading) return;
		if (!currentProjectId) {
			setError("プロジェクトが選択されていません");
			setSrf(null);
			setLoading(false);
			return;
		}
		const projectId = currentProjectId;
		let active = true;

		async function fetchData(): Promise<void> {
			setLoading(true);
			const { data, error: fetchError } = await getSystemFunctionById(srfId, projectId);
			if (!active) return;

			if (fetchError) {
				setError(fetchError);
				setSrf(null);
			} else {
				setError(null);
				setSrf(data ?? null);
			}
			setLoading(false);
		}

		fetchData();
		return () => {
			active = false;
		};
	}, [srfId, currentProjectId, projectLoading]);

	useEffect(() => {
		if (!srf || projectLoading || !currentProjectId) return;
		const currentSrf = srf;
		const projectId = currentProjectId;
		let active = true;

		async function fetchHealth(): Promise<void> {
			setHealthLoading(true);
			const [systemReqResult, conceptResult, implUnitResult] = await Promise.all([
				listSystemRequirementsBySrfId(currentSrf.id, projectId),
				listConcepts(projectId),
				listImplUnitSdsBySrfId(currentSrf.id, projectId),
			]);

			if (!active) return;

			const fetchError = systemReqResult.error ?? conceptResult.error ?? implUnitResult.error;
			if (fetchError) {
				setHealthError(fetchError);
				setHealthSummary(null);
				setHealthLoading(false);
				return;
			}

			// システム要件から関連する業務要件IDを収集
			const systemReqs = systemReqResult.data ?? [];
			const relatedBusinessRequirementIds = Array.from(
				new Set(
					systemReqs.flatMap(req => req.businessRequirementIds)
				)
			);

			// 業務要件を取得
			const businessReqResult = await listBusinessRequirementsByIds(
				relatedBusinessRequirementIds,
				projectId
			);

			if (!active) return;

			if (businessReqResult.error) {
				setHealthError(businessReqResult.error);
				setHealthSummary(null);
				setHealthLoading(false);
				return;
			}

			const summary = buildHealthScoreSummary({
				businessRequirements: businessReqResult.data ?? [],
				systemRequirements: systemReqResult.data ?? [],
				systemFunctions: [currentSrf],
				implUnitSds: implUnitResult.data ?? [],
				concepts: conceptResult.data ?? [],
				conceptCheckTarget: 'system',
				pageType: 'system',
			});

			setHealthSummary(summary);
			setHealthError(null);
			setHealthLoading(false);
		}

		fetchHealth();
		return () => {
			active = false;
		};
	}, [srf, currentProjectId, projectLoading]);

	useEffect(() => {
		if (projectLoading) return;
		if (!currentProjectId) {
			setImplUnitsError("プロジェクトが選択されていません");
			setImplUnitsLoading(false);
			setImplUnitSds([]);
			return;
		}
		let active = true;
		const projectId = currentProjectId;

		async function fetchImplUnits(): Promise<void> {
			setImplUnitsLoading(true);
			const { data, error: fetchError } = await listImplUnitSdsBySrfId(srfId, projectId);
			if (!active) return;
			if (fetchError) {
				setImplUnitsError(fetchError);
				setImplUnitSds([]);
			} else {
				setImplUnitsError(null);
				setImplUnitSds(data ?? []);
			}
			setImplUnitsLoading(false);
		}

		fetchImplUnits();
		return () => {
			active = false;
		};
	}, [srfId, currentProjectId, projectLoading]);

	if (loading) {
		return <LoadingState />;
	}

	if (!srf) {
		return <NotFoundState domainId={id} error={error} />;
	}

	return (
		<PageLayout>
			{/* パンくずリスト */}
			<Breadcrumb className="mb-4">
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink asChild>
							<Link href="/system-domains">システム領域一覧</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink asChild>
							<Link href={`/system-domains/${id}`}>システム機能一覧</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>システム機能詳細</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			{/* タイトルと編集ボタン */}
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-[32px] font-semibold tracking-tight text-slate-900">
					システム機能詳細
				</h1>
				<Link href={`/system-domains/${id}/${srf.id}/edit`}>
					<Button variant="outline" className="h-8 gap-2 text-[14px]">
						<Pencil className="h-4 w-4" />
						編集
					</Button>
				</Link>
			</div>

			<div className="space-y-4">
				<FunctionSummaryCard srf={srf} domainId={id} />
				<HealthScoreCard
					title="システム機能ヘルススコア"
					summary={healthSummary}
					loading={healthLoading}
					error={healthError}
					maxIssues={5}
					showStats
					pageType="system"
				/>
			</div>

			<div className="mt-6 space-y-6">
				<section className="space-y-4">
					<div>
						<div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
							仕様
						</div>
						<div className="text-[14px] font-medium text-slate-700">
							システム要件
						</div>
					</div>
					<SystemRequirementsSection srfId={srf.id} />
				</section>
				<section className="space-y-4">
					<div>
						<div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
							実装
						</div>
						<div className="text-[14px] font-medium text-slate-700">
							実装単位SD（IU）
						</div>
					</div>
					<ImplUnitSdSection
						items={implUnitSds}
						loading={implUnitsLoading}
						error={implUnitsError}
					/>
				</section>
			</div>
		</PageLayout>
	);
}
