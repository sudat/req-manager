import type { SystemFunction } from "@/lib/domain";
import { TableHead, TableRow } from "@/components/ui/table";
import { DataTable } from "@/components/ui/data-table";
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
		<DataTable
			loading={loading}
			error={error}
			isEmpty={functions.length === 0}
			isFiltered={isFiltered}
			emptyMessage="システム機能がありません。"
			filteredEmptyMessage="該当するシステム機能がありません。"
			colSpan={6}
			header={
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
			}
		>
			{functions.map((srf) => (
				<SystemFunctionRow
					key={srf.id}
					srf={srf}
					domainId={domainId}
					onRowClick={() => onRowClick(srf.id)}
					onDelete={() => onDelete(srf)}
				/>
			))}
		</DataTable>
	);
};
