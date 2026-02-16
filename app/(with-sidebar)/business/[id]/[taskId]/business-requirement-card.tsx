"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { Badge } from "@/components/ui/badge";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ConceptBadge } from "@/components/ui/concept-badge";
import { FieldLabel } from "@/components/ui/field-label";
import { IdNameBadge } from "@/components/ui/id-name-badge";
import type { BusinessRequirement } from "@/lib/data/business-requirements";
import { cn } from "@/lib/utils";
import { parseYamlIdList } from "@/lib/utils/yaml";

type BusinessRequirementCardProps = {
	requirement: BusinessRequirement;
	conceptMap: Map<string, string>;
	systemFunctionMap: Map<string, string>;
	systemFunctionDomainMap: Map<string, string | null>;
	optionsError: string | null;
	relatedSystemRequirements: import("@/lib/data/system-requirements").SystemRequirement[];
};

export function BusinessRequirementCard({
	requirement,
	conceptMap,
	systemFunctionMap,
	systemFunctionDomainMap,
	optionsError,
	relatedSystemRequirements,
}: BusinessRequirementCardProps) {
	const [isOpen, setIsOpen] = useState(false);

	const displayGoal = requirement.goal || requirement.summary;
	const constraints = parseYamlIdList(requirement.constraints ?? "");
	const constraintItems = constraints.value;

	return (
		<Collapsible id={requirement.id} open={isOpen} onOpenChange={setIsOpen}>
			<div className="rounded-md border border-slate-200 bg-white shadow-sm">
				<CollapsibleTrigger className="w-full flex flex-wrap items-start justify-between gap-3 px-4 py-4 hover:bg-slate-50/50 cursor-pointer transition-colors">
					<div className="flex items-center gap-2 flex-wrap flex-1">
						<Badge className="border-slate-200/60 bg-slate-50 text-slate-600 text-[12px] font-medium px-2.5 py-1 font-mono">
							{requirement.id}
						</Badge>
						<Badge
							variant="outline"
							className="border-emerald-200 bg-emerald-50 text-emerald-700 text-[12px] font-medium px-2.5 py-1"
						>
							業務要件
						</Badge>
						<span className="text-[14px] font-semibold text-slate-900">
							{requirement.title || "名称未設定"}
						</span>
					</div>
					<div className="flex items-center gap-2">
						<ChevronDown
							className={cn(
								"h-5 w-5 text-slate-400 transition-transform duration-200",
								isOpen ? "rotate-180" : "",
							)}
						/>
					</div>
				</CollapsibleTrigger>

				<CollapsibleContent className="p-4 space-y-3">
					{optionsError && (
						<div className="text-[12px] text-rose-600">{optionsError}</div>
					)}

					{displayGoal && (
						<div className="text-[15px] font-medium text-slate-700 leading-relaxed">
							<MarkdownRenderer content={displayGoal} />
						</div>
					)}

					{requirement.owner && (
						<div className="flex gap-4">
							<div className="w-20 flex-shrink-0">
								<FieldLabel>オーナー</FieldLabel>
							</div>
							<div className="flex-1 text-[13px] text-slate-600">
								{requirement.owner}
							</div>
						</div>
					)}

					{constraintItems.length > 0 && (
						<div className="flex gap-4">
							<div className="w-20 flex-shrink-0">
								<FieldLabel>制約条件</FieldLabel>
							</div>
							<div className="flex-1">
								<ul className="list-disc pl-4 text-[13px] text-slate-600 space-y-1">
									{constraintItems.map((item, index) => {
										const lines = item.split("\n");
										return (
											<li key={`${requirement.id}-constraint-${index}`}>
												{lines.map((line, lineIndex) => (
													<span
														key={`${requirement.id}-constraint-${index}-line-${lineIndex}`}
													>
														{line}
														{lineIndex < lines.length - 1 && <br />}
													</span>
												))}
											</li>
										);
									})}
								</ul>
							</div>
						</div>
					)}

					{requirement.conceptIds.length > 0 && (
						<div className="flex gap-4">
							<div className="w-20 flex-shrink-0">
								<FieldLabel>関連概念</FieldLabel>
							</div>
							<div className="flex-1 flex flex-wrap gap-2">
								{requirement.conceptIds.map((conceptId) => (
									<ConceptBadge
										key={conceptId}
										id={conceptId}
										name={conceptMap.get(conceptId)}
										href={`/ideas/${conceptId}`}
									/>
								))}
							</div>
						</div>
					)}

					{requirement.srfIds.length > 0 && (
						<div className="flex gap-4">
							<div className="w-20 flex-shrink-0">
								<FieldLabel>システム機能</FieldLabel>
							</div>
							<div className="flex-1 flex flex-wrap gap-2">
								{requirement.srfIds.map((srfId) => {
									const srfDomainId = systemFunctionDomainMap.get(srfId);
									const href = srfDomainId
										? `/system/${srfDomainId}/${srfId}`
										: "/system";
									return (
										<IdNameBadge
											key={srfId}
											id={srfId}
											name={systemFunctionMap.get(srfId)}
											href={href}
										/>
									);
								})}
							</div>
						</div>
					)}

					{relatedSystemRequirements.length > 0 && (
						<div className="flex gap-4">
							<div className="w-20 flex-shrink-0">
								<FieldLabel>システム要件</FieldLabel>
							</div>
							<div className="flex-1 flex flex-wrap gap-1.5">
								{relatedSystemRequirements.map((sr) => {
									const srDomainId =
										sr.srfIds.length > 0
											? systemFunctionDomainMap.get(sr.srfIds[0])
											: null;
									const srSrfId = sr.srfIds.length > 0 ? sr.srfIds[0] : null;
									return (
										<Link
											key={sr.id}
											href={
												srDomainId && srSrfId
													? `/system/${srDomainId}/${srSrfId}`
													: "/system"
											}
										>
											<Badge
												variant="outline"
												className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] hover:bg-slate-100 max-w-[200px] truncate"
												title={sr.title ?? undefined}
											>
												{sr.title}
											</Badge>
										</Link>
									);
								})}
							</div>
						</div>
					)}
				</CollapsibleContent>
			</div>
		</Collapsible>
	);
}
