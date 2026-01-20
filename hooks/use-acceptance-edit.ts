import { useState } from "react";
import type { AcceptanceConfirmation } from "@/lib/domain/value-objects";

export interface EditForm {
  evidence: string;
  verifiedBy: string;
}

export interface UseAcceptanceEditReturn {
  editingId: string | null;
  editForm: EditForm;
  startEdit: (confirmation: AcceptanceConfirmation) => void;
  cancelEdit: () => void;
  updateFormField: (field: keyof EditForm, value: string) => void;
  resetForm: () => void;
}

export function useAcceptanceEdit(): UseAcceptanceEditReturn {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    evidence: "",
    verifiedBy: "",
  });

  const startEdit = (confirmation: AcceptanceConfirmation) => {
    setEditingId(confirmation.id);
    setEditForm({
      evidence: confirmation.evidence || "",
      verifiedBy: confirmation.verifiedBy || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ evidence: "", verifiedBy: "" });
  };

  const updateFormField = (field: keyof EditForm, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setEditForm({ evidence: "", verifiedBy: "" });
  };

  return {
    editingId,
    editForm,
    startEdit,
    cancelEdit,
    updateFormField,
    resetForm,
  };
}
