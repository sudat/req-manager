"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, Check, Lock } from "lucide-react";
import type { ImpactScope } from "@/lib/domain/value-objects";
import { confirmImpactScope } from "@/lib/data/impact-scopes";

interface TicketImpactCardProps {
  impactScopes: ImpactScope[];
}

const targetTypeLabels: Record<string, string> = {
  business_requirement: "業務要件",
  system_requirement: "システム要件",
  system_function: "システム機能",
  file: "ファイル",
};

export function TicketImpactCard({ impactScopes }: TicketImpactCardProps) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const [scopes, setScopes] = useState<ImpactScope[]>(impactScopes);

  const hasUnconfirmed = scopes.some(s => !s.confirmed);
  const allConfirmed = scopes.length > 0 && scopes.every(s => s.confirmed);

  const handleConfirm = async (scopeId: string) => {
    setConfirming(scopeId);
    const { data, error } = await confirmImpactScope(scopeId, "システム");
    if (data) {
      setScopes(prev => prev.map(s => s.id === scopeId ? data : s));
    }
    setConfirming(null);
  };

  const handleConfirmAll = async () => {
    for (const scope of scopes) {
      if (!scope.confirmed) {
        setConfirming(scope.id);
        const { data } = await confirmImpactScope(scope.id, "システム");
        if (data) {
          setScopes(prev => prev.map(s => s.id === scope.id ? data : s));
        }
      }
    }
    setConfirming(null);
  };

  if (scopes.length === 0) {
    return null;
  }

  return (
    <Card className="rounded-md border border-slate-200">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-[14px] font-semibold text-slate-900">
            影響範囲
            {allConfirmed && <Lock className="h-3.5 w-3.5 text-emerald-600 ml-2 inline" />}
          </h3>
          <div className="flex items-center gap-2">
            {hasUnconfirmed && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-2 text-[12px]"
                onClick={handleConfirmAll}
                disabled={confirming !== null}
              >
                <Check className="h-3.5 w-3.5" />
                全て確定
              </Button>
            )}
            <Button variant="outline" size="sm" className="h-7 gap-2 text-[12px]">
              <Globe className="h-4 w-4" />
              AI影響分析
            </Button>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-2 mt-2 space-y-2">
          <div className="text-[12px] font-medium text-slate-500">
            影響する対象 ({scopes.length})
            {allConfirmed && <span className="text-emerald-600 ml-2">すべて確定済み</span>}
          </div>
          <div className="space-y-2">
            {scopes.map((scope) => (
              <div key={scope.id} className={`rounded-md border p-3 ${scope.confirmed ? "border-emerald-200 bg-emerald-50" : "border-slate-200"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-mono text-[11px] text-slate-400">{scope.targetId}</div>
                      {scope.confirmed && (
                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-600 text-[10px]">
                          <Lock className="h-2.5 w-2.5 mr-1" />
                          確定済
                        </Badge>
                      )}
                    </div>
                    <div className="text-[13px] text-slate-700 mt-1">{scope.targetTitle}</div>
                    {scope.rationale && (
                      <div className="text-[12px] text-slate-500 mt-1">{scope.rationale}</div>
                    )}
                    {scope.confirmed && scope.confirmedBy && (
                      <div className="text-[11px] text-emerald-600 mt-1">
                        確定者: {scope.confirmedBy}
                        {scope.confirmedAt && ` (${new Date(scope.confirmedAt).toLocaleString()})`}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5">
                      {targetTypeLabels[scope.targetType] || scope.targetType}
                    </Badge>
                    {!scope.confirmed && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-[11px]"
                        onClick={() => handleConfirm(scope.id)}
                        disabled={confirming !== null}
                      >
                        {confirming === scope.id ? "確定中..." : "確定"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
