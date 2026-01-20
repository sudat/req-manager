import type { SystemFunction } from "@/lib/domain";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/skeleton";
import { SystemFunctionRow } from "./system-function-row";

interface SystemFunctionTableProps {
  domainId: string;
  loading: boolean;
  error: string | null;
  functions: SystemFunction[];
  isFiltered: boolean;
  onRowClick: (srfId: string) => void;
  onDelete: (srf: SystemFunction) => void;
}

export const SystemFunctionTable = ({
  domainId,
  loading,
  error,
  functions,
  isFiltered,
  onRowClick,
  onDelete,
}: SystemFunctionTableProps) => {
  return (
    <div className="rounded-md border border-slate-200 bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-slate-200">
            <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
              ID
            </TableHead>
            <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
              機能名
            </TableHead>
            <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
              機能分類
            </TableHead>
            <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
              説明
            </TableHead>
            <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
              ステータス
            </TableHead>
            <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
              操作
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableSkeleton cols={6} rows={5} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={6} className="px-4 py-10 text-center text-[14px] text-rose-600">
                {error}
              </TableCell>
            </TableRow>
          ) : functions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="px-4 py-10 text-center text-[14px] text-slate-500">
                {isFiltered
                  ? "該当するシステム機能がありません。"
                  : "システム機能がありません。"}
              </TableCell>
            </TableRow>
          ) : (
            functions.map((srf) => (
              <SystemFunctionRow
                key={srf.id}
                srf={srf}
                domainId={domainId}
                onRowClick={() => onRowClick(srf.id)}
                onDelete={() => onDelete(srf)}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
