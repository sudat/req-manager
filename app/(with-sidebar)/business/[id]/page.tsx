"use client"

import { use } from "react";
import { Sparkles } from "lucide-react";
import { ResourceListPage } from "@/components/resource-page/resource-list-page";
import { createBusinessTaskListConfig } from "@/config/resource-lists";
import { useBusinessTasks } from "@/hooks/use-business-tasks";
import { useBusinessByKey } from "@/hooks/use-business-by-key";

export default function BusinessTasksPage({ params }: { params: Promise<{ id: string }> }) {
	const { id: businessKey } = use(params);
	const { businessArea: resolvedArea, loading: businessLoading } = useBusinessByKey(businessKey);
	// undefined を渡すことで、Hook 側で「まだ取得中」として扱われる（エラーにならない）
	const { tasks, loading, error, deleteTask, clearError } = useBusinessTasks(resolvedArea ?? undefined);

	const config = createBusinessTaskListConfig(businessKey);

	return (
		<ResourceListPage
			items={tasks}
			loading={loading || businessLoading}
			error={error}
			config={config}
			onDelete={deleteTask}
			onClearError={clearError}
			breadcrumb={[
				{ label: "業務領域一覧", href: "/business" },
				{ label: "業務一覧（詳細）" },
			]}
			headerBadge={resolvedArea ?? businessKey}
			extraHeaderActions={[
				{
					label: "AIで追加",
					href: `/chat?screen=BD&bdId=${businessKey}`,
					icon: Sparkles,
					variant: "ai",
				},
			]}
		/>
	);
}
