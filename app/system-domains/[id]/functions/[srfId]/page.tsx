"use client";

import { ArrowLeft, ExternalLink, Github, Pencil } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSrfRelatedRequirements } from "@/lib/mock/data";
import type { SystemFunction, SystemDesignItem, RelatedRequirementInfo } from "@/lib/mock/data/types";
import type { CodeRef } from "@/lib/mock/task-knowledge";
import { getSystemFunctionById, getDesignCategoryLabel } from "@/lib/data/system-functions";

// ============================================================
// Sub-components
// ============================================================

interface SectionCardProps {
	title: string;
	children: React.ReactNode;
}

function SectionCard({ title, children }: SectionCardProps) {
	return (
		<Card className="mt-4 rounded-md border border-slate-200/60 bg-white hover:border-slate-300/60 transition-colors">
			<div className="px-4 py-2.5 border-b border-slate-100">
				<h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
			</div>
			<CardContent className="p-4">{children}</CardContent>
		</Card>
	);
}

function EmptyState({ message }: { message: string }) {
	return <div className="text-[13px] text-slate-500">{message}</div>;
}

// ------------------------------------------------------------
// Basic Info Section
// ------------------------------------------------------------

interface BasicInfoSectionProps {
	srf: SystemFunction;
}

function BasicInfoSection({ srf }: BasicInfoSectionProps) {
	return (
		<Card className="rounded-md border border-slate-200/60 bg-white hover:border-slate-300/60 transition-colors">
			<CardContent className="p-0">
				<div className="px-4 py-2.5 border-b border-slate-100">
					<h2 className="text-[15px] font-semibold text-slate-900">基本情報</h2>
				</div>
				<div className="p-4 space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						<InfoBox label="システム機能ID" value={srf.id} mono />
						<InfoBox label="設計書No" value={srf.designDocNo} />
					</div>

					<div className="flex gap-3">
						<LabeledBadge label="機能分類" value={srf.category} />
						<LabeledBadge label="ステータス" value={srf.status} />
					</div>

					<div className="space-y-1.5">
						<SectionLabel>機能概要</SectionLabel>
						<div className="text-[13px] text-slate-700 leading-relaxed">
							{srf.summary}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function InfoBox({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
	return (
		<div className="rounded-md border border-slate-200 bg-slate-50/50 p-3">
			<SectionLabel>{label}</SectionLabel>
			<div className={`mt-1 text-[${mono ? "14" : "13"}px] font-semibold text-slate-900 ${mono ? "font-mono" : ""}`}>
				{value}
			</div>
		</div>
	);
}

function LabeledBadge({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<SectionLabel className="mb-1.5">{label}</SectionLabel>
			<Badge
				variant="outline"
				className="border-slate-200/60 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5"
			>
				{value}
			</Badge>
		</div>
	);
}

function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
	return (
		<div className={`text-[11px] font-semibold text-slate-400 uppercase tracking-wide ${className}`}>
			{children}
		</div>
	);
}

// ------------------------------------------------------------
// System Requirements Section
// ------------------------------------------------------------

interface SystemRequirementsSectionProps {
	srfId: string;
}

function SystemRequirementsSection({ srfId }: SystemRequirementsSectionProps) {
	const relatedReqs = getSrfRelatedRequirements(srfId);

	return (
		<SectionCard title="システム要件">
			{relatedReqs.length === 0 ? (
				<EmptyState message="まだ登録されていません。" />
			) : (
				<div className="space-y-3">
					{relatedReqs.map((req) => (
						<RequirementItem key={req.systemReqId} req={req} />
					))}
				</div>
			)}
		</SectionCard>
	);
}

interface RequirementItemProps {
	req: RelatedRequirementInfo;
}

function RequirementItem({ req }: RequirementItemProps) {
	return (
		<div className="rounded-md border border-slate-200 bg-slate-50/50 p-3">
			<div className="flex items-center gap-2 mb-2">
				<Badge className="border-blue-200/60 bg-blue-50 text-blue-700 text-[12px] font-medium px-2 py-0.5">
					{req.systemReqId}
				</Badge>
				<span className="text-[13px] font-medium text-slate-900">
					{req.systemReqTitle}
				</span>
			</div>

			{req.systemReqSummary && (
				<div className="text-[13px] text-slate-600 mb-2 ml-1">
					{req.systemReqSummary}
				</div>
			)}

			{req.systemReqConcepts && req.systemReqConcepts.length > 0 && (
				<BadgeList label="関連概念">
					{req.systemReqConcepts.map((concept) => (
						<Link key={concept.id} href={`/ideas/${concept.id}`}>
							<Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] hover:bg-slate-100">
								{concept.name}
							</Badge>
						</Link>
					))}
				</BadgeList>
			)}

			{req.systemReqImpacts && req.systemReqImpacts.length > 0 && (
				<BadgeList label="影響領域">
					{req.systemReqImpacts.map((impact, i) => (
						<Badge key={i} variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px]">
							{impact}
						</Badge>
					))}
				</BadgeList>
			)}

			{req.systemReqAcceptanceCriteria && req.systemReqAcceptanceCriteria.length > 0 && (
				<div className="ml-1 mb-2">
					<div className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1">
						受入条件
					</div>
					<ul className="list-disc pl-5 text-[13px] text-slate-700 space-y-0.5">
						{req.systemReqAcceptanceCriteria.map((ac, i) => (
							<li key={i}>{ac}</li>
						))}
					</ul>
				</div>
			)}

			<BusinessRequirementLink req={req} />
		</div>
	);
}

