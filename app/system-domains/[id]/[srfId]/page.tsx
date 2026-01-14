"use client";

import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	BasicInfoSection,
	SystemRequirementsSection,
	SystemDesignSection,
	ImplementationSection,
} from "@/components/system-domains";
import type { SystemFunction } from "@/lib/mock/data/types";
import { getSystemFunctionById } from "@/lib/data/system-functions";
import { PageHeaderSkeleton, CardSkeleton } from "@/components/skeleton";

// ============================================================
// Page Layout Components
// ============================================================

function PageLayout({ children }: { children: React.ReactNode }): React.ReactNode {
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

function NotFoundState({ domainId, error }: NotFoundStateProps): React.ReactNode {
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

interface PageHeaderProps {
	domainId: string;
	srfId: string;
}

function PageHeader({ domainId, srfId }: PageHeaderProps): React.ReactNode {
	return (
		<div className="flex items-center justify-between mb-4">
			<Link
				href={`/system-domains/${domainId}`}
				className="inline-flex items-center gap-2 text-[14px] font-medium text-slate-600 hover:text-slate-900"
			>
				<ArrowLeft className="h-4 w-4" />
				システム機能一覧に戻る
			</Link>
			<Link href={`/system-domains/${domainId}/${srfId}/edit`}>
				<Button variant="outline" className="h-8 gap-2 text-[14px]">
					<Pencil className="h-4 w-4" />
					編集
				</Button>
			</Link>
		</div>
	);
}

function PageTitle({ srf }: { srf: SystemFunction }): React.ReactNode {
	return (
		<div className="mb-4">
			<h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-2">
				{srf.title}
			</h1>
			<p className="text-[13px] text-slate-500">システム機能: {srf.id}</p>
		</div>
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

	if (loading) {
		return <LoadingState />;
	}

	if (!srf) {
		return <NotFoundState domainId={id} error={error} />;
	}

	return (
		<PageLayout>
			<PageHeader domainId={id} srfId={srfId} />
			<PageTitle srf={srf} />
			<BasicInfoSection srf={srf} />
			<SystemRequirementsSection srfId={srf.id} />
			<SystemDesignSection systemDesign={srf.systemDesign} />
			<ImplementationSection codeRefs={srf.codeRefs} />
		</PageLayout>
	);
}
