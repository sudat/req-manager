"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { SystemRequirementCard } from "../types";
import type { BusinessRequirement } from "@/lib/data/business-requirements";

type BusinessRequirementDialogProps = {
  open: boolean;
  onClose: () => void;
  activeSystemRequirement: SystemRequirementCard | null;
  businessRequirements: BusinessRequirement[];
  onUpdateSystemRequirement: (sysReqId: string, patch: Partial<SystemRequirementCard>) => void;
};

type CheckboxListProps = {
  items: BusinessRequirement[];
  emptyMessage: string;
  isChecked: (id: string) => boolean;
  onToggle: (id: string, checked: boolean) => void;
};

function CheckboxList({
  items,
  emptyMessage,
  isChecked,
  onToggle,
}: CheckboxListProps) {
  if (items.length === 0) {
    return <p className="text-[13px] text-slate-500">{emptyMessage}</p>;
  }

  return (
    <>
      {items.map((item) => (
        <label
          key={item.id}
          className="flex items-start gap-2 text-[14px] text-slate-700 cursor-pointer"
        >
          <Checkbox
            checked={isChecked(item.id)}
            onCheckedChange={(value) => onToggle(item.id, !!value)}
            className="mt-0.5"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-slate-500">{item.id}</span>
              <span className="font-medium">{item.title}</span>
            </div>
            {item.summary && (
              <p className="text-[12px] text-slate-500 mt-0.5 line-clamp-2">{item.summary}</p>
            )}
          </div>
        </label>
      ))}
    </>
  );
}

export function BusinessRequirementDialog({
  open,
  onClose,
  activeSystemRequirement,
  businessRequirements,
  onUpdateSystemRequirement,
}: BusinessRequirementDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredBusinessRequirements = useMemo(() => {
    if (!normalizedSearch) return businessRequirements;
    return businessRequirements.filter((br) =>
      `${br.id} ${br.title}`.toLowerCase().includes(normalizedSearch)
    );
  }, [businessRequirements, normalizedSearch]);

  function handleOpenChange(open: boolean): void {
    if (!open) {
      setSearchQuery("");
      onClose();
    }
  }

  function handleBusinessRequirementToggle(bizReqId: string, checked: boolean): void {
    if (!activeSystemRequirement) return;
    const next = checked
      ? [...activeSystemRequirement.businessRequirementIds, bizReqId]
      : activeSystemRequirement.businessRequirementIds.filter((id) => id !== bizReqId);
    onUpdateSystemRequirement(activeSystemRequirement.id, { businessRequirementIds: next });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[520px] max-h-[70vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-[16px]">業務要件を選択</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            placeholder="ID/名称で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {activeSystemRequirement && (
              <CheckboxList
                items={filteredBusinessRequirements}
                emptyMessage="該当する業務要件がありません。"
                isChecked={(id) => activeSystemRequirement.businessRequirementIds.includes(id)}
                onToggle={handleBusinessRequirementToggle}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
