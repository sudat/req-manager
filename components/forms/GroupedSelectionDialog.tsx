"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export interface GroupedSelectionDialogProps<T extends { id: string }> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: T[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  emptyMessage?: string;
  getSearchableText: (item: T) => string;
  getGroupKey: (item: T) => string;
  getDisplayLabel: (item: T) => string;
}

export function GroupedSelectionDialog<T extends { id: string }>({
  isOpen,
  onClose,
  title,
  items,
  selectedId,
  onSelect,
  emptyMessage = "候補がありません。",
  getSearchableText,
  getGroupKey,
  getDisplayLabel,
}: GroupedSelectionDialogProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(selectedId);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSearchQuery("");
      onClose();
      return;
    }
    setLocalSelectedId(selectedId);
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter((item) => {
      const searchable = `${item.id} ${getSearchableText(item)}`.toLowerCase();
      return searchable.includes(query);
    });
  }, [getSearchableText, items, searchQuery]);

  const groupedItems = useMemo(() => {
    return filteredItems.reduce((acc, item) => {
      const groupKey = getGroupKey(item) || "その他";
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(item);
      return acc;
    }, {} as Record<string, T[]>);
  }, [filteredItems, getGroupKey]);

  const handleConfirm = () => {
    if (localSelectedId) {
      onSelect(localSelectedId);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[70vh] max-w-[520px] flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-[16px]">{title}</DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          <Input
            placeholder="ID/名称で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-3"
          />

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {Object.keys(groupedItems).length === 0 ? (
              <p className="py-4 text-center text-[13px] text-slate-500">{emptyMessage}</p>
            ) : (
              Object.entries(groupedItems).map(([groupKey, group]) => (
                <div key={groupKey}>
                  <div className="sticky top-0 bg-slate-50 px-2 py-1.5 text-xs font-semibold text-slate-500">
                    {groupKey}
                  </div>
                  <div className="space-y-1">
                    {group.map((item) => {
                      const isSelected = localSelectedId === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setLocalSelectedId(item.id)}
                          className={`w-full rounded-md border px-3 py-2 text-left text-[14px] transition-colors ${
                            isSelected
                              ? "border-brand-200 bg-brand-50 text-brand-700"
                              : "border-transparent text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border ${
                                isSelected
                                  ? "border-brand-600 bg-brand-600"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                            </div>
                            <span className="shrink-0 font-mono text-[11px] text-slate-500">
                              {item.id}
                            </span>
                            <span className="truncate" title={`${item.id}: ${getDisplayLabel(item)}`}>
                              {getDisplayLabel(item)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-3 flex justify-end gap-2 border-t border-slate-200 pt-3">
            <Button variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button onClick={handleConfirm} disabled={!localSelectedId}>
              選択
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
