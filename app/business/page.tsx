"use client";

import { listBusinessesWithRequirementCounts, deleteBusiness } from "@/lib/data/businesses";
import { ResourceListPage } from "@/components/resource-page/resource-list-page";
import { businessListConfig } from "@/config/resource-lists";
import { useProject } from "@/components/project/project-context";

export default function BusinessPage() {
	const { currentProjectId, loading: projectLoading } = useProject();

	const fetchData = async () => {
		if (projectLoading || !currentProjectId) {
			return { data: null, error: "プロジェクトが選択されていません" };
		}
		return listBusinessesWithRequirementCounts(currentProjectId);
	};

	return (
		<ResourceListPage
			config={businessListConfig}
			fetchData={fetchData}
			deleteItem={(id) => {
				if (projectLoading || !currentProjectId) {
					return Promise.resolve({ data: null, error: "プロジェクトが選択されていません" });
				}
				return deleteBusiness(id, currentProjectId);
			}}
		/>
	);
}
