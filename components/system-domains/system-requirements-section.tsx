"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { SectionCard, EmptyState, SectionLabel } from "./section-card";
import { useRelatedRequirements } from "@/hooks/use-related-requirements";
import type { RelatedRequirementInfo } from "@/lib/domain";
import { CardSkeleton } from "@/components/skeleton";
import { AcceptanceCriteriaDisplay } from "@/components/forms/AcceptanceCriteriaDisplay";

interface SystemRequirementsSectionProps {
	srfId: string;
}

export function SystemRequirementsSection({ srfId }: SystemRequirementsSectionProps): React.ReactNode {
	const { data: relatedReqs, loading, error } = useRelatedRequirements(srfId);

	if (loading) {
		return (
			<SectionCard title="システム要件">
				<CardSkeleton />
			</SectionCard>
		);
	}

	if (error) {
		return (
			<SectionCard title="システム要件">
				<div className="text-[13px] text-rose-600">{error}</div>
			</SectionCard>
		);
	}

	return (
		<SectionCard title="システム要件" count={relatedReqs.length}>
			{relatedReqs.length === 0 ? (
				<EmptyState message="まだ登録されていません。" />
			) : (
				<div className="space-y-4">
					{relatedReqs.map((req) => (
						<RequirementItem key={`${req.systemReqId}:${req.businessReqId || "none"}`} req={req} />
					))}
				</div>
			)}
		</SectionCard>
	);
}

function RequirementItem({ req }: { req: RelatedRequirementInfo }): React.ReactNode {
	return (
		<div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
			<div className="flex flex-wrap items-start justify-between gap-3 mb-4">
				<div className="flex items-center gap-2 flex-wrap">
					<Badge className="border-blue-200/60 bg-blue-50 text-blue-700 text-[12px] font-medium px-2.5 py-1">
						{req.systemReqId}
					</Badge>
					<span className="text-[14px] font-semibold text-slate-900">
						{req.systemReqTitle || "名称未設定"}
					</span>
				</div>
				<span className="text-[11px] text-slate-400 uppercase tracking-wide">
					SR
				</span>
			</div>

			<div className="space-y-3">
				{req.systemReqSummary && (
					<div className="text-[13px] text-slate-600 leading-relaxed">
						{req.systemReqSummary}
					</div>
				)}

				{req.systemReqConcepts && req.systemReqConcepts.length > 0 && (
					<BadgeList label="関連概念">
						{req.systemReqConcepts.map((concept) => (
							<Link key={concept.id} href={`/ideas/${concept.id}`}>
								<Badge
									variant="outline"
									className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] hover:bg-slate-100"
								>
									{concept.name}
								</Badge>
							</Link>
						))}
					</BadgeList>
				)}

				{req.systemReqImpacts && req.systemReqImpacts.length > 0 && (
					<BadgeList label="影響領域">
						{req.systemReqImpacts.map((impact, i) => (
							<Badge
								key={i}
								variant="outline"
								className="border-slate-200 bg-slate-50 text-slate-600 text-[12px]"
							>
								{impact}
							</Badge>
						))}
					</BadgeList>
				)}

				{req.systemReqAcceptanceCriteriaJson && req.systemReqAcceptanceCriteriaJson.length > 0 && (
					<div className="border-t border-slate-100 pt-3 space-y-2">
						<div className="text-[12px] font-medium text-slate-500">受入条件</div>
						<AcceptanceCriteriaDisplay
							items={req.systemReqAcceptanceCriteriaJson}
							emptyMessage="未登録"
						/>
					</div>
				)}
			</div>

			<div className="mt-4">
				<BusinessRequirementLink req={req} />
			</div>
		</div>
	);
}

function BadgeList({ label, children }: { label: string; children: React.ReactNode }): React.ReactNode {
	return (
		<div>
			<SectionLabel className="mb-1">{label}</SectionLabel>
			<div className="flex flex-wrap gap-1.5">{children}</div>
		</div>
	);
}

function BusinessRequirementLink({ req }: { req: RelatedRequirementInfo }): React.ReactNode {
	const relatedBusinessReqs =
		req.relatedBusinessReqs && req.relatedBusinessReqs.length > 0
			? req.relatedBusinessReqs
			: req.businessReqId
				? [
					{
						id: req.businessReqId,
						title: req.businessReqTitle,
						taskId: req.taskId,
						businessId: req.businessId,
					},
				]
				: [];

	if (relatedBusinessReqs.length === 0) {
		return (
			<div className="rounded-md border border-slate-200 bg-slate-50/70 p-3 text-[12px] text-slate-500">
				<SectionLabel className="mb-2">関連業務要件</SectionLabel>
				関連業務要件が未設定です。
			</div>
		);
	}

	return (
		<div className="rounded-md border border-slate-200 bg-slate-50/70 p-3">
			<SectionLabel className="mb-2">関連業務要件</SectionLabel>
			<div className="space-y-1.5">
				{relatedBusinessReqs.map((bizReq) => {
					const hasLink = bizReq.businessId && bizReq.taskId;
					const content = (
						<div className="flex items-center gap-2">
							<Badge
								variant="outline"
								className="border-emerald-200/60 bg-emerald-50 text-emerald-700 text-[12px] font-medium px-2.5 py-1"
							>
								{bizReq.id}
							</Badge>
							<span className="text-[13px] text-slate-700">
								{bizReq.title || "名称未設定"}
							</span>
							{hasLink && <ExternalLink className="h-3 w-3 text-slate-400 ml-auto" />}
						</div>
					);

					if (!hasLink) {
						return (
							<div key={bizReq.id} className="rounded px-2 py-1 text-[12px] text-slate-600">
								{content}
							</div>
						);
					}

					return (
						<Link
							key={bizReq.id}
							href={`/business/${bizReq.businessId}/${bizReq.taskId}`}
							className="block rounded px-2 py-1 hover:bg-slate-100/70 transition-colors"
						>
							{content}
						</Link>
					);
				})}
			</div>
		</div>
	);
}
