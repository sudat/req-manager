/**
 * 汎用データテーブルラッパー
 *
 * ローディング、エラー、空メッセージの共通処理を提供
 */

import {
	Table,
	TableBody,
	TableCell,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/skeleton";

export interface DataTableProps {
	/** ローディング状態 */
	loading: boolean;

	/** エラーメッセージ（オプション） */
	error?: string | null;

	/** データが空かどうか */
	isEmpty: boolean;

	/** フィルタ適用中かどうか */
	isFiltered: boolean;

	/** データなし時のメッセージ */
	emptyMessage: string;

	/** フィルタ適用時のデータなしメッセージ */
	filteredEmptyMessage: string;

	/** テーブルのカラム数（colSpan用） */
	colSpan: number;

	/** テーブルヘッダー（TableHeader の children） */
	header: React.ReactNode;

	/** テーブルボディの内容（データ行のリスト） */
	children: React.ReactNode;
}

/**
 * 汎用データテーブル
 *
 * @example
 * ```tsx
 * <DataTable
 *   loading={loading}
 *   isEmpty={items.length === 0}
 *   isFiltered={query !== ""}
 *   emptyMessage="データがありません"
 *   filteredEmptyMessage="該当するデータがありません"
 *   colSpan={6}
 *   header={
 *     <TableRow>
 *       <TableHead>ID</TableHead>
 *       <TableHead>名前</TableHead>
 *     </TableRow>
 *   }
 * >
 *   {items.map(item => <ItemRow key={item.id} item={item} />)}
 * </DataTable>
 * ```
 */
export function DataTable({
	loading,
	error,
	isEmpty,
	isFiltered,
	emptyMessage,
	filteredEmptyMessage,
	colSpan,
	header,
	children,
}: DataTableProps) {
	return (
		<div className="rounded-md border border-slate-200 bg-white overflow-hidden">
			<Table>
				<TableHeader>{header}</TableHeader>
				<TableBody>
					{loading ? (
						<TableSkeleton cols={colSpan} rows={5} />
					) : error ? (
						<TableRow>
							<TableCell
								colSpan={colSpan}
								className="px-4 py-10 text-center text-[14px] text-rose-600"
							>
								{error}
							</TableCell>
						</TableRow>
					) : isEmpty ? (
						<TableRow>
							<TableCell
								colSpan={colSpan}
								className="px-4 py-10 text-center text-[14px] text-slate-500"
							>
								{isFiltered ? filteredEmptyMessage : emptyMessage}
							</TableCell>
						</TableRow>
					) : (
						children
					)}
				</TableBody>
			</Table>
		</div>
	);
}
