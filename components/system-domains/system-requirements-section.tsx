"use client";

import { useState } from "react";
import { ExternalLink, ChevronDown } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { SectionCard, EmptyState, SectionLabel } from "./section-card";
import { useRelatedRequirements } from "@/hooks/use-related-requirements";
import type { RelatedRequirementInfo } from "@/lib/domain";
import { CardSkeleton } from "@/components/skeleton";
import { AcceptanceCriteriaDisplay } from "@/components/forms/AcceptanceCriteriaDisplay";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { SuspectLinkBadge } from "@/components/requirement-links/suspect-link-badge";

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
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen}>
			<div className="rounded-md border border-slate-200 bg-white shadow-sm">
				<CollapsibleTrigger className="w-full flex flex-wrap items-start justify-between gap-3 px-4 py-4 hover:bg-slate-50/50 cursor-pointer transition-colors">
					<div className="flex items-center gap-2 flex-wrap">
						<Badge className="border-blue-200/60 bg-blue-50 text-blue-700 text-[12px] font-medium px-2.5 py-1">
							{req.systemReqId}
						</Badge>
						<span className="text-[14px] font-semibold text-slate-900">
							{req.systemReqTitle || "名称未設定"}
						</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-[11px] text-slate-400 uppercase tracking-wide">
							SR
						</span>
						<ChevronDown
							className={cn(
								"h-5 w-5 text-slate-400 transition-transform duration-200",
								isOpen ? "rotate-180" : ""
							)}
						/>
					</div>
				</CollapsibleTrigger>

				<CollapsibleContent className="p-5">
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
				</CollapsibleContent>
			</div>
		</Collapsible>
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
						businessArea: req.businessArea ?? null,
						suspect: false,
						suspectReason: null,
					},
				]
				: [];

	if (relatedBusinessReqs.length === 0) {
		return (
			<div className="border-t border-slate-100 pt-3 text-[12px] text-slate-500">
				<div className="text-[12px] font-medium text-slate-500 mb-2">関連業務要件</div>
				関連業務要件が未設定です。
			</div>
		);
	}

	return (
		<div className="border-t border-slate-100 pt-3">
			<div className="text-[12px] font-medium text-slate-500 mb-2">関連業務要件</div>
			<div className="space-y-1.5">
				{relatedBusinessReqs.map((bizReq) => {
					const businessArea = bizReq.businessArea ?? req.businessArea ?? "";
					const hasLink = businessArea.length > 0 && !!bizReq.taskId;
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
							{/* 疑義バッジ（Phase 4.6で追加） */}
							{bizReq.suspect && (
								<SuspectLinkBadge
									suspect={bizReq.suspect}
									suspectReason={bizReq.suspectReason}
									size="sm"
								/>
							)}
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
							href={`/business/${businessArea}/${bizReq.taskId}`}
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
