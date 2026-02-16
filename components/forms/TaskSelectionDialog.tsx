"use client";

import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Task } from "@/lib/domain";

interface TaskSelectionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	tasks: Task[];
	selectedIds: string[];
	onSelectionChange: (selectedIds: string[]) => void;
	currentTaskId: string; // 自分自身を除外するため
}

export function TaskSelectionDialog({
	open,
	onOpenChange,
	tasks,
	selectedIds,
	onSelectionChange,
	currentTaskId,
}: TaskSelectionDialogProps) {
	const [searchQuery, setSearchQuery] = useState("");

	// 自分自身を除外してフィルタリング
	const availableTasks = useMemo(() => {
		return tasks.filter((task) => task.id !== currentTaskId);
	}, [tasks, currentTaskId]);

	// 検索フィルタ
	const filteredTasks = useMemo(() => {
		if (!searchQuery.trim()) return availableTasks;
		const query = searchQuery.toLowerCase();
		return availableTasks.filter(
			(task) =>
				task.id.toLowerCase().includes(query) ||
				task.name.toLowerCase().includes(query)
		);
	}, [availableTasks, searchQuery]);

	const handleToggle = (taskId: string, checked: boolean) => {
		if (checked) {
			onSelectionChange([...selectedIds, taskId]);
		} else {
			onSelectionChange(selectedIds.filter((id) => id !== taskId));
		}
	};

	const handleClose = () => {
		setSearchQuery("");
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="max-w-[520px] max-h-[70vh] overflow-hidden">
				<DialogHeader>
					<DialogTitle className="text-[16px]">業務を選択</DialogTitle>
				</DialogHeader>

				<div className="space-y-3">
					<Input
						placeholder="ID/名称で検索..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>

					<div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
						{filteredTasks.length === 0 ? (
							<p className="text-[13px] text-slate-500">該当する業務がありません。</p>
						) : (
							filteredTasks.map((task) => (
								<label
									key={task.id}
									className="flex items-center gap-2 text-[14px] text-slate-700 cursor-pointer hover:bg-slate-50 p-1 rounded"
								>
									<input
										type="checkbox"
										checked={selectedIds.includes(task.id)}
										onChange={(e) => handleToggle(task.id, e.target.checked)}
										className="h-4 w-4 rounded border-slate-300"
									/>
									<span className="font-mono text-[11px] text-slate-500 shrink-0">
										{task.id}
									</span>
									<span className="truncate" title={`${task.id}: ${task.name}`}>
										{task.name}
									</span>
								</label>
							))
						)}
					</div>

					{selectedIds.length > 0 && (
						<div className="pt-2 border-t border-slate-200">
							<p className="text-[12px] text-slate-500">
								{selectedIds.length}件選択中
							</p>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
