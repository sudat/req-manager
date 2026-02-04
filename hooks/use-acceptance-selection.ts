import { useState } from "react";
import type { AcceptanceConfirmation, AcceptanceConfirmationStatus } from "@/lib/domain/value-objects";
import { useSetSelection } from "./use-set-selection";

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
  const { selectedIds, toggleSelect, toggleSelectAll, clearSelection } = useSetSelection(items, (item) => item.id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
