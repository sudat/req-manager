"use client"

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { TableRowActions } from "@/components/ui/table-row-actions";
import { stripMarkdown } from "@/lib/utils";
import { parseYamlKeySourceList } from "@/lib/utils/yaml";
import type { Task } from "@/lib/domain";

interface SortableTaskRowProps {
  task: Task;
  businessArea: string;
  onRowClick: () => void;
  onDelete: () => void;
}

export function SortableTaskRow({
  task,
  businessArea,
  onRowClick,
  onDelete,
}: SortableTaskRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatKeySource = (value: string) => {
    const parsed = parseYamlKeySourceList(value);
    const items = parsed.value.filter((item) => item.name || item.source);
    if (items.length === 0) return value;
    return items
      .map((item) => {
        const name = item.name || "—";
        const source = item.source ? ` / ${item.source}` : "";
        return `${name}${source}`;
      })
      .join(" | ");
  };

  const inputLabel = formatKeySource(task.input);
  const outputLabel = formatKeySource(task.output);

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className="cursor-pointer border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"
      onClick={onRowClick}
    >
      {/* ドラッグハンドル列 */}
      <TableCell className="w-10 px-2 py-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600"
          aria-label="ドラッグして並び替え"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </TableCell>
      <TableCell className="px-4 py-3">
        <span className="font-mono text-[12px] text-slate-400">{task.id}</span>
      </TableCell>
      <TableCell className="px-4 py-3">
        <span className="text-[14px] font-medium text-slate-900">{task.name}</span>
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="max-w-[300px] truncate text-[13px] text-slate-600" title={stripMarkdown(task.summary)}>
          {stripMarkdown(task.summary)}
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="max-w-[150px] truncate text-[13px] text-slate-600" title={inputLabel}>
          {inputLabel}
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="max-w-[150px] truncate text-[13px] text-slate-600" title={outputLabel}>
          {outputLabel}
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <TableRowActions
          viewHref={`/business/${businessArea}/${task.id}`}
          editHref={`/business/${businessArea}/${task.id}/edit`}
          onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  );
}
