"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { parseYamlIdList } from "@/lib/utils/yaml";
import type { BusinessRequirement } from "@/lib/data/business-requirements";

type BusinessRequirementCardProps = {
  requirement: BusinessRequirement;
  conceptMap: Map<string, string>;
  systemFunctionMap: Map<string, string>;
  systemFunctionDomainMap: Map<string, string | null>;
  systemDomainMap: Map<string, string>;
  optionsError: string | null;
  relatedSystemRequirements: import("@/lib/data/system-requirements").SystemRequirement[];
};

export function BusinessRequirementCard({
  requirement,
  conceptMap,
  systemFunctionMap,
  systemFunctionDomainMap,
  systemDomainMap,
  optionsError,
  relatedSystemRequirements,
}: BusinessRequirementCardProps) {
  const [isOpen, setIsOpen] = useState(true);

  // 関連するシステム要件の概要を抽出
  const relatedSystemRequirementSummaries = useMemo(() => {
    if (requirement.srfIds.length === 0 || relatedSystemRequirements.length === 0) return [];
    return relatedSystemRequirements
      .filter(sr => sr.srfIds.some(srfId => requirement.srfIds.includes(srfId)))
      .map(sr => sr.summary)
      .filter(Boolean);
  }, [requirement.srfIds, relatedSystemRequirements]);

  const firstSummary = relatedSystemRequirementSummaries[0] ?? "";
  const summaryCount = relatedSystemRequirementSummaries.length;
  const displayGoal = requirement.goal || requirement.summary;
  const constraints = parseYamlIdList(requirement.constraints ?? "");
  const constraintItems = constraints.value;

  return (
    <Collapsible
      id={requirement.id}
      open={isOpen}
      onOpenChange={setIsOpen}
      className="rounded-md border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-colors p-4"
    >
      <CollapsibleTrigger className="flex flex-wrap items-start justify-between gap-2 mb-3 w-full text-left hover:bg-slate-50/50 rounded px-2 -mx-2 py-1 transition-colors cursor-pointer">
        <div className="flex-1">
          <div className="font-mono text-[11px] text-slate-400">{requirement.id}</div>
          <div className="text-[14px] font-medium text-slate-900 mt-1">{requirement.title}</div>
          {displayGoal && (
            <div className="mt-2 text-[13px] text-slate-700">
              <MarkdownRenderer content={displayGoal} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] font-medium px-2.5 py-1">
            業務要件
          </Badge>
          <ChevronDown strokeWidth={1} className={`h-8 w-8 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-3">
        {optionsError && (
          <div className="text-[12px] text-rose-600">{optionsError}</div>
        )}

      {requirement.owner && (
        <div className="border-t border-slate-100 pt-3 space-y-2">
          <div className="text-[12px] font-medium text-slate-500">owner</div>
          <div className="text-[13px] text-slate-700">{requirement.owner}</div>
        </div>
      )}

      {constraintItems.length > 0 && (
        <div className="border-t border-slate-100 pt-3 space-y-2">
          <div className="text-[12px] font-medium text-slate-500">constraints</div>
          <ul className="list-disc pl-4 text-[13px] text-slate-700 space-y-1">
            {constraintItems.map((item, index) => (
              <li key={`${requirement.id}-constraint-${index}`}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {requirement.conceptIds.length > 0 && (
        <div className="border-t border-slate-100 pt-3 space-y-2">
          <div className="text-[12px] font-medium text-slate-500">関連概念</div>
          <div className="flex flex-wrap gap-2">
            {requirement.conceptIds.map((conceptId) => (
              <Link key={conceptId} href={`/ideas/${conceptId}`}>
                <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] hover:bg-slate-100 px-2.5 py-1">
                  {conceptMap.get(conceptId) ?? conceptId}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {requirement.srfIds.length > 0 && (
        <div className="border-t border-slate-100 pt-3 space-y-2">
          <div className="text-[12px] font-medium text-slate-500">関連システム機能</div>
          <div className="flex flex-wrap gap-2">
            {requirement.srfIds.map((srfId) => {
              const srfName = systemFunctionMap.get(srfId) ?? srfId;
              const srfDomainId = systemFunctionDomainMap.get(srfId);
              return (
                <Link key={srfId} href={srfDomainId ? `/system-domains/${srfDomainId}/${srfId}` : "/system-domains"}>
                  <Badge
                    variant="outline"
                    className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] hover:bg-slate-100 max-w-[200px] truncate px-2.5 py-1"
                    title={
                      summaryCount > 1
                        ? `${firstSummary}\n\n（他${summaryCount - 1}件の要件があります）`
                        : firstSummary || srfName || undefined
                    }
                  >
                    {srfName}
                  </Badge>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {requirement.systemDomainIds.length > 0 && (
        <div className="border-t border-slate-100 pt-3 space-y-2">
          <div className="text-[12px] font-medium text-slate-500">システム領域</div>
          <div className="flex flex-wrap gap-2">
            {requirement.systemDomainIds.map((domainId) => (
              <Badge key={domainId} variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] px-2.5 py-1">
                {systemDomainMap.get(domainId) ?? domainId}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {relatedSystemRequirements.length > 0 && (
        <div className="border-t border-slate-100 pt-3 space-y-2">
          <div className="text-[12px] font-medium text-slate-500">関連システム要件</div>
          <div className="flex flex-wrap gap-2">
            {relatedSystemRequirements.map((sr) => {
              const srDomainId = sr.srfIds.length > 0 ? systemFunctionDomainMap.get(sr.srfIds[0]) : null;
              const srSrfId = sr.srfIds.length > 0 ? sr.srfIds[0] : null;
              return (
                <Link key={sr.id} href={srDomainId && srSrfId ? `/system-domains/${srDomainId}/${srSrfId}` : "/system-domains"}>
                  <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] hover:bg-slate-100 max-w-[200px] truncate px-2.5 py-1" title={sr.title ?? undefined}>
                    {sr.title}
                  </Badge>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      </CollapsibleContent>
    </Collapsible>
  );
}
