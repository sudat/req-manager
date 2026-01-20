import { Badge } from "@/components/ui/badge";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import type { SystemFunction } from "@/lib/domain";
import { stripMarkdown } from "@/lib/utils";
import { SystemFunctionActions } from "./system-function-actions";

const statusLabels: Record<string, string> = {
  not_implemented: "未実装",
  implementing: "実装中",
  testing: "テスト中",
  implemented: "実装済",
};

const categoryLabels: Record<string, string> = {
  screen: "画面",
  internal: "内部",
  interface: "IF",
};

interface SystemFunctionRowProps {
  srf: SystemFunction;
  domainId: string;
  onRowClick: () => void;
  onDelete: () => void;
}

export const SystemFunctionRow = ({
  srf,
  domainId,
  onRowClick,
  onDelete,
}: SystemFunctionRowProps) => {
  return (
    <TableRow
      className="cursor-pointer border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"
      onClick={onRowClick}
    >
      <TableCell className="px-4 py-3">
        <span className="font-mono text-[12px] text-slate-400">{srf.id}</span>
      </TableCell>
      <TableCell className="px-4 py-3">
        <span className="text-[14px] font-medium text-slate-900">{srf.title}</span>
      </TableCell>
      <TableCell className="px-4 py-3">
        <Badge variant="outline" className="border-slate-200/60 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5">
          {categoryLabels[srf.category]}
        </Badge>
      </TableCell>
      <TableCell className="px-4 py-3">
        <span className="text-[13px] text-slate-600 truncate max-w-[300px] block" title={stripMarkdown(srf.summary)}>
          {stripMarkdown(srf.summary)}
        </span>
      </TableCell>
      <TableCell className="px-4 py-3">
        <Badge variant="outline" className="border-slate-200/60 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5">
          {statusLabels[srf.status]}
        </Badge>
      </TableCell>
      <TableCell className="px-4 py-3">
        <SystemFunctionActions
          domainId={domainId}
          srfId={srf.id}
          srfTitle={srf.title}
          onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  );
};
