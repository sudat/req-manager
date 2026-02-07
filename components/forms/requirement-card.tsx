"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { YamlListField } from "./yaml-list-field";
import { StructuredAcceptanceCriteriaInput } from "@/components/forms/StructuredAcceptanceCriteriaInput";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Trash2, ChevronDown } from "lucide-react";
import type { Requirement, SelectionDialogType } from "@/lib/domain";
import { getSystemRequirementCategoryLabel } from "@/lib/data/system-requirements";
import { cn } from "@/lib/utils";


type RequirementCardProps = {
  requirement: Requirement;
  conceptMap: Map<string, string>;
  systemFunctionMap: Map<string, string>;
  systemDomainMap: Map<string, string>;
  businessRequirementMap?: Map<string, string>;
  systemRequirementMap?: Map<string, string>;
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
  onUpdate,
  onRemove,
  onOpenDialog,
}: RequirementCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="pl-4 border-l-4 border-indigo-500 bg-slate-50/50 rounded-md p-4">
        {/* 見出しエリア（常に表示・行全体クリック可能） */}
        <CollapsibleTrigger className="w-full cursor-pointer">
          <div className="flex items-center gap-3 text-left">
            <ChevronDown
              className={cn(
                "h-5 w-5 text-slate-500 transition-transform shrink-0",
                isOpen && "rotate-180"
              )}
            />

            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="font-mono text-sm text-slate-500 shrink-0">
                {requirement.id}
              </span>
              <span className="text-base font-medium text-slate-900 truncate">
                {requirement.title}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {requirement.type === "システム要件" && requirement.category && (
                <Badge
                  variant="outline"
                  className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-medium"
                >
                  {getSystemRequirementCategoryLabel(requirement.category)}
                </Badge>
              )}

              <Badge
                variant="outline"
                className="border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-medium"
              >
                {requirement.type}
              </Badge>
            </div>
          </div>
        </CollapsibleTrigger>

        {/* 削除ボタン（展開時のみ表示） */}
        {isOpen && (
          <div className="flex justify-end mt-2">
            <Button
              variant="outline"
              size="icon"
              title="削除"
              className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* 展開可能なコンテンツ */}
        <CollapsibleContent className="mt-4 space-y-3">
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
                  ゴール
                </Label>
                <Textarea
                  className="min-h-[90px] text-[14px]"
                  value={requirement.goal}
                  onChange={(e) => onUpdate({ goal: e.target.value })}
                />
              </div>
              <YamlListField
                label="制約条件"
                value={requirement.constraints}
                onChange={(value) => onUpdate({ constraints: value })}
                itemPlaceholder="例: 計上日は出荷日基準とする"
              />
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-slate-500">
                  オーナー
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
                  <SelectItem value="function">{getSystemRequirementCategoryLabel("function")}</SelectItem>
                  <SelectItem value="data">{getSystemRequirementCategoryLabel("data")}</SelectItem>
                  <SelectItem value="exception">{getSystemRequirementCategoryLabel("exception")}</SelectItem>
                  <SelectItem value="non_functional">{getSystemRequirementCategoryLabel("non_functional")}</SelectItem>
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
              selectedIds={requirement.srfIds ?? []}
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
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
