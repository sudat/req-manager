"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import type { Requirement } from "@/lib/mock/task-knowledge";
import { getSystemFunctionById } from "@/lib/mock/data";

type SystemRequirementCardProps = {
  requirement: Requirement;
  systemFunctionDomainMap: Map<string, string | null>;
};

export function SystemRequirementCard({
  requirement,
  systemFunctionDomainMap,
}: SystemRequirementCardProps) {
  const srf = requirement.srfId ? getSystemFunctionById(requirement.srfId) : undefined;
  const srfSummaryShort = srf?.summary?.split(":")[0] || srf?.summary?.split("。")[0] || "";

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50/50 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <div className="flex-1">
          <div className="font-mono text-[11px] text-slate-400">{requirement.id}</div>
          <div className="text-[14px] font-medium text-slate-900 mt-1">{requirement.title}</div>
          <div className="mt-1 text-[13px] text-slate-600">{requirement.summary}</div>
        </div>
        <Badge variant="outline" className="border-blue-200/60 bg-blue-50 text-blue-700 text-[12px] font-medium px-2 py-0.5">
          {requirement.type}
        </Badge>
      </div>

      {requirement.concepts && requirement.concepts.length > 0 && (
        <div className="border-t border-slate-100 pt-2 mt-2 space-y-1">
          <div className="text-[12px] font-medium text-slate-500">関連概念</div>
          <div className="flex flex-wrap gap-1.5">
            {requirement.concepts.map((concept) => (
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
            {requirement.impacts.map((impact, i) => (
              <Badge key={i} variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px]">
                {impact}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {requirement.acceptanceCriteria && requirement.acceptanceCriteria.length > 0 && (
        <div className="border-t border-slate-100 pt-2 mt-2 space-y-1">
          <div className="text-[12px] font-medium text-slate-500">受入条件</div>
          <ul className="list-disc pl-5 text-[13px] text-slate-700 space-y-0.5">
            {requirement.acceptanceCriteria.map((ac, i) => (
              <li key={i}>{ac}</li>
            ))}
          </ul>
        </div>
      )}

      {srf && (
        <div className="border-t border-slate-100 pt-2 mt-2">
          <div className="text-[12px] font-medium text-slate-500 mb-1">関連システム機能</div>
          <div className="ml-1 pl-3 border-l-2 border-purple-200">
            <Link
              href={systemFunctionDomainMap.get(srf.id) ? `/system-domains/${systemFunctionDomainMap.get(srf.id)}/functions/${srf.id}` : "/system-domains"}
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
    </div>
  );
}
