"use client";

import { GroupedSelectionDialog } from "@/components/forms/GroupedSelectionDialog";

export type SystemFunctionItem = {
  id: string;
  title: string;
  domainName?: string;
};

export type SystemFunctionSelectionDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  systemFunctions: SystemFunctionItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  emptyMessage?: string;
};

export function SystemFunctionSelectionDialog({
  isOpen,
  onClose,
  title,
  systemFunctions,
  selectedId,
  onSelect,
  emptyMessage = "システム機能がありません。",
}: SystemFunctionSelectionDialogProps) {
  return (
    <GroupedSelectionDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      items={systemFunctions}
      selectedId={selectedId}
      onSelect={onSelect}
      emptyMessage={emptyMessage}
      getSearchableText={(sf) => sf.title}
      getGroupKey={(sf) => sf.domainName || "その他"}
      getDisplayLabel={(sf) => sf.title}
    />
  );
}
