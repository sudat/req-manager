"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GripVertical } from "lucide-react";
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
	useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	buildYamlProcessSteps,
	parseYamlProcessSteps,
	type ProcessStepItem,
} from "@/lib/utils/yaml";

type ProcessStepsFieldProps = {
	label: string;
	value: string;
	onChange: (value: string) => void;
	helperText?: string;
	whenPlaceholder?: string;
	whoPlaceholder?: string;
	actionPlaceholder?: string;
};

type ProcessStepRow = ProcessStepItem & {
	id: string;
};

type SortableProcessStepItemProps = {
	item: ProcessStepRow;
	whenPlaceholder: string;
	whoPlaceholder: string;
	actionPlaceholder: string;
	onItemChange: (id: string, key: keyof ProcessStepItem, value: string) => void;
	onRemove: (id: string) => void;
};

const EMPTY_PROCESS_STEP: ProcessStepItem = { when: "", who: "", action: "" };

function normalizeProcessSteps(items: ProcessStepItem[]): ProcessStepItem[] {
	return items.length > 0 ? items : [EMPTY_PROCESS_STEP];
}

function toProcessStepItem(item: ProcessStepRow): ProcessStepItem {
	return {
		when: item.when,
		who: item.who,
		action: item.action,
	};
}

function createProcessStepRow(item: ProcessStepItem, id?: string): ProcessStepRow {
	const rowId =
		id ??
		(typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
			? crypto.randomUUID()
			: `process-step-${Math.random().toString(36).slice(2, 10)}`);
	return {
		id: rowId,
		when: item.when,
		who: item.who,
		action: item.action,
	};
}

function SortableProcessStepItem({
	item,
	whenPlaceholder,
	whoPlaceholder,
	actionPlaceholder,
	onItemChange,
	onRemove,
}: SortableProcessStepItemProps) {
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
		<div
			ref={setNodeRef}
			style={style}
			className="grid gap-2 md:grid-cols-[auto_1.2fr_1fr_2fr_auto] items-center"
		>
			{/* ドラッグハンドル */}
			<button
				type="button"
				className="cursor-grab active:cursor-grabbing p-2 text-slate-400 hover:text-slate-600 touch-none"
				{...attributes}
				{...listeners}
				aria-label="ドラッグして順序を変更"
			>
				<GripVertical className="h-4 w-4" />
			</button>
			<Input
				value={item.when}
				onChange={(e) => onItemChange(item.id, "when", e.target.value)}
				placeholder={whenPlaceholder}
				className="text-[14px]"
			/>
			<Input
				value={item.who}
				onChange={(e) => onItemChange(item.id, "who", e.target.value)}
				placeholder={whoPlaceholder}
				className="text-[14px]"
			/>
			<Input
				value={item.action}
				onChange={(e) => onItemChange(item.id, "action", e.target.value)}
				placeholder={actionPlaceholder}
				className="text-[14px]"
			/>
			<Button
				type="button"
				variant="outline"
				className="h-9 px-3 text-[12px]"
				onClick={() => onRemove(item.id)}
			>
				削除
			</Button>
		</div>
	);
}

export function ProcessStepsField({
	label,
	value,
	onChange,
	helperText,
	whenPlaceholder = "いつ（タイミング）",
	whoPlaceholder = "誰が（ロール）",
	actionPlaceholder = "何をするか",
}: ProcessStepsFieldProps): ReactNode {
	const parsed = useMemo(() => parseYamlProcessSteps(value), [value]);
	const [rows, setRows] = useState<ProcessStepRow[]>(() =>
		normalizeProcessSteps(parsed.value).map((item) => createProcessStepRow(item))
	);

	const commit = (nextRows: ProcessStepRow[]) => {
		setRows(nextRows);
		onChange(buildYamlProcessSteps(nextRows.map(toProcessStepItem)));
	};

	const handleItemChange = (
		id: string,
		key: keyof ProcessStepItem,
		nextValue: string
	) => {
		const nextRows = rows.map((item) =>
			item.id === id ? { ...item, [key]: nextValue } : item
		);
		commit(nextRows);
	};

	const handleAdd = () => {
		commit([...rows, createProcessStepRow(EMPTY_PROCESS_STEP)]);
	};

	const handleRemove = (id: string) => {
		const nextRows = rows.filter((item) => item.id !== id);
		commit(nextRows.length > 0 ? nextRows : [createProcessStepRow(EMPTY_PROCESS_STEP)]);
	};

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 5,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const activeId = String(active.id);
			const overId = String(over.id);
			const oldIndex = rows.findIndex((item) => item.id === activeId);
			const newIndex = rows.findIndex((item) => item.id === overId);
			if (oldIndex < 0 || newIndex < 0) return;
			const reordered = arrayMove(rows, oldIndex, newIndex);
			commit(reordered);
		}
	};

	return (
		<div className="space-y-2">
			<Label className="text-[14px] font-bold text-slate-900 border-l-4 border-primary pl-3 -ml-3">{label}</Label>
			{helperText && <p className="text-[11px] text-slate-500">{helperText}</p>}
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={rows.map((item) => item.id)}
					strategy={verticalListSortingStrategy}
				>
					<div className="space-y-2">
						{rows.map((item) => (
							<SortableProcessStepItem
								key={item.id}
								item={item}
								whenPlaceholder={whenPlaceholder}
								whoPlaceholder={whoPlaceholder}
								actionPlaceholder={actionPlaceholder}
								onItemChange={handleItemChange}
								onRemove={handleRemove}
							/>
						))}
					</div>
				</SortableContext>
			</DndContext>
			<Button
				type="button"
				variant="outline"
				className="h-8 text-[12px]"
				onClick={handleAdd}
			>
				追加
			</Button>
			{parsed.error && (
				<p className="text-[12px] text-rose-600">
					既存のYAMLに構文エラーがあります。表示は概算です。
				</p>
			)}
		</div>
	);
}
