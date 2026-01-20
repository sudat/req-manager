import { useState } from "react";
import type { AcceptanceConfirmation, AcceptanceConfirmationStatus } from "@/lib/domain/value-objects";

export interface UseAcceptanceSelectionReturn {
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  toggleSelectAll: () => void;
  bulkUpdate: (status: AcceptanceConfirmationStatus) => Promise<void>;
  saving: boolean;
  error: string | null;
  clearError: () => void;
}

export interface UseAcceptanceSelectionProps {
  items: AcceptanceConfirmation[];
  onUpdate: (
    ids: Set<string>,
    status: AcceptanceConfirmationStatus,
    onSuccess: () => void
  ) => Promise<void>;
}

export function useAcceptanceSelection({
  items,
  onUpdate,
}: UseAcceptanceSelectionProps): UseAcceptanceSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((c) => c.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const bulkUpdate = async (status: AcceptanceConfirmationStatus) => {
    if (selectedIds.size === 0) return;

    setSaving(true);
    setError(null);

    await onUpdate(selectedIds, status, clearSelection);

    setSaving(false);
  };

  const clearError = () => {
    setError(null);
  };

  return {
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    bulkUpdate,
    saving,
    error,
    clearError,
  };
}
