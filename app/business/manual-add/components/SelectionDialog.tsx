"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { Requirement, SelectionDialogState, SelectableItem, SelectionDialogType } from "../types";
import type { SystemDomain } from "@/lib/data/system-domains";

type SelectionDialogProps = {
  dialogState: SelectionDialogState;
  onClose: () => void;
  activeRequirement: Requirement | null;
  concepts: SelectableItem[];
  systemFunctions: SelectableItem[];
  systemDomains: SystemDomain[];
  onUpdateRequirement: (reqId: string, patch: Partial<Requirement>) => void;
};

function getDialogTitle(type: SelectionDialogType): string {
  switch (type) {
    case "concepts":
      return "関連概念を選択";
    case "system":
      return "関連システム機能を選択";
    case "domain":
      return "システム領域を選択";
    default:
      return "";
  }
}

type CheckboxListProps = {
  items: SelectableItem[];
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
          className="flex items-center gap-2 text-[14px] text-slate-700"
        >
          <Checkbox
            checked={isChecked(item.id)}
            onCheckedChange={(value) => onToggle(item.id, !!value)}
          />
          <span className="font-mono text-[11px] text-slate-500">{item.id}</span>
          <span>{item.name}</span>
        </label>
      ))}
    </>
  );
}

export function SelectionDialog({
  dialogState,
  onClose,
  activeRequirement,
  concepts,
  systemFunctions,
  systemDomains,
  onUpdateRequirement,
}: SelectionDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredConcepts = useMemo(() => {
    if (!normalizedSearch) return concepts;
    return concepts.filter((c) =>
      `${c.id} ${c.name}`.toLowerCase().includes(normalizedSearch)
    );
  }, [concepts, normalizedSearch]);

  const filteredSystemFunctions = useMemo(() => {
    if (!normalizedSearch) return systemFunctions;
    return systemFunctions.filter((srf) =>
      `${srf.id} ${srf.name}`.toLowerCase().includes(normalizedSearch)
    );
  }, [systemFunctions, normalizedSearch]);

  const filteredSystemDomains = useMemo(() => {
    if (!normalizedSearch) return systemDomains;
    return systemDomains.filter((d) =>
      `${d.id} ${d.name}`.toLowerCase().includes(normalizedSearch)
    );
  }, [systemDomains, normalizedSearch]);

  function handleOpenChange(open: boolean): void {
    if (!open) {
      setSearchQuery("");
      onClose();
    }
  }

  function handleConceptToggle(conceptId: string, checked: boolean): void {
    if (!activeRequirement) return;
    const next = checked
      ? [...activeRequirement.conceptIds, conceptId]
      : activeRequirement.conceptIds.filter((id) => id !== conceptId);
    onUpdateRequirement(activeRequirement.id, { conceptIds: next });
  }

  function handleSystemFunctionToggle(srfId: string, checked: boolean): void {
    if (!activeRequirement) return;
    onUpdateRequirement(activeRequirement.id, { srfId: checked ? srfId : null });
  }

  function handleDomainToggle(domainId: string, checked: boolean): void {
    if (!activeRequirement) return;
    const next = checked
      ? [...activeRequirement.systemDomainIds, domainId]
      : activeRequirement.systemDomainIds.filter((id) => id !== domainId);
    onUpdateRequirement(activeRequirement.id, { systemDomainIds: next });
  }

  return (
    <Dialog open={!!dialogState} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[520px] max-h-[70vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-[16px]">
            {dialogState && getDialogTitle(dialogState.type)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            placeholder="ID/名称で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {dialogState?.type === "concepts" && activeRequirement && (
              <CheckboxList
                items={filteredConcepts}
                emptyMessage="該当する概念がありません。"
                isChecked={(id) => activeRequirement.conceptIds.includes(id)}
                onToggle={handleConceptToggle}
              />
            )}

            {dialogState?.type === "system" && activeRequirement && (
              <CheckboxList
                items={filteredSystemFunctions}
                emptyMessage="該当するシステム機能がありません。"
                isChecked={(id) => activeRequirement.srfId === id}
                onToggle={handleSystemFunctionToggle}
              />
            )}

            {dialogState?.type === "domain" && activeRequirement && (
              <CheckboxList
                items={filteredSystemDomains}
                emptyMessage="該当するシステム領域がありません。"
                isChecked={(id) => activeRequirement.systemDomainIds.includes(id)}
                onToggle={handleDomainToggle}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
