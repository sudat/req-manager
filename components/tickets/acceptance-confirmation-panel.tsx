"use client"

import { Card, CardContent } from "@/components/ui/card";
import { useAcceptanceConfirmations } from "@/hooks/use-acceptance-confirmations";
import { useAcceptanceSelection } from "@/hooks/use-acceptance-selection";
import { useAcceptanceEdit } from "@/hooks/use-acceptance-edit";
import { AcceptanceConfirmationHeader } from "./acceptance-confirmation-header";
import { AcceptanceConfirmationItem } from "./acceptance-confirmation-item";
import type { AcceptanceConfirmationStatus } from "@/lib/domain/value-objects";

export interface AcceptanceConfirmationPanelProps {
  changeRequestId: string;
  onCompletionChange?: (status: {
    total: number;
    verified: number;
    pending: number;
    completionRate: number;
  }) => void;
}

export function AcceptanceConfirmationPanel({
  changeRequestId,
  onCompletionChange,
}: AcceptanceConfirmationPanelProps) {
  const { confirmations, loading, error, saving, updateStatus, bulkUpdateStatus } =
    useAcceptanceConfirmations({ changeRequestId, onCompletionChange });

  const total = confirmations.length;
  const okCount = confirmations.filter((c) => c.status === "verified_ok").length;
  const ngCount = confirmations.filter((c) => c.status === "verified_ng").length;
  const unverifiedCount = confirmations.filter((c) => c.status === "unverified").length;
  const completionRate = total > 0 ? (okCount / total) * 100 : 100;

  const { selectedIds, toggleSelect, toggleSelectAll, bulkUpdate } =
    useAcceptanceSelection({
      items: confirmations,
      onUpdate: bulkUpdateStatus,
    });

  const edit = useAcceptanceEdit();

  // 一括更新ラッパー
  const handleBulkUpdate = async (status: AcceptanceConfirmationStatus) => {
    await bulkUpdate(status);
  };

  // 編集確定ハンドラー
  const handleSave = async (id: string, status: AcceptanceConfirmationStatus) => {
    await updateStatus(id, status, edit.editForm.verifiedBy, edit.editForm.evidence);
    edit.resetForm();
  };

  // ローディング状態
  if (loading) {
    return (
      <Card className="rounded-md border border-slate-200/60 shadow-sm hover:border-slate-300/60 transition-colors">
        <CardContent className="p-6">
          <p className="text-[13px] text-slate-500">読み込み中...</p>
        </CardContent>
      </Card>
    );
  }

  // 空状態
  if (confirmations.length === 0) {
    return (
      <Card className="rounded-md border border-slate-200/60 shadow-sm hover:border-slate-300/60 transition-colors">
        <CardContent className="p-6">
          <p className="text-[13px] text-slate-500">
            受入条件が登録されていません。
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-md border border-slate-200/60 shadow-sm hover:border-slate-300/60 transition-colors">
      <CardContent className="p-6 space-y-3">
        <AcceptanceConfirmationHeader
          selectedCount={selectedIds.size}
          totalCount={confirmations.length}
          saving={saving}
          onSelectAll={toggleSelectAll}
          onBulkOk={() => handleBulkUpdate("verified_ok")}
          onBulkNg={() => handleBulkUpdate("verified_ng")}
        />

        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[13px]">
          <div>
            <span className="text-slate-500">総数:</span>
            <span className="ml-2 font-mono text-slate-900">{total}</span>
          </div>
          <div>
            <span className="text-slate-500">OK:</span>
            <span className="ml-2 font-mono text-emerald-600">{okCount}</span>
          </div>
          <div>
            <span className="text-slate-500">NG:</span>
            <span className="ml-2 font-mono text-rose-600">{ngCount}</span>
          </div>
          <div>
            <span className="text-slate-500">未確認:</span>
            <span className="ml-2 font-mono text-amber-600">{unverifiedCount}</span>
          </div>
          <div>
            <span className="text-slate-500">達成率:</span>
            <span className="ml-2 font-mono text-slate-900">{completionRate.toFixed(1)}%</span>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2">
            <p className="text-[12px] text-rose-600">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          {confirmations.map((item) => (
            <AcceptanceConfirmationItem
              key={item.id}
              item={item}
              selected={selectedIds.has(item.id)}
              saving={saving}
              editing={edit.editingId === item.id}
              editForm={edit.editForm}
              onSelect={() => toggleSelect(item.id)}
              onEditStart={() => edit.startEdit(item)}
              onEditCancel={edit.cancelEdit}
              onSaveOk={() => handleSave(item.id, "verified_ok")}
              onSaveNg={() => handleSave(item.id, "verified_ng")}
              onEditFormChange={edit.updateFormField}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
