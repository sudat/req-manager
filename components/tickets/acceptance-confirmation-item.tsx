import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import type { AcceptanceConfirmation, AcceptanceConfirmationStatus } from "@/lib/domain/value-objects";
import type { EditForm } from "@/hooks/use-acceptance-edit";
import { AcceptanceConfirmationEditForm } from "./acceptance-confirmation-edit-form";
import { AcceptanceConfirmationView } from "./acceptance-confirmation-view";

const statusLabels: Record<AcceptanceConfirmationStatus, string> = {
  unverified: "未確認",
  verified_ok: "確認済み(OK)",
  verified_ng: "確認済み(NG)",
};

const statusBadgeVariant = (status: AcceptanceConfirmationStatus) => {
  switch (status) {
    case "verified_ok":
      return "border-emerald-200 bg-emerald-50 text-emerald-600";
    case "verified_ng":
      return "border-rose-200 bg-rose-50 text-rose-600";
    default:
      return "border-amber-200 bg-amber-50 text-amber-600";
  }
};

const statusIcon = (status: AcceptanceConfirmationStatus) => {
  switch (status) {
    case "verified_ok":
      return <CheckCircle2 className="h-4 w-4" />;
    case "verified_ng":
      return <XCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

export interface AcceptanceConfirmationItemProps {
  item: AcceptanceConfirmation;
  selected: boolean;
  saving: boolean;
  editing: boolean;
  editForm: EditForm;
  onSelect: () => void;
  onEditStart: () => void;
  onEditCancel: () => void;
  onSaveOk: () => void;
  onSaveNg: () => void;
  onEditFormChange: (field: keyof EditForm, value: string) => void;
}

export function AcceptanceConfirmationItem({
  item,
  selected,
  saving,
  editing,
  editForm,
  onSelect,
  onEditStart,
  onEditCancel,
  onSaveOk,
  onSaveNg,
  onEditFormChange,
}: AcceptanceConfirmationItemProps) {
  return (
    <div
      className={`rounded-md border p-6 transition-colors ${
        selected
          ? "border-slate-400 bg-slate-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className="mt-1 h-4 w-4 rounded border-slate-300"
          disabled={saving}
        />

        <div className="flex-1 min-w-0">
          {/* ヘッダー: ID + 説明 */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <div className="font-mono text-[11px] text-slate-400">
                {item.acceptanceCriterionId}
              </div>
              <p className="text-[13px] text-slate-700 mt-1">
                {item.acceptanceCriterionDescription}
              </p>
              {item.acceptanceCriterionVerificationMethod && (
                <p className="text-[12px] text-slate-500 mt-1">
                  確認方法: {item.acceptanceCriterionVerificationMethod}
                </p>
              )}
            </div>

            {/* ステータスバッジ */}
            <Badge
              variant="outline"
              className={`flex items-center gap-1 text-[12px] ${statusBadgeVariant(
                item.status
              )}`}
            >
              {statusIcon(item.status)}
              {statusLabels[item.status]}
            </Badge>
          </div>

          {/* 編集モード: エビデンス入力 */}
          {editing ? (
            <AcceptanceConfirmationEditForm
              editForm={editForm}
              saving={saving}
              onFormChange={onEditFormChange}
              onSaveOk={onSaveOk}
              onSaveNg={onSaveNg}
              onCancel={onEditCancel}
            />
          ) : (
            /* 表示モード: 確認情報 */
            <AcceptanceConfirmationView
              confirmation={item}
              saving={saving}
              onEditStart={onEditStart}
            />
          )}

          {/* エビデンス表示（確認済みの場合） */}
          {!editing && item.evidence && (
            <div className="mt-2 p-2 rounded-md bg-slate-50">
              <p className="text-[12px] text-slate-600 whitespace-pre-wrap">
                {item.evidence}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
