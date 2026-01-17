"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { RequirementCard } from "@/components/forms/requirement-card";
import type { Requirement, SelectionDialogType, SelectableItem } from "@/lib/domain/forms";
import type { SystemDomain } from "@/lib/data/system-domains";

type RequirementsSectionProps = {
  requirements: Requirement[];
  concepts: SelectableItem[];
  systemFunctions: SelectableItem[];
  systemDomains: SystemDomain[];
  loading: boolean;
  onAddRequirement: () => void;
  onUpdateRequirement: (reqId: string, patch: Partial<Requirement>) => void;
  onRemoveRequirement: (reqId: string) => void;
  onOpenDialog: (type: SelectionDialogType, reqId: string) => void;
};

export function RequirementsSection({
  requirements,
  concepts,
  systemFunctions,
  systemDomains,
  loading,
  onAddRequirement,
  onUpdateRequirement,
  onRemoveRequirement,
  onOpenDialog,
}: RequirementsSectionProps) {
  const conceptMap = useMemo(
    () => new Map(concepts.map((c) => [c.id, c.name])),
    [concepts]
  );

  const systemFunctionMap = useMemo(
    () => new Map(systemFunctions.map((srf) => [srf.id, srf.name])),
    [systemFunctions]
  );

  const systemDomainMap = useMemo(
    () => new Map(systemDomains.map((d) => [d.id, d.name])),
    [systemDomains]
  );

  return (
    <Card className="mt-4 rounded-md border border-slate-200">
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-semibold text-slate-900">業務要件</h3>
            <Badge
              variant="outline"
              className="font-mono text-[11px] border-slate-200 bg-slate-50 text-slate-600 px-1.5 py-0"
            >
              {requirements.length}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-2 text-[12px]"
            onClick={onAddRequirement}
            disabled={loading}
          >
            <Plus className="h-4 w-4" />
            追加
          </Button>
        </div>

        {requirements.length === 0 ? (
          <div className="text-[14px] text-slate-500">
            まだ登録されていません。
          </div>
        ) : (
          requirements.map((req) => (
            <RequirementCard
              key={req.id}
              requirement={req}
              conceptMap={conceptMap}
              systemFunctionMap={systemFunctionMap}
              systemDomainMap={systemDomainMap}
              onUpdate={(patch) => onUpdateRequirement(req.id, patch)}
              onRemove={() => onRemoveRequirement(req.id)}
              onOpenDialog={(type) => onOpenDialog(type, req.id)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
