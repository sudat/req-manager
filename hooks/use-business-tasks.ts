import { useEffect, useState } from "react";
import type { Task } from "@/lib/domain";
import { listTasksByBusinessArea, deleteTask } from "@/lib/data/tasks";
import { useProject } from "@/components/project/project-context";

export interface UseBusinessTasksReturn {
	tasks: Task[];
	loading: boolean;
	error: string | null;
	deleteTask: (task: Task) => Promise<void>;
	clearError: () => void;
}

export const useBusinessTasks = (businessArea: string | null | undefined): UseBusinessTasksReturn => {
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
		// null/undefined は「該当する業務領域が見つからない」としてエラー表示
		if (businessArea === null || businessArea === undefined) {
			setLoading(false);
			setError("該当する業務領域が見つかりません");
			setTasks([]);
			return;
		}
		// 空文字列が渡された場合はエラーにする（本来のバリデーション）
		if (businessArea === "") {
			setError("業務領域が指定されていません");
			setTasks([]);
			setLoading(false);
			return;
		}
		let active = true;
		const fetchData = async () => {
			setLoading(true);
			const { data: taskRows, error: taskError } = await listTasksByBusinessArea(businessArea, currentProjectId);
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
	}, [businessArea, currentProjectId, projectLoading]);

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
