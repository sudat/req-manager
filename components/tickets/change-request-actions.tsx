import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ChangeRequestActionsProps {
  id: string;
  ticketId: string;
  onDelete: (id: string, ticketId: string) => void;
}

export function ChangeRequestActions({
  id,
  ticketId,
  onDelete,
}: ChangeRequestActionsProps) {
  return (
    <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
      <Link href={`/tickets/${id}`}>
        <Button
          size="icon"
          variant="outline"
          title="照会"
          className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </Link>
      <Link href={`/tickets/${id}/edit`}>
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
        className="h-8 w-8 rounded-md border-slate-200 hover:bg-rose-600 hover:text-white hover:border-rose-600"
        onClick={() => onDelete(id, ticketId)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
