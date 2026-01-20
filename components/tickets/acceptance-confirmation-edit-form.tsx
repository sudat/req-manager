import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle } from "lucide-react";
import type { EditForm } from "@/hooks/use-acceptance-edit";

export interface AcceptanceConfirmationEditFormProps {
  editForm: EditForm;
  saving: boolean;
  onFormChange: (field: keyof EditForm, value: string) => void;
  onSaveOk: () => void;
  onSaveNg: () => void;
  onCancel: () => void;
}

export function AcceptanceConfirmationEditForm({
  editForm,
  saving,
  onFormChange,
  onSaveOk,
  onSaveNg,
  onCancel,
}: AcceptanceConfirmationEditFormProps) {
  return (
    <div className="space-y-2 mt-2 pt-2 border-t border-slate-100">
      <div className="space-y-1">
        <Label className="text-[11px] text-slate-500">確認者</Label>
        <Input
          value={editForm.verifiedBy}
          onChange={(e) => onFormChange("verifiedBy", e.target.value)}
          placeholder="確認者名"
          className="h-7 text-[13px]"
          disabled={saving}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-[11px] text-slate-500">
          エビデンス・確認根拠
        </Label>
        <Textarea
          value={editForm.evidence}
          onChange={(e) => onFormChange("evidence", e.target.value)}
          placeholder="確認結果やエビデンスを記述..."
          className="min-h-[60px] text-[13px]"
          disabled={saving}
        />
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[12px] border-emerald-200 text-emerald-600 hover:bg-emerald-50"
          onClick={onSaveOk}
          disabled={saving || !editForm.verifiedBy}
        >
          <CheckCircle2 className="h-3 w-3 mr-1" />
          OKで保存
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[12px] border-rose-200 text-rose-600 hover:bg-rose-50"
          onClick={onSaveNg}
          disabled={saving || !editForm.verifiedBy}
        >
          <XCircle className="h-3 w-3 mr-1" />
          NGで保存
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-[12px]"
          onClick={onCancel}
          disabled={saving}
        >
          キャンセル
        </Button>
      </div>
    </div>
  );
}
