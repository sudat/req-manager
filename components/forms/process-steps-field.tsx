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
	stepIdPlaceholder?: string;
	conditionPlaceholder?: string;
	parallelPlaceholder?: string;
	exceptionConditionPlaceholder?: string;
	exceptionToPlaceholder?: string;
};

type ProcessStepRow = {
	rowId: string;
	stepId: string;
	when: string;
	who: string;
	action: string;
	condition: string;
	parallel: string;
	exceptionCondition: string;
	exceptionTo: string;
};

type ProcessStepRowField = Exclude<keyof ProcessStepRow, "rowId">;

type SortableProcessStepItemProps = {
	item: ProcessStepRow;
	whenPlaceholder: string;
	whoPlaceholder: string;
	actionPlaceholder: string;
	stepIdPlaceholder: string;
	conditionPlaceholder: string;
	parallelPlaceholder: string;
	exceptionConditionPlaceholder: string;
	exceptionToPlaceholder: string;
	stepIdCandidates: string[];
	onItemChange: (
		rowId: string,
		key: ProcessStepRowField,
		value: string
	) => void;
	onRemove: (rowId: string) => void;
};

const EMPTY_PROCESS_STEP: ProcessStepItem = { when: "", who: "", action: "" };

function normalizeProcessSteps(items: ProcessStepItem[]): ProcessStepItem[] {
	return items.length > 0 ? items : [EMPTY_PROCESS_STEP];
}

function toProcessStepItem(item: ProcessStepRow): ProcessStepItem {
	const exceptionCondition = item.exceptionCondition.trim();
	const exceptionTo = item.exceptionTo.trim();
	return {
		id: item.stepId.trim() || undefined,
		when: item.when,
		who: item.who,
		action: item.action,
		condition: item.condition.trim() || undefined,
		parallel: item.parallel.trim() || undefined,
		exception:
			exceptionCondition || exceptionTo
				? { condition: exceptionCondition, to: exceptionTo }
				: undefined,
	};
}

function createProcessStepRow(item: ProcessStepItem, rowId?: string): ProcessStepRow {
	const generatedRowId =
		rowId ??
		(typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
			? crypto.randomUUID()
			: `process-step-${Math.random().toString(36).slice(2, 10)}`);
	return {
		rowId: generatedRowId,
		stepId: item.id?.trim() ?? "",
		when: item.when,
		who: item.who,
		action: item.action,
		condition: item.condition?.trim() ?? "",
		parallel: item.parallel?.trim() ?? "",
		exceptionCondition: item.exception?.condition?.trim() ?? "",
		exceptionTo: item.exception?.to?.trim() ?? "",
	};
}

