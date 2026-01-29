import { TableHead, TableRow } from "@/components/ui/table";
import { DataTable } from "@/components/ui/data-table";
import { ChangeRequestRow } from "./change-request-row";
import type { ChangeRequest } from "@/lib/domain/value-objects";

export interface ChangeRequestTableProps {
	loading: boolean;
	requests: ChangeRequest[];
	searchQuery: string;
	statusFilter: string;
	onRowClick: (ticketId: string) => void;
	onDelete: (id: string, ticketId: string) => void;
}

export function ChangeRequestTable({
	loading,
	requests,
	searchQuery,
	statusFilter,
	onRowClick,
	onDelete,
}: ChangeRequestTableProps) {
	const isFiltered = searchQuery !== "" || statusFilter !== "all";

	return (
		<DataTable
			loading={loading}
			isEmpty={requests.length === 0}
			isFiltered={isFiltered}
			emptyMessage="変更要求がありません。"
			filteredEmptyMessage="該当する変更要求がありません。"
			colSpan={8}
			header={
				<TableRow className="border-b border-slate-200">
					<TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
						ID
					</TableHead>
					<TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
						タイトル
					</TableHead>
					<TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
						優先度
					</TableHead>
					<TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
						ステータス
					</TableHead>
					<TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
						起票者
					</TableHead>
					<TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
						確認済み率
					</TableHead>
					<TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
						起票日
					</TableHead>
					<TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
						操作
					</TableHead>
				</TableRow>
			}
		>
			{requests.map((request) => (
				<ChangeRequestRow
					key={request.id}
					request={request}
					onRowClick={onRowClick}
					onDelete={onDelete}
				/>
			))}
		</DataTable>
	);
}
