"use client"

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import type { ResourceListConfig, ActionButton } from "@/config/resource-lists";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface SortableResourceRowProps<T> {
	item: T;
	config: ResourceListConfig<T>;
	onRowClick: () => void;
	actions: React.ReactNode[];
}

export function SortableResourceRow<T extends { id: string }>({
	item,
	config,
	onRowClick,
	actions,
}: SortableResourceRowProps<T>) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: item.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<TableRow
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			className="cursor-grab active:cursor-grabbing border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"
			aria-label="ドラッグして並び替え"
		>
			{/* ドラッグハンドル列 */}
			<TableCell className="w-10 px-2 py-3">
				<div className="text-slate-400" aria-hidden="true">
					<GripVertical className="h-4 w-4" />
				</div>
			</TableCell>
			{config.columns.map((col) => (
				<TableCell key={col.id} className={col.className}>
					{col.cell(item)}
				</TableCell>
			))}
			{actions.length > 0 && (
				<TableCell className="px-4 py-3">
					<div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
						{actions}
					</div>
				</TableCell>
			)}
		</TableRow>
	);
}
