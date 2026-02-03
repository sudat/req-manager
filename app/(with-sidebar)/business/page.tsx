"use client";

import { listBusinessesWithRequirementCounts, deleteBusiness } from "@/lib/data/businesses";
import { ResourceListPage } from "@/components/resource-page/resource-list-page";
import { businessListConfig } from "@/config/resource-lists";
import { useProject } from "@/components/project/project-context";

export default function BusinessPage() {
	const { currentProjectId, loading: projectLoading } = useProject();

	const fetchData = async () => {
		if (projectLoading) {
			// プロジェクト読み込み中はデータ取得を待つ
			return { data: null, error: null };
		}
		if (!currentProjectId) {
			return { data: null, error: "プロジェクトが選択されていません" };
		}
		return listBusinessesWithRequirementCounts(currentProjectId);
	};

	return (
		<ResourceListPage
			config={businessListConfig}
			fetchData={fetchData}
			loading={projectLoading}
			deleteItem={(id: string) => {
				if (projectLoading || !currentProjectId) {
					return Promise.resolve({ data: null, error: "プロジェクトが選択されていません" });
				}
				return deleteBusiness(id, currentProjectId);
			}}
		/>
	);
}
