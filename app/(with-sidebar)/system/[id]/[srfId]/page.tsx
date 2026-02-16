"use client";

import { Pencil, Sparkles, SearchX, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { HealthScoreCard } from "@/components/health-score/health-score-card";
import { CardSkeleton, PageHeaderSkeleton } from "@/components/skeleton";
import {
	FunctionSummaryCard,
	SystemRequirementsSection,
	DesignDocumentSection,
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
import { listDesignDocumentsBySrfId } from "@/lib/data/design-documents";
import { listSystemRequirementsBySrfId } from "@/lib/data/system-requirements";
import { listBusinessRequirementsByIds } from "@/lib/data/business-requirements";
import type { SystemFunction, DesignDocument } from "@/lib/domain";
import { useProject } from "@/components/project/project-context";
import {
	buildHealthScoreSummary,
	type HealthScoreSummary,
} from "@/lib/health-score";
import { buildBusinessRequirementsForHealth } from "@/lib/health-score/utils";

// ============================================================
// Page Layout Components
// ============================================================

function PageLayout({
	children,
}: {
	children: React.ReactNode;
}): React.ReactNode {
	return (
		<div className="min-h-screen bg-slate-50">
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
	srfId: string;
	error: string | null;
}

function NotFoundState({
	domainId,
	srfId,
	error,
}: NotFoundStateProps): React.ReactNode {
	return (
		<PageLayout>
			{/* パンくずリスト */}
			<Breadcrumb className="mb-4">
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink asChild>
							<Link href="/system">システム領域一覧</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink asChild>
							<Link href={`/system/${domainId}`}>システム機能一覧</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage className="font-semibold text-slate-900">システム機能詳細</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			{/* タイトルとAIボタン */}
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-[32px] font-semibold tracking-tight text-slate-900">
					システム機能詳細
				</h1>
				<div className="flex gap-2">
					<Link href={`/chat?screen=SF&sdId=${domainId}&sfId=${srfId}`}>
						<Button className="h-8 gap-2 text-[14px] bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white">
							<Sparkles className="h-4 w-4" />
							AIで追加
						</Button>
					</Link>
					<Link href={`/system/${domainId}/${srfId}/edit/requirements`}>
						<Button variant="ghost" size="sm" className="h-7 gap-1.5 text-[12px] hover:bg-slate-100 transition-colors">
							<Pencil className="h-3.5 w-3.5" />
							編集
						</Button>
					</Link>
				</div>
			</div>

			<div className="flex flex-col items-center justify-center py-16 px-4">
				<div className="bg-slate-100 rounded-full p-6 mb-6">
					<SearchX className="h-12 w-12 text-slate-400" />
				</div>
				<h2 className="text-xl font-semibold text-slate-900 mb-2">
					システム機能が見つかりません
				</h2>
				<p className="text-sm text-slate-500 text-center max-w-md mb-2">
					指定されたシステム機能「<span className="font-mono text-slate-700">{srfId}</span>」は存在しないか、削除された可能性があります。
				</p>
				{error && <p className="text-sm text-rose-600 mb-2">{error}</p>}
				<div className="flex items-center gap-2 text-xs text-slate-400 mb-8">
					<span className="font-mono bg-slate-100 px-2 py-1 rounded">{domainId}</span>
					<span>/</span>
					<span className="font-mono bg-slate-100 px-2 py-1 rounded">{srfId}</span>
				</div>
				<div className="flex gap-3">
					<Link href={`/system/${domainId}`}>
						<Button variant="outline" className="gap-2">
							<ArrowLeft className="h-4 w-4" />
							一覧に戻る
						</Button>
					</Link>
					<Link href={`/chat?screen=SF&sdId=${domainId}&sfId=${srfId}`}>
						<Button className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white">
							<Sparkles className="h-4 w-4" />
							AIで新規作成
						</Button>
					</Link>
				</div>
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
	const [designDocuments, setDesignDocuments] = useState<DesignDocument[]>([]);
	const [designDocumentsLoading, setDesignDocumentsLoading] = useState(true);
	const [designDocumentsError, setDesignDocumentsError] = useState<string | null>(null);
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
				listDesignDocumentsBySrfId(currentSrf.id, projectId),
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

			const businessRequirementsForHealth = buildBusinessRequirementsForHealth(
				businessReqResult.data ?? [],
				[currentSrf]
			);

			const summary = buildHealthScoreSummary({
				businessRequirements: businessRequirementsForHealth,
				systemRequirements: systemReqResult.data ?? [],
				systemFunctions: [currentSrf],
				designDocuments: implUnitResult.data ?? [],
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
			setDesignDocumentsError("プロジェクトが選択されていません");
			setDesignDocumentsLoading(false);
			setDesignDocuments([]);
			return;
		}
		let active = true;
		const projectId = currentProjectId;

		async function fetchImplUnits(): Promise<void> {
			setDesignDocumentsLoading(true);
			const { data, error: fetchError } = await listDesignDocumentsBySrfId(srfId, projectId);
			if (!active) return;
			if (fetchError) {
				setDesignDocumentsError(fetchError);
				setDesignDocuments([]);
			} else {
				setDesignDocumentsError(null);
				setDesignDocuments(data ?? []);
			}
			setDesignDocumentsLoading(false);
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
		return <NotFoundState domainId={id} srfId={srfId} error={error} />;
	}

	return (
		<PageLayout>
			{/* パンくずリスト */}
			<Breadcrumb className="mb-4">
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink asChild>
							<Link href="/system">システム領域一覧</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink asChild>
							<Link href={`/system/${id}`}>システム機能一覧</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage className="font-semibold text-slate-900">システム機能詳細</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			{/* タイトルとAIボタン */}
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-[32px] font-semibold tracking-tight text-slate-900">
					システム機能詳細
				</h1>
				<Link href={`/chat?screen=SF&sdId=${id}&sfId=${srfId}`}>
					<Button className="h-8 gap-2 text-[14px] bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white">
						<Sparkles className="h-4 w-4" />
						AIで追加
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
					<div className="flex items-center justify-between border-l-4 border-brand-600 pl-3">
						<h2 className="text-[18px] font-semibold text-slate-900">
							システム要件
						</h2>
						<Link href={`/system/${id}/${srfId}/edit/requirements`}>
							<Button variant="ghost" size="sm" className="h-7 gap-1.5 text-[12px] hover:bg-slate-100 transition-colors">
								<Pencil className="h-3.5 w-3.5" />
								編集
							</Button>
						</Link>
					</div>
					<SystemRequirementsSection srfId={srf.id} />
				</section>
				<section className="space-y-4">
					<div className="flex items-center justify-between border-l-4 border-brand-600 pl-3">
						<h2 className="text-[18px] font-semibold text-slate-900">
							DD（Design Document）
						</h2>
						<Link href={`/system/${id}/${srfId}/edit/design-documents`}>
							<Button variant="ghost" size="sm" className="h-7 gap-1.5 text-[12px] hover:bg-slate-100 transition-colors">
								<Pencil className="h-3.5 w-3.5" />
								編集
							</Button>
						</Link>
					</div>
					<DesignDocumentSection
						items={designDocuments}
						loading={designDocumentsLoading}
						error={designDocumentsError}
						srfId={srf.id}
						systemDomainId={id}
					/>
				</section>
			</div>
		</PageLayout>
	);
}
