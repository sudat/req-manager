"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AcceptanceCriteriaDisplay } from "@/components/forms/AcceptanceCriteriaDisplay";
import type { SystemRequirement } from "@/lib/data/system-requirements";

type SystemRequirementCardProps = {
	requirement: SystemRequirement;
	conceptMap: Map<string, string>;
	systemFunctions: { id: string; name: string; systemDomainId: string | null }[];
	systemFunctionDomainMap: Map<string, string | null>;
	businessRequirementMap: Map<string, string>;
};

export function SystemRequirementCard({
	requirement,
	conceptMap,
	systemFunctions,
	systemFunctionDomainMap,
	businessRequirementMap,
}: SystemRequirementCardProps) {
	const [isOpen, setIsOpen] = useState(true);
	const srf = requirement.srfId ? systemFunctions.find((srf) => srf.id === requirement.srfId) : undefined;
	const srfSummaryShort = srf?.name ?? "";
	const missingBusinessRequirementIds = requirement.businessRequirementIds.filter(
		(id) => !businessRequirementMap.has(id)
	);

	// conceptIdsからconceptsに変換
	const concepts = requirement.conceptIds.map((id) => ({
		id,
		name: conceptMap.get(id) ?? id,
	}));

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="rounded-md border border-slate-200 bg-slate-50/50 p-3"
    >
      <CollapsibleTrigger className="flex flex-wrap items-start justify-between gap-2 mb-2 w-full text-left hover:bg-white/50 rounded px-2 -mx-2 py-1 transition-colors cursor-pointer">
        <div className="flex-1">
          <div className="font-mono text-[11px] text-slate-400">{requirement.id}</div>
          <div className="text-[14px] font-medium text-slate-900 mt-1">{requirement.title}</div>
          <div className="mt-1 text-[13px] text-slate-600">{requirement.summary}</div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-blue-200/60 bg-blue-50 text-blue-700 text-[12px] font-medium px-2 py-0.5">
            システム要件
          </Badge>
          <ChevronDown strokeWidth={1} className={`h-8 w-8 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-2">
      <div className="border-t border-slate-100 pt-2 mt-2 space-y-1">
        <div className="text-[12px] font-medium text-slate-500">カテゴリ</div>
        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px]">
          {requirement.category ?? "function"}
        </Badge>
      </div>

      {concepts && concepts.length > 0 && (
        <div className="border-t border-slate-100 pt-2 mt-2 space-y-1">
          <div className="text-[12px] font-medium text-slate-500">関連概念</div>
          <div className="flex flex-wrap gap-1.5">
            {concepts.map((concept) => (
              <Link key={concept.id} href={`/ideas/${concept.id}`}>
                <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] hover:bg-slate-100">
                  {concept.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {requirement.impacts && requirement.impacts.length > 0 && (
        <div className="border-t border-slate-100 pt-2 mt-2 space-y-1">
          <div className="text-[12px] font-medium text-slate-500">影響領域</div>
          <div className="flex flex-wrap gap-1.5">
            {requirement.impacts.map((impact) => (
              <Link key={impact} href={`/system-domains/${impact}`}>
                <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] hover:bg-slate-100">
                  {impact}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-slate-100 pt-2 mt-2 space-y-1">
        <div className="text-[12px] font-medium text-slate-500">受入条件</div>
        <AcceptanceCriteriaDisplay
          items={requirement.acceptanceCriteriaJson}
          emptyMessage="未登録"
        />
      </div>

      <div className="border-t border-slate-100 pt-2 mt-2 space-y-1">
        <div className="text-[12px] font-medium text-slate-500">関連業務要件</div>
        {requirement.businessRequirementIds.length === 0 ? (
          <div className="text-[13px] text-slate-400">未設定</div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {requirement.businessRequirementIds.map((bizId) => {
              const label = businessRequirementMap.get(bizId);
              return label ? (
                <Link key={bizId} href={`#${bizId}`}>
                  <Badge variant="outline" className="border-emerald-200/60 bg-emerald-50 text-emerald-700 text-[12px] hover:bg-emerald-100/60">
                    {label}
                  </Badge>
                </Link>
              ) : (
                <Badge
                  key={bizId}
                  variant="outline"
                  className="border-rose-200/60 bg-rose-50 text-rose-700 text-[12px]"
                >
                  未解決: {bizId}
                </Badge>
              );
            })}
          </div>
        )}
        {missingBusinessRequirementIds.length > 0 && (
          <div className="text-[12px] text-rose-600">
            存在しない業務要件ID: {missingBusinessRequirementIds.join(", ")}
          </div>
        )}
      </div>

      {srf && (
        <div className="border-t border-slate-100 pt-2 mt-2">
          <div className="text-[12px] font-medium text-slate-500 mb-1">関連システム機能</div>
          <div className="ml-1 pl-3 border-l-2 border-purple-200">
            <Link
              href={systemFunctionDomainMap.get(srf.id) ? `/system-domains/${systemFunctionDomainMap.get(srf.id)}/${srf.id}` : "/system-domains"}
              className="block hover:bg-purple-50/50 rounded px-2 py-1 -ml-2 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-purple-200/60 bg-purple-50 text-purple-700 text-[12px] font-medium px-2 py-0.5"
                >
                  {srf.id}
                </Badge>
                <span className="text-[13px] text-slate-700">
                  {srfSummaryShort}
                </span>
                <ExternalLink className="h-3 w-3 text-slate-400 ml-auto" />
              </div>
            </Link>
          </div>
        </div>
      )}
      </CollapsibleContent>
    </Collapsible>
  );
}
