"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { SectionCard, EmptyState } from "./section-card";
import { useRelatedRequirements } from "@/hooks/use-related-requirements";
import type { RelatedRequirementInfo } from "@/lib/domain";

interface SystemRequirementsSectionProps {
	srfId: string;
}

export function SystemRequirementsSection({ srfId }: SystemRequirementsSectionProps): React.ReactNode {
	const { data: relatedReqs, loading, error } = useRelatedRequirements(srfId);

	if (loading) {
		return (
			<SectionCard title="システム要件">
				<div className="text-[13px] text-slate-500">読み込み中...</div>
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
				<div className="space-y-3">
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

function BadgeList({ label, children }: { label: string; children: React.ReactNode }): React.ReactNode {
	return (
		<div className="ml-1 mb-2">
			<div className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1">
				{label}
			</div>
			<div className="flex flex-wrap gap-1.5">{children}</div>
		</div>
	);
}

function BusinessRequirementLink({ req }: { req: RelatedRequirementInfo }): React.ReactNode {
	if (!req.businessReqId || !req.businessId || !req.taskId) {
		return (
			<div className="ml-1 pl-3 border-l-2 border-slate-200 text-[12px] text-slate-500">
				関連業務要件が未設定です。
			</div>
		);
	}

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
