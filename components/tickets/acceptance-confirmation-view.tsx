import { Button } from "@/components/ui/button";
import type { AcceptanceConfirmation } from "@/lib/domain/value-objects";

export interface AcceptanceConfirmationViewProps {
  confirmation: AcceptanceConfirmation;
  saving: boolean;
  onEditStart: () => void;
}

export function AcceptanceConfirmationView({
  confirmation,
  saving,
  onEditStart,
}: AcceptanceConfirmationViewProps) {
  return (
    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
      <div className="text-[12px] text-slate-500">
        {confirmation.verifiedBy && (
          <span>確認者: {confirmation.verifiedBy}</span>
        )}
        {confirmation.verifiedAt && (
          <span className="ml-3">
            {new Date(confirmation.verifiedAt).toLocaleString("ja-JP")}
          </span>
        )}
      </div>
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-[12px]"
        onClick={onEditStart}
        disabled={saving}
      >
        確認
      </Button>
    </div>
  );
}
