"use client";

import { listConcepts, deleteConcept } from "@/lib/data/concepts";
import { ResourceListPage } from "@/components/resource-page/resource-list-page";
import { conceptListConfig } from "@/config/resource-lists";
import { useProject } from "@/components/project/project-context";

export default function IdeasPage() {
	const { currentProjectId, loading: projectLoading } = useProject();

	const fetchData = async () => {
		if (projectLoading || !currentProjectId) {
			return { data: null, error: "プロジェクトが選択されていません" };
		}
		return listConcepts(currentProjectId);
	};

	return (
		<ResourceListPage
			config={conceptListConfig}
			fetchData={fetchData}
			deleteItem={(id) => {
				if (projectLoading || !currentProjectId) {
					return Promise.resolve({ data: null, error: "プロジェクトが選択されていません" });
				}
				return deleteConcept(id, currentProjectId);
			}}
		/>
	);
}
