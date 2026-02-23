"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { YamlListField } from "./yaml-list-field";
import { StructuredAcceptanceCriteriaInput } from "@/components/forms/StructuredAcceptanceCriteriaInput";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ConceptBadgeList } from "@/components/ui/concept-badge";
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
      <Label className="text-[14px] font-bold text-slate-900 border-l-4 border-primary pl-3 -ml-3">{label}</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-8 text-[12px]"
          onClick={onOpenDialog}
        >
          選択
        </Button>
        <ConceptBadgeList
          ids={selectedIds}
          conceptMap={nameMap}
          emptyMessage="未選択"
        />
      </div>
    </div>
  );
}

export function RequirementCard({
  requirement,
  conceptMap,
  systemFunctionMap,
  businessRequirementMap,
  systemRequirementMap,
  onUpdate,
  onRemove,
  onOpenDialog,
}: RequirementCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [goalFocused, setGoalFocused] = useState(false);
  const [summaryFocused, setSummaryFocused] = useState(false);

  // 種別に応じたバッジの色を設定
  const typeBadgeClass =
    requirement.type === "業務要件"
      ? "border-indigo-200 bg-indigo-50 text-indigo-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="py-2 pl-8 pr-2 border-l-4 border-slate-200 bg-slate-50/50 rounded-md">
        <div className="flex items-center gap-3">
          <CollapsibleTrigger className="flex-1 cursor-pointer">
            <div className="flex items-center gap-3 text-left">
              <ChevronDown
                className={cn(
                  "h-5 w-5 text-slate-500 transition-transform shrink-0",
                  isOpen && "rotate-180"
                )}
              />
              <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                {/* IDバッジ - グレー系 */}
                <Badge className="border-slate-200/60 bg-slate-50 text-slate-600 text-[12px] font-medium px-2.5 py-1 font-mono shrink-0">
                  {requirement.id}
                </Badge>
                {/* 種別バッジ */}
                <Badge
                  variant="outline"
                  className={`${typeBadgeClass} text-[12px] font-medium px-2.5 py-1 shrink-0`}
                >
                  {requirement.type}
                </Badge>
                {/* タイトル */}
                <span className="text-[14px] font-semibold text-slate-900 truncate">
                  {requirement.title}
                </span>
              </div>
            </div>
          </CollapsibleTrigger>
          <Button
            variant="ghost"
            size="icon"
            title="削除"
            aria-label={`${requirement.title || "要件"} を削除`}
            className="h-8 w-8 rounded-md hover:bg-rose-100 hover:text-rose-600 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* 展開可能なコンテンツ */}
        <CollapsibleContent className="mt-4 space-y-8">
           <div className="space-y-1.5">
            <Label className="text-[14px] font-bold text-slate-900 border-l-4 border-primary pl-3 -ml-3">タイトル</Label>
            <Input
              value={requirement.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="text-[14px]"
            />
          </div>

          {requirement.type === "業務要件" && (
            <>
              <div className="space-y-1.5">
                <Label className="text-[14px] font-bold text-slate-900 border-l-4 border-primary pl-3 -ml-3">
                  ゴール
                </Label>
                <Textarea
                  className="field-sizing-fixed resize-none text-[14px] transition-[height]"
                  style={{ height: goalFocused ? 72 : 32 }}
                  value={requirement.goal}
                  onChange={(e) => onUpdate({ goal: e.target.value })}
                  onFocus={() => setGoalFocused(true)}
                  onBlur={() => setGoalFocused(false)}
                />
              </div>
              <YamlListField
                label="制約条件"
                value={requirement.constraints}
                onChange={(value) => onUpdate({ constraints: value })}
                itemPlaceholder="例: 計上日は出荷日基準とする"
              />
              <div className="space-y-1.5">
                <Label className="text-[14px] font-bold text-slate-900 border-l-4 border-primary pl-3 -ml-3">
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
              <Label className="text-[14px] font-bold text-slate-900 border-l-4 border-primary pl-3 -ml-3">概要</Label>
              <Textarea
                className="field-sizing-fixed resize-none text-[14px] transition-[height]"
                style={{ height: summaryFocused ? 72 : 32 }}
                value={requirement.summary}
                onChange={(e) => onUpdate({ summary: e.target.value })}
                onFocus={() => setSummaryFocused(true)}
                onBlur={() => setSummaryFocused(false)}
              />
            </div>
          )}

          {requirement.type === "システム要件" && (
            <div className="space-y-1.5">
              <Label className="text-[14px] font-bold text-slate-900 border-l-4 border-primary pl-3 -ml-3">カテゴリ</Label>
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

          {requirement.type === "システム要件" && businessRequirementMap && (
            <SelectionField
              label="業務要件"
              selectedIds={requirement.businessRequirementIds}
              nameMap={businessRequirementMap}
              onOpenDialog={() => onOpenDialog("business")}
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

          {requirement.type === "業務要件" && systemRequirementMap && (
            <SelectionField
              label="関連システム要件"
              selectedIds={requirement.relatedSystemRequirementIds}
              nameMap={systemRequirementMap}
              onOpenDialog={() => onOpenDialog("systemRequirements")}
            />
          )}

        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
