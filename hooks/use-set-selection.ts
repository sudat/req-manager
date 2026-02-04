import { useState, useMemo } from "react";

/**
 * Set型選択パターンの共通カスタムフック
 * items と getId を渡すだけで、選択・全選択・全解除を提供する
 */
export function useSetSelection<T>(items: T[], getId: (item: T) => string) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const isAllSelected = useMemo(() => items.length > 0 && selectedIds.size === items.length, [selectedIds, items.length]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(getId)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  return {
    selectedIds,
    isAllSelected,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
  };
}
