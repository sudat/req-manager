"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StructuredAcceptanceCriteriaInput } from "@/components/forms/StructuredAcceptanceCriteriaInput";
import type { SystemRequirementCard as SystemRequirementCardType } from "../types";
import type { Deliverable } from "@/lib/domain/schemas/deliverable";

type SystemRequirementCardProps = {
  systemRequirement: SystemRequirementCardType;
  businessRequirementMap: Map<string, string>;
  deliverables: Deliverable[];
  onUpdate: (patch: Partial<SystemRequirementCardType>) => void;
  onRemove: () => void;
  onOpenBusinessRequirementDialog: () => void;
};

function BusinessRequirementsField({
  selectedIds,
  nameMap,
  onOpenDialog,
}: {
  selectedIds: string[];
  nameMap: Map<string, string>;
  onOpenDialog: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px] font-medium text-slate-500">業務要件</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-8 text-[12px]"
          onClick={onOpenDialog}
        >
          選択
        </Button>
        {selectedIds.length === 0 ? (
          <span className="text-[12px] text-slate-400">未選択</span>
        ) : (
          selectedIds.map((id) => (
            <Badge
              key={id}
              variant="outline"
              className="border-slate-200 bg-slate-50 text-slate-600 text-[11px]"
            >
              {nameMap.get(id) ?? id}
            </Badge>
          ))
        )}
      </div>
    </div>
  );
}

function DeliverablesField({
  deliverables,
  selectedIds,
  onToggle,
}: {
  deliverables: Deliverable[];
  selectedIds: string[];
  onToggle: (id: string, checked: boolean) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px] font-medium text-slate-500">関連成果物</Label>
      {deliverables.length === 0 ? (
        <span className="text-[12px] text-slate-400">成果物が未登録です</span>
      ) : (
        <div className="space-y-2">
          {deliverables.map((item) => (
            <label key={item.id} className="flex items-center gap-2 text-[13px] text-slate-700">
              <input
                type="checkbox"
                checked={selectedIds.includes(item.id)}
                onChange={(e) => onToggle(item.id, e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span className="font-mono text-[11px] text-slate-500">{item.id}</span>
              <span className="truncate" title={item.name || item.id}>
                {item.name || "名称未設定"}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export function SystemRequirementCard({
  systemRequirement,
  businessRequirementMap,
  deliverables,
  onUpdate,
  onRemove,
  onOpenBusinessRequirementDialog,
}: SystemRequirementCardProps) {
  return (
    <Card className="rounded-md border border-slate-200">
      <CardContent className="p-3 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-slate-400">
              {systemRequirement.id}
            </span>
            <Badge
              variant="outline"
              className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5"
            >
              システム要件
            </Badge>
          </div>
          <Button
            variant="outline"
            size="icon"
            title="削除"
            className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[12px] font-medium text-slate-500">タイトル</Label>
          <Input
            value={systemRequirement.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className="text-[14px]"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[12px] font-medium text-slate-500">概要</Label>
          <Textarea
            className="min-h-[90px] text-[14px]"
            value={systemRequirement.summary}
            onChange={(e) => onUpdate({ summary: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[12px] font-medium text-slate-500">観点種別</Label>
          <Select
            value={systemRequirement.category}
            onValueChange={(value) => onUpdate({ category: value as SystemRequirementCardType["category"] })}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="function">機能</SelectItem>
              <SelectItem value="data">データ</SelectItem>
              <SelectItem value="exception">例外</SelectItem>
              <SelectItem value="non_functional">非機能</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <StructuredAcceptanceCriteriaInput
          values={systemRequirement.acceptanceCriteriaJson ?? []}
          onChange={(values) => onUpdate({ acceptanceCriteriaJson: values })}
          category={systemRequirement.category ?? "function"}
          idPrefix={`AC-${systemRequirement.id}-`}
        />

        <BusinessRequirementsField
          selectedIds={systemRequirement.businessRequirementIds}
          nameMap={businessRequirementMap}
          onOpenDialog={onOpenBusinessRequirementDialog}
        />

        <DeliverablesField
          deliverables={deliverables}
          selectedIds={systemRequirement.relatedDeliverableIds}
          onToggle={(id, checked) => {
            const next = checked
              ? [...systemRequirement.relatedDeliverableIds, id]
              : systemRequirement.relatedDeliverableIds.filter((item) => item !== id);
            onUpdate({ relatedDeliverableIds: next });
          }}
        />

      </CardContent>
    </Card>
  );
}
