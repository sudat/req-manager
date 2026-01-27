"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { YamlListField } from "./yaml-list-field";
import { StructuredAcceptanceCriteriaInput } from "@/components/forms/StructuredAcceptanceCriteriaInput";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import type { Requirement, SelectionDialogType } from "@/lib/domain";


type RequirementCardProps = {
  requirement: Requirement;
  conceptMap: Map<string, string>;
  systemFunctionMap: Map<string, string>;
  systemDomainMap: Map<string, string>;
  businessRequirementMap?: Map<string, string>;
  systemRequirementMap?: Map<string, string>;
  deliverableMap?: Map<string, string>;
  onUpdate: (patch: Partial<Requirement>) => void;
  onRemove: () => void;
  onOpenDialog: (type: SelectionDialogType) => void;
};

type SelectionFieldProps = {
  label: string;
  selectedIds: string[];
  nameMap: Map<string, string>;
  onOpenDialog: () => void;
};

function SelectionField({
  label,
  selectedIds,
  nameMap,
  onOpenDialog,
}: SelectionFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px] font-medium text-slate-500">{label}</Label>
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
              className="border-slate-200 bg-slate-50 text-slate-600 text-[11px] max-w-[200px] truncate"
              title={`${id}: ${nameMap.get(id) ?? id}`}
            >
              {id}: {nameMap.get(id) ?? id}
            </Badge>
          ))
        )}
      </div>
    </div>
  );
}

export function RequirementCard({
  requirement,
  conceptMap,
  systemFunctionMap,
  systemDomainMap,
  businessRequirementMap,
  systemRequirementMap,
  deliverableMap,
  onUpdate,
  onRemove,
  onOpenDialog,
}: RequirementCardProps) {
  return (
    <Card className="rounded-md border border-slate-200">
      <CardContent className="p-3 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-slate-400">
              {requirement.id}
            </span>
            <Badge
              variant="outline"
              className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5"
            >
              {requirement.type}
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
            value={requirement.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className="text-[14px]"
          />
        </div>

        {requirement.type === "業務要件" && (
          <>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-slate-500">
                goal
              </Label>
              <Textarea
                className="min-h-[90px] text-[14px]"
                value={requirement.goal}
                onChange={(e) => onUpdate({ goal: e.target.value })}
              />
            </div>
            <YamlListField
              label="constraints"
              value={requirement.constraints}
              onChange={(value) => onUpdate({ constraints: value })}
              itemPlaceholder="例: 計上日は出荷日基準とする"
              helperText="守るべき業務ルールや制度を箇条書きで記載します。"
            />
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-slate-500">
                owner
              </Label>
              <Input
                value={requirement.owner}
                onChange={(e) => onUpdate({ owner: e.target.value })}
                className="text-[14px]"
                placeholder="例: 経理部門長"
              />
            </div>
          </>
        )}

        {requirement.type === "システム要件" && (
          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-slate-500">概要</Label>
            <Textarea
              className="min-h-[90px] text-[14px]"
              value={requirement.summary}
              onChange={(e) => onUpdate({ summary: e.target.value })}
            />
          </div>
        )}

        {requirement.type === "システム要件" && (
          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-slate-500">カテゴリ</Label>
            <Select
              value={requirement.category ?? "function"}
              onValueChange={(value) =>
                onUpdate({ category: value as Requirement["category"] })
              }
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
        )}

        {requirement.type === "システム要件" && (
          <StructuredAcceptanceCriteriaInput
            values={requirement.acceptanceCriteriaJson ?? []}
            onChange={(values) => onUpdate({ acceptanceCriteriaJson: values })}
            category={requirement.category ?? "function"}
            idPrefix={`AC-${requirement.id}-`}
          />
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <SelectionField
            label="関連概念"
            selectedIds={requirement.conceptIds}
            nameMap={conceptMap}
            onOpenDialog={() => onOpenDialog("concepts")}
          />
          <SelectionField
            label="関連システム機能"
            selectedIds={requirement.srfId ? [requirement.srfId] : []}
            nameMap={systemFunctionMap}
            onOpenDialog={() => onOpenDialog("system")}
          />
        </div>

        {requirement.type === "システム要件" && businessRequirementMap && (
          <SelectionField
            label="業務要件"
            selectedIds={requirement.businessRequirementIds}
            nameMap={businessRequirementMap}
            onOpenDialog={() => onOpenDialog("business")}
          />
        )}

        {requirement.type === "システム要件" && deliverableMap && (
          <SelectionField
            label="関連成果物"
            selectedIds={requirement.relatedDeliverableIds ?? []}
            nameMap={deliverableMap}
            onOpenDialog={() => onOpenDialog("deliverables")}
          />
        )}

        {requirement.type === "業務要件" && systemRequirementMap && (
          <SelectionField
            label="関連システム要件"
            selectedIds={requirement.relatedSystemRequirementIds}
            nameMap={systemRequirementMap}
            onOpenDialog={() => onOpenDialog("systemRequirements")}
          />
        )}

        <SelectionField
          label="システム領域"
          selectedIds={requirement.systemDomainIds}
          nameMap={systemDomainMap}
          onOpenDialog={() => onOpenDialog("domain")}
        />

      </CardContent>
    </Card>
  );
}
