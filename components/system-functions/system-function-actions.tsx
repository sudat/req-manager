import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2 } from "lucide-react";

interface SystemFunctionActionsProps {
  domainId: string;
  srfId: string;
  srfTitle: string;
  onView?: () => void;
  onEdit?: () => void;
  onDelete: () => void;
}

export const SystemFunctionActions = ({
  domainId,
  srfId,
  srfTitle,
  onView,
  onEdit,
  onDelete,
}: SystemFunctionActionsProps) => {
  return (
    <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
      <Link href={`/system-domains/${domainId}/${srfId}`} onClick={onView}>
        <Button
          size="icon"
          variant="outline"
          title="照会"
          className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </Link>
      <Link href={`/system-domains/${domainId}/${srfId}/edit`} onClick={onEdit}>
        <Button
          size="icon"
          variant="outline"
          title="編集"
          className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </Link>
      <Button
        size="icon"
        variant="outline"
        title="削除"
        className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900"
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};
