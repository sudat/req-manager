import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

export interface ChangeRequestListToolbarProps {
  searchQuery: string;
  statusFilter: string;
  onSearchChange: (query: string) => void;
  onStatusChange: (filter: string) => void;
}

export function ChangeRequestListToolbar({
  searchQuery,
  statusFilter,
  onSearchChange,
  onStatusChange,
}: ChangeRequestListToolbarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-4 rounded-md border border-slate-200 bg-slate-50/50 px-4 py-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="変更要求を検索..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-3 py-1.5 bg-transparent border-0 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
      </div>
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="すべてのステータス" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべてのステータス</SelectItem>
          <SelectItem value="open">オープン</SelectItem>
          <SelectItem value="review">レビュー中</SelectItem>
          <SelectItem value="approved">承認済</SelectItem>
          <SelectItem value="applied">適用済</SelectItem>
        </SelectContent>
      </Select>
      <Link href="/tickets/create">
        <Button className="h-8 gap-2 text-[14px] bg-slate-900 hover:bg-slate-800">
          <Plus className="h-4 w-4" />
          追加
        </Button>
      </Link>
    </div>
  );
}
