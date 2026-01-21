import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";

export interface AcceptanceConfirmationHeaderProps {
  selectedCount: number;
  totalCount: number;
  saving: boolean;
  onSelectAll: () => void;
  onBulkOk: () => void;
  onBulkNg: () => void;
}

export function AcceptanceConfirmationHeader({
  selectedCount,
  totalCount,
  saving,
  onSelectAll,
  onBulkOk,
  onBulkNg,
}: AcceptanceConfirmationHeaderProps) {
  const allSelected = selectedCount === totalCount;

  return (
    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
      <h3 className="section-heading border-0 p-0 text-[18px]">
        受入条件確認
      </h3>
      <div className="flex items-center gap-2">
        {selectedCount > 0 && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[12px] border-emerald-200 text-emerald-600 hover:bg-emerald-50"
              onClick={onBulkOk}
              disabled={saving}
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              一括OK ({selectedCount})
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[12px] border-rose-200 text-rose-600 hover:bg-rose-50"
              onClick={onBulkNg}
              disabled={saving}
            >
              <XCircle className="h-3 w-3 mr-1" />
              一括NG ({selectedCount})
            </Button>
          </>
        )}
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[12px]"
          onClick={onSelectAll}
          disabled={saving}
        >
          {allSelected ? "全解除" : "全選択"}
        </Button>
      </div>
    </div>
  );
}
