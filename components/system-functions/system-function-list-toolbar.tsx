import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import type { SrfCategory, SrfStatus } from "@/lib/domain";

interface SystemFunctionListToolbarProps {
  domainId: string;
  query: string;
  statusFilter: SrfStatus | "all";
  categoryFilter: SrfCategory | "all";
  onQueryChange: (query: string) => void;
  onStatusFilterChange: (filter: SrfStatus | "all") => void;
  onCategoryFilterChange: (filter: SrfCategory | "all") => void;
}

export const SystemFunctionListToolbar = ({
  domainId,
  query,
  statusFilter,
  categoryFilter,
  onQueryChange,
  onStatusFilterChange,
  onCategoryFilterChange,
}: SystemFunctionListToolbarProps) => {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-4 rounded-md border border-slate-200 bg-slate-50/50 px-4 py-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="システム機能を検索..."
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="w-full pl-10 pr-3 py-1.5 bg-transparent border-0 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
      </div>
      <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as SrfStatus | "all")}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="すべてのステータス" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべてのステータス</SelectItem>
          <SelectItem value="implemented">実装済</SelectItem>
          <SelectItem value="implementing">実装中</SelectItem>
          <SelectItem value="testing">テスト中</SelectItem>
          <SelectItem value="not_implemented">未実装</SelectItem>
        </SelectContent>
      </Select>
      <Select value={categoryFilter} onValueChange={(value) => onCategoryFilterChange(value as SrfCategory | "all")}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="すべての機能分類" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべての機能分類</SelectItem>
          <SelectItem value="screen">画面</SelectItem>
          <SelectItem value="internal">内部</SelectItem>
          <SelectItem value="interface">IF</SelectItem>
        </SelectContent>
      </Select>
      <Link href={`/system-domains/${domainId}/functions/create`}>
        <Button className="h-8 px-4 text-[14px] font-medium bg-slate-900 hover:bg-slate-800 gap-2">
          <Plus className="h-4 w-4" />
          追加
        </Button>
      </Link>
    </div>
  );
};