function SortableProcessStepItem({
	item,
	whenPlaceholder,
	whoPlaceholder,
	actionPlaceholder,
	stepIdPlaceholder,
	conditionPlaceholder,
	parallelPlaceholder,
	exceptionConditionPlaceholder,
	exceptionToPlaceholder,
	stepIdCandidates,
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
	} = useSortable({ id: item.rowId });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	const hasConditionParallelConflict =
		item.condition.trim().length > 0 && item.parallel.trim().length > 0;
	const suggestionListId = `process-step-id-list-${item.rowId}`;

	return (
		<div
			ref={setNodeRef}
			style={style}
			className="rounded-md border border-slate-200 bg-white p-3 space-y-2"
		>
			<div className="grid items-center gap-2 md:grid-cols-[auto_1.2fr_1fr_2fr_auto]">
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
					onChange={(e) => onItemChange(item.rowId, "when", e.target.value)}
					placeholder={whenPlaceholder}
					className="text-[14px]"
				/>
				<Input
					value={item.who}
					onChange={(e) => onItemChange(item.rowId, "who", e.target.value)}
					placeholder={whoPlaceholder}
					className="text-[14px]"
				/>
				<Input
					value={item.action}
					onChange={(e) => onItemChange(item.rowId, "action", e.target.value)}
					placeholder={actionPlaceholder}
					className="text-[14px]"
				/>
				<Button
					type="button"
					variant="outline"
					className="h-9 px-3 text-[12px]"
					onClick={() => onRemove(item.rowId)}
				>
					削除
				</Button>
			</div>

			<div className="grid gap-2 md:grid-cols-5 md:pl-10">
				<Input
					value={item.stepId}
					onChange={(e) => onItemChange(item.rowId, "stepId", e.target.value)}
					placeholder={stepIdPlaceholder}
					className="text-[12px]"
				/>
				<Input
					value={item.condition}
					onChange={(e) =>
						onItemChange(item.rowId, "condition", e.target.value)
					}
					placeholder={conditionPlaceholder}
					className="text-[12px]"
				/>
				<Input
					value={item.parallel}
					onChange={(e) =>
						onItemChange(item.rowId, "parallel", e.target.value)
					}
					placeholder={parallelPlaceholder}
					className="text-[12px]"
				/>
				<Input
					value={item.exceptionCondition}
					onChange={(e) =>
						onItemChange(item.rowId, "exceptionCondition", e.target.value)
					}
					placeholder={exceptionConditionPlaceholder}
					className="text-[12px]"
				/>
				<>
					<Input
						value={item.exceptionTo}
						onChange={(e) =>
							onItemChange(item.rowId, "exceptionTo", e.target.value)
						}
						placeholder={exceptionToPlaceholder}
						className="text-[12px]"
						list={suggestionListId}
					/>
					<datalist id={suggestionListId}>
						{stepIdCandidates.map((candidate) => (
							<option key={candidate} value={candidate} />
						))}
					</datalist>
				</>
			</div>

			{hasConditionParallelConflict && (
				<p className="text-[12px] text-amber-600 md:pl-10">
					condition と parallel は同時指定できません。
				</p>
			)}
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
	stepIdPlaceholder = "step id（例: s1）",
	conditionPlaceholder = "分岐条件（例: 金額が100万以上）",
	parallelPlaceholder = "並行グループID（例: p1）",
	exceptionConditionPlaceholder = "例外条件（例: 在庫不足）",
	exceptionToPlaceholder = "例外遷移先 step id（例: s9）",
}: ProcessStepsFieldProps): ReactNode {
	const parsed = useMemo(() => parseYamlProcessSteps(value), [value]);
	const [rows, setRows] = useState<ProcessStepRow[]>(() =>
		normalizeProcessSteps(parsed.value).map((item) => createProcessStepRow(item))
	);

	const stepIdCandidates = useMemo(
		() => [...new Set(rows.map((row) => row.stepId.trim()).filter(Boolean))],
		[rows]
	);

	const commit = (nextRows: ProcessStepRow[]) => {
		setRows(nextRows);
		onChange(buildYamlProcessSteps(nextRows.map(toProcessStepItem)));
	};

	const handleItemChange = (
		rowId: string,
		key: ProcessStepRowField,
		nextValue: string
	) => {
		const nextRows = rows.map((item) =>
			item.rowId === rowId ? { ...item, [key]: nextValue } : item
		);
		commit(nextRows);
	};

	const handleAdd = () => {
		commit([...rows, createProcessStepRow(EMPTY_PROCESS_STEP)]);
	};

	const handleRemove = (rowId: string) => {
		const nextRows = rows.filter((item) => item.rowId !== rowId);
		commit(
			nextRows.length > 0 ? nextRows : [createProcessStepRow(EMPTY_PROCESS_STEP)]
		);
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
			const oldIndex = rows.findIndex((item) => item.rowId === activeId);
			const newIndex = rows.findIndex((item) => item.rowId === overId);
			if (oldIndex < 0 || newIndex < 0) return;
			const reordered = arrayMove(rows, oldIndex, newIndex);
			commit(reordered);
		}
	};

	return (
		<div className="space-y-2">
			<Label className="text-[14px] font-bold text-slate-900 border-l-4 border-primary pl-3 -ml-3">
				{label}
			</Label>
			{helperText && <p className="text-[11px] text-slate-500">{helperText}</p>}
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={rows.map((item) => item.rowId)}
					strategy={verticalListSortingStrategy}
				>
					<div className="space-y-2">
						{rows.map((item) => (
							<SortableProcessStepItem
								key={item.rowId}
								item={item}
								whenPlaceholder={whenPlaceholder}
								whoPlaceholder={whoPlaceholder}
								actionPlaceholder={actionPlaceholder}
								stepIdPlaceholder={stepIdPlaceholder}
								conditionPlaceholder={conditionPlaceholder}
								parallelPlaceholder={parallelPlaceholder}
								exceptionConditionPlaceholder={exceptionConditionPlaceholder}
								exceptionToPlaceholder={exceptionToPlaceholder}
								stepIdCandidates={stepIdCandidates}
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
