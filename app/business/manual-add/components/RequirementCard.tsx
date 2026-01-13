"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import type { Requirement, SelectionDialogType } from "../types";

const splitLines = (value: string): string[] =>
  value
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);

const joinLines = (values: string[]): string => values.join("\n");

type RequirementCardProps = {
  requirement: Requirement;
  conceptMap: Map<string, string>;
  systemFunctionMap: Map<string, string>;
  systemDomainMap: Map<string, string>;
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

export function RequirementCard({
  requirement,
  conceptMap,
  systemFunctionMap,
  systemDomainMap,
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

        <div className="space-y-1.5">
          <Label className="text-[12px] font-medium text-slate-500">概要</Label>
          <Textarea
            className="min-h-[90px] text-[14px]"
            value={requirement.summary}
            onChange={(e) => onUpdate({ summary: e.target.value })}
          />
        </div>

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

        <SelectionField
          label="システム領域"
          selectedIds={requirement.systemDomainIds}
          nameMap={systemDomainMap}
          onOpenDialog={() => onOpenDialog("domain")}
        />

        <div className="space-y-1.5">
          <Label className="text-[12px] font-medium text-slate-500">
            受入条件（1行=1条件）
          </Label>
          <Textarea
            className="min-h-[110px] text-[14px]"
            value={joinLines(requirement.acceptanceCriteria)}
            onChange={(e) =>
              onUpdate({ acceptanceCriteria: splitLines(e.target.value) })
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