function BadgeList({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="ml-1 mb-2">
			<div className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1">
				{label}
			</div>
			<div className="flex flex-wrap gap-1.5">{children}</div>
		</div>
	);
}

function BusinessRequirementLink({ req }: { req: RelatedRequirementInfo }) {
	return (
		<div className="ml-1 pl-3 border-l-2 border-slate-200">
			<Link
				href={`/business/${req.businessId}/tasks/${req.taskId}`}
				className="block hover:bg-slate-100/50 rounded px-2 py-1 -ml-2 transition-colors"
			>
				<div className="flex items-center gap-2">
					<Badge
						variant="outline"
						className="border-emerald-200/60 bg-emerald-50 text-emerald-700 text-[12px] font-medium px-2 py-0.5"
					>
						{req.businessReqId}
					</Badge>
					<span className="text-[13px] text-slate-700">
						{req.businessReqTitle}
					</span>
					<ExternalLink className="h-3 w-3 text-slate-400 ml-auto" />
				</div>
			</Link>
		</div>
	);
}

// ------------------------------------------------------------
// System Design Section
// ------------------------------------------------------------

interface SystemDesignSectionProps {
	systemDesign: SystemDesignItem[];
}

function SystemDesignSection({ systemDesign }: SystemDesignSectionProps) {
	return (
		<SectionCard title="システム設計">
			{systemDesign.length === 0 ? (
				<EmptyState message="まだ登録されていません。" />
			) : (
				<div className="space-y-3">
					{systemDesign.map((item) => (
						<DesignItem key={item.id} item={item} />
					))}
				</div>
			)}
		</SectionCard>
	);
}

function DesignItem({ item }: { item: SystemDesignItem }) {
	return (
		<div className="rounded-md border border-slate-200 bg-slate-50/50 p-3">
			<div className="flex items-center gap-2 mb-2">
				<Badge
					variant="outline"
					className="border-slate-200/60 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5"
				>
					{getDesignCategoryLabel(item.category)}
				</Badge>
				<span className="text-[11px] text-slate-400 font-mono">{item.id}</span>
				{item.priority === "high" && (
					<Badge className="border-red-200/60 bg-red-50 text-red-700 text-[11px] font-medium px-2 py-0.5">
						重要
					</Badge>
				)}
			</div>
			<div className="text-[13px] font-medium text-slate-900 mb-1">
				{item.title}
			</div>
			<div className="text-[13px] text-slate-600 leading-relaxed">
				{item.description}
			</div>
		</div>
	);
}

// ------------------------------------------------------------
// Implementation Section
// ------------------------------------------------------------

interface ImplementationSectionProps {
	codeRefs: CodeRef[];
}

function ImplementationSection({ codeRefs }: ImplementationSectionProps) {
	return (
		<SectionCard title="実装">
			{codeRefs.length === 0 ? (
				<EmptyState message="まだ登録されていません。" />
			) : (
				<div className="space-y-3">
					{codeRefs.map((ref, index) => (
						<CodeRefItem key={index} codeRef={ref} />
					))}
				</div>
			)}
		</SectionCard>
	);
}

function CodeRefItem({ codeRef }: { codeRef: CodeRef }) {
	return (
		<div className="rounded-md border border-slate-200 bg-white p-3">
			<div className="space-y-2">
				{codeRef.paths.map((path, i) => (
					<div key={i} className="rounded-md bg-slate-50 p-3">
						<code className="text-[13px] text-slate-800 font-mono">{path}</code>
					</div>
				))}
			</div>
		</div>
	);
}

// ============================================================
// Page Layout Components
// ============================================================

interface PageLayoutProps {
	children: React.ReactNode;
}

function PageLayout({ children }: PageLayoutProps) {
	return (
		<>
			<Sidebar />
			<div className="ml-[280px] flex-1 min-h-screen bg-white">
				<div className="mx-auto max-w-[1400px] px-8 py-4">{children}</div>
			</div>
		</>
	);
}

function LoadingState() {
	return (
		<PageLayout>
			<div className="text-slate-500">読み込み中...</div>
		</PageLayout>
	);
}

interface NotFoundStateProps {
	domainId: string;
	error: string | null;
}

function NotFoundState({ domainId, error }: NotFoundStateProps) {
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
}) {
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
			<PageTitle srfId={srf.id} />
			<BasicInfoSection srf={srf} />
			<SystemRequirementsSection srfId={srf.id} />
			<SystemDesignSection systemDesign={srf.systemDesign} />
			<ImplementationSection codeRefs={srf.codeRefs} />
		</PageLayout>
	);
}

interface PageHeaderProps {
	domainId: string;
	srfId: string;
}

function PageHeader({ domainId, srfId }: PageHeaderProps) {
	return (
		<div className="flex items-center justify-between mb-4">
			<Link
				href={`/system-domains/${domainId}`}
				className="inline-flex items-center gap-2 text-[14px] font-medium text-slate-600 hover:text-slate-900"
			>
				<ArrowLeft className="h-4 w-4" />
				システム機能一覧に戻る
			</Link>
			<Link href={`/system-domains/${domainId}/functions/${srfId}/edit`}>
				<Button variant="outline" className="h-8 gap-2 text-[14px]">
					<Pencil className="h-4 w-4" />
					編集
				</Button>
			</Link>
		</div>
	);
}

function PageTitle({ srfId }: { srfId: string }) {
	return (
		<div className="mb-4">
			<h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-2">
				システム機能: {srfId}
			</h1>
			<p className="text-[13px] text-slate-500">システム機能の詳細情報</p>
		</div>
	);
}
