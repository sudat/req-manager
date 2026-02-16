"use client";

import { useState } from "react";
import { IdNameBadge } from "@/components/ui/id-name-badge";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { TaskSelectionDialog } from "./TaskSelectionDialog";
import type { Task } from "@/lib/domain";

interface TaskTriggerFieldProps {
	label: string;
	description: string;
	selectedTaskIds: string[];
	onDescriptionChange: (value: string) => void;
	onSelectedTaskIdsChange: (ids: string[]) => void;
	tasks: Task[];
	currentTaskId: string;
	helperText?: string;
}

export function TaskTriggerField({
	label,
	description,
	selectedTaskIds,
	onDescriptionChange,
	onSelectedTaskIdsChange,
	tasks,
	currentTaskId,
	helperText,
}: TaskTriggerFieldProps) {
	const [dialogOpen, setDialogOpen] = useState(false);

	// 選択中のタスク情報を取得
	const selectedTasks = tasks.filter((task) =>
		selectedTaskIds.includes(task.id),
	);

	const handleRemoveTask = (taskId: string) => {
		onSelectedTaskIdsChange(selectedTaskIds.filter((id) => id !== taskId));
	};

	return (
		<div className="space-y-2">
			<Label className="text-[14px] font-bold text-slate-900 border-l-4 border-primary pl-3 -ml-3">
				{label}
			</Label>
			{helperText && <p className="text-[12px] text-slate-500">{helperText}</p>}

			{/* フリーテキスト入力 */}
			<Input
				value={description}
				onChange={(e) => onDescriptionChange(e.target.value)}
				placeholder="業務開始のトリガー条件を入力（例：前工程の承認完了時）"
				className="text-[14px]"
			/>

			{/* 業務選択ボタン */}
			<div className="flex items-center gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => setDialogOpen(true)}
					className="text-[13px]"
				>
					<Plus className="w-4 h-4 mr-1" />
					業務を追加
				</Button>
				{selectedTaskIds.length > 0 && (
					<span className="text-[12px] text-slate-500">
						{selectedTaskIds.length}件選択中
					</span>
				)}
			</div>

			{/* 選択中の業務バッジ */}
			{selectedTasks.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{selectedTasks.map((task) => (
						<IdNameBadge
							key={task.id}
							id={task.id}
							name={task.name}
							onRemove={() => handleRemoveTask(task.id)}
						/>
					))}
				</div>
			)}

			{/* 業務選択ダイアログ */}
			<TaskSelectionDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				tasks={tasks}
				selectedIds={selectedTaskIds}
				onSelectionChange={onSelectedTaskIdsChange}
				currentTaskId={currentTaskId}
			/>
		</div>
	);
}
