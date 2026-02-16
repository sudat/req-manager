"use client";

import type { DdType } from "@/lib/domain/enums";
import { DD_TYPE_LABELS } from "@/lib/domain/enums";
import { GroupedSelectionDialog } from "@/components/forms/GroupedSelectionDialog";

export type DesignDocumentItem = {
  id: string;
  name: string;
  type: DdType;
  summary: string;
};

export type DesignDocumentSelectionDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  designDocuments: DesignDocumentItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  emptyMessage?: string;
};

export function DesignDocumentSelectionDialog({
  isOpen,
  onClose,
  title,
  designDocuments,
  selectedId,
  onSelect,
  emptyMessage = "設計書がありません。",
}: DesignDocumentSelectionDialogProps) {
  return (
    <GroupedSelectionDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      items={designDocuments}
      selectedId={selectedId}
      onSelect={onSelect}
      emptyMessage={emptyMessage}
      getSearchableText={(dd) => dd.name}
      getGroupKey={(dd) => DD_TYPE_LABELS[dd.type] || "その他"}
      getDisplayLabel={(dd) => dd.name || "（名称未設定）"}
    />
  );
}
