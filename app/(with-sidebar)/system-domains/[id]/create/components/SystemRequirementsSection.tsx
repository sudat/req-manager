"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { SystemRequirementCard } from "./SystemRequirementCard";
import type { SystemRequirementCard as SysReqCard } from "../types";
import type { BusinessRequirement } from "@/lib/data/business-requirements";
import type { Deliverable } from "@/lib/domain/schemas/deliverable";

type SystemRequirementsSectionProps = {
  systemRequirements: SysReqCard[];
  businessRequirements: BusinessRequirement[];
  deliverables: Deliverable[];
  loading: boolean;
  onAddSystemRequirement: () => void;
  onUpdateSystemRequirement: (sysReqId: string, patch: Partial<SysReqCard>) => void;
  onRemoveSystemRequirement: (sysReqId: string) => void;
  onOpenBusinessRequirementDialog: (sysReqId: string) => void;
};

export function SystemRequirementsSection({
  systemRequirements,
  businessRequirements,
  deliverables,
  loading,
  onAddSystemRequirement,
  onUpdateSystemRequirement,
  onRemoveSystemRequirement,
  onOpenBusinessRequirementDialog,
}: SystemRequirementsSectionProps) {
  const businessRequirementMap = useMemo(
    () => new Map(businessRequirements.map((br) => [br.id, br.title])),
    [businessRequirements]
  );

  return (
    <Card className="mt-4 rounded-md border border-slate-200">
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-semibold text-slate-900">システム要件</h3>
            <Badge
              variant="outline"
              className="font-mono text-[11px] border-slate-200 bg-slate-50 text-slate-600 px-1.5 py-0"
            >
              {systemRequirements.length}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-2 text-[12px]"
            onClick={onAddSystemRequirement}
            disabled={loading}
          >
            <Plus className="h-4 w-4" />
            追加
          </Button>
        </div>

        {systemRequirements.length === 0 ? (
          <div className="text-[14px] text-slate-500">
            まだ登録されていません。
          </div>
        ) : (
          systemRequirements.map((sysReq) => (
            <SystemRequirementCard
              key={sysReq.id}
              systemRequirement={sysReq}
              businessRequirementMap={businessRequirementMap}
              deliverables={deliverables}
              onUpdate={(patch) => onUpdateSystemRequirement(sysReq.id, patch)}
              onRemove={() => onRemoveSystemRequirement(sysReq.id)}
              onOpenBusinessRequirementDialog={() => onOpenBusinessRequirementDialog(sysReq.id)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
