import { useEffect, useState } from "react";
import type { Task } from "@/lib/domain";
import { listTasksByBusinessId, deleteTask } from "@/lib/data/tasks";
import { useProject } from "@/components/project/project-context";

export interface UseBusinessTasksReturn {
	tasks: Task[];
	loading: boolean;
	error: string | null;
	deleteTask: (task: Task) => Promise<void>;
	clearError: () => void;
}

export const useBusinessTasks = (businessId: string): UseBusinessTasksReturn => {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { currentProjectId, loading: projectLoading } = useProject();

	useEffect(() => {
		if (projectLoading) return;
		if (!currentProjectId) {
			setError("プロジェクトが選択されていません");
			setTasks([]);
			setLoading(false);
			return;
		}
		if (!businessId) {
			setError("業務領域が指定されていません");
			setTasks([]);
			setLoading(false);
			return;
		}
		let active = true;
		const fetchData = async () => {
			setLoading(true);
			const { data: taskRows, error: taskError } = await listTasksByBusinessId(businessId, currentProjectId);
			if (!active) return;
			if (taskError) {
				setError(taskError);
				setTasks([]);
			} else {
				setError(null);
				setTasks(taskRows ?? []);
			}
			setLoading(false);
		};
		fetchData();
		return () => {
			active = false;
		};
	}, [businessId, currentProjectId, projectLoading]);

	const handleDeleteTask = async (task: Task) => {
		if (projectLoading || !currentProjectId) {
			setError("プロジェクトが選択されていません");
			return;
		}
		const { error: deleteError } = await deleteTask(task.id, currentProjectId);
		if (deleteError) {
			setError(deleteError);
			return;
		}
		setTasks((prev) => prev.filter((item) => item.id !== task.id));
	};

	const clearError = () => setError(null);

	return {
		tasks,
		loading,
		error,
		deleteTask: handleDeleteTask,
		clearError,
	};
};
