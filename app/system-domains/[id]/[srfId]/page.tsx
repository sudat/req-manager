"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { HealthScoreCard } from "@/components/health-score/health-score-card";
import { CardSkeleton, PageHeaderSkeleton } from "@/components/skeleton";
import {
	FunctionSummaryCard,
	SystemRequirementsSection,
	SystemDesignSection,
	EntryPointsSection,
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
import { listSystemRequirementsBySrfId } from "@/lib/data/system-requirements";
import type { SystemFunction } from "@/lib/domain";
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
		<div className="flex-1 min-h-screen bg-white">
			<div className="mx-auto max-w-[1400px] px-8 py-4">{children}</div>
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

	useEffect(() => {
		let active = true;

		async function fetchData(): Promise<void> {
			setLoading(true);
			const { data, error: fetchError } = await getSystemFunctionById(srfId);
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
	}, [srfId]);

	useEffect(() => {
		if (!srf) return;
		const currentSrf = srf;
		let active = true;

		async function fetchHealth(): Promise<void> {
			setHealthLoading(true);
			const [systemReqResult, conceptResult] = await Promise.all([
				listSystemRequirementsBySrfId(currentSrf.id),
				listConcepts(),
			]);

			if (!active) return;

			const fetchError = systemReqResult.error ?? conceptResult.error;
			if (fetchError) {
				setHealthError(fetchError);
				setHealthSummary(null);
				setHealthLoading(false);
				return;
			}

			const summary = buildHealthScoreSummary({
				businessRequirements: [],
				systemRequirements: systemReqResult.data ?? [],
				systemFunctions: [currentSrf],
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
	}, [srf]);

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
			<div className="flex items-center justify-between mb-4">
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

			<FunctionSummaryCard srf={srf} domainId={id} />
			<div className="mt-4">
				<HealthScoreCard
					title="システム機能ヘルススコア"
					summary={healthSummary}
					loading={healthLoading}
					error={healthError}
					maxIssues={5}
					showStats
				/>
			</div>
			<SystemRequirementsSection srfId={srf.id} />
			<SystemDesignSection systemDesign={srf.systemDesign} />
			<EntryPointsSection entryPoints={srf.entryPoints ?? []} />
		</PageLayout>
	);
}
