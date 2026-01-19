"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AcceptanceCriteriaDisplay } from "@/components/forms/AcceptanceCriteriaDisplay";
import type { BusinessRequirement } from "@/lib/data/business-requirements";

type BusinessRequirementCardProps = {
  requirement: BusinessRequirement;
  conceptMap: Map<string, string>;
  systemFunctionMap: Map<string, string>;
  systemFunctionDomainMap: Map<string, string | null>;
  systemDomainMap: Map<string, string>;
  optionsError: string | null;
};

export function BusinessRequirementCard({
  requirement,
  conceptMap,
  systemFunctionMap,
  systemFunctionDomainMap,
  systemDomainMap,
  optionsError,
}: BusinessRequirementCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const srfId = requirement.srfId ?? null;
  const srfName = srfId ? systemFunctionMap.get(srfId) ?? srfId : null;
  const srfDomainId = srfId ? systemFunctionDomainMap.get(srfId) : null;

  return (
    <Collapsible
      id={requirement.id}
      open={isOpen}
      onOpenChange={setIsOpen}
      className="rounded-md border border-slate-200 p-3"
    >
      <CollapsibleTrigger className="flex flex-wrap items-start justify-between gap-2 mb-2 w-full text-left hover:bg-slate-50/50 rounded px-2 -mx-2 py-1 transition-colors cursor-pointer">
        <div className="flex-1">
          <div className="font-mono text-[11px] text-slate-400">{requirement.id}</div>
          <div className="text-[14px] font-medium text-slate-900 mt-1">{requirement.title}</div>
          <div className="mt-1 text-[13px] text-slate-600">{requirement.summary}</div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5">
            業務要件
          </Badge>
          <Badge variant="outline" className="border-emerald-200/60 bg-emerald-50 text-emerald-700 text-[12px] font-medium px-2 py-0.5">
            {requirement.priority ?? "Must"}
          </Badge>
          <ChevronDown strokeWidth={1} className={`h-8 w-8 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-2">
        {optionsError && (
          <div className="text-[12px] text-rose-600">{optionsError}</div>
        )}

      {requirement.conceptIds.length > 0 && (
        <div className="border-t border-slate-100 pt-2 mt-2 space-y-1">
          <div className="text-[12px] font-medium text-slate-500">関連概念</div>
          <div className="flex flex-wrap gap-1.5">
            {requirement.conceptIds.map((conceptId) => (
              <Link key={conceptId} href={`/ideas/${conceptId}`}>
                <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] hover:bg-slate-100">
                  {conceptMap.get(conceptId) ?? conceptId}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {srfId && srfName && (
        <div className="border-t border-slate-100 pt-2 mt-2 space-y-1">
          <div className="text-[12px] font-medium text-slate-500">関連システム機能</div>
          <div className="flex flex-wrap gap-1.5">
            <Link href={srfDomainId ? `/system-domains/${srfDomainId}/${srfId}` : "/system-domains"}>
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] hover:bg-slate-100">
                {srfName}
              </Badge>
            </Link>
          </div>
        </div>
      )}

      {requirement.systemDomainIds.length > 0 && (
        <div className="border-t border-slate-100 pt-2 mt-2 space-y-1">
          <div className="text-[12px] font-medium text-slate-500">システム領域</div>
          <div className="flex flex-wrap gap-1.5">
            {requirement.systemDomainIds.map((domainId) => (
              <Badge key={domainId} variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px]">
                {systemDomainMap.get(domainId) ?? domainId}
              </Badge>
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
      </CollapsibleContent>
    </Collapsible>
  );
}
