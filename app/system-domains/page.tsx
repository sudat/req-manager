"use client";

import { deleteSystemDomain, listSystemDomains } from "@/lib/data/system-domains";
import { listSystemFunctions } from "@/lib/data/system-functions";
import { ResourceListPage } from "@/components/resource-page/resource-list-page";
import { systemDomainListConfig } from "@/config/resource-lists";
import { useProject } from "@/components/project/project-context";
import type { SystemDomain } from "@/lib/data/system-domains";
import type { SystemFunction } from "@/lib/domain";

type SystemDomainWithCount = SystemDomain & { functionCount: number };

export default function SystemDomainsPage() {
	const { currentProjectId, loading: projectLoading } = useProject();

	// SystemDomain は functionCount を含まないため、フェッチ後に計算して付与する
	const fetchData = async () => {
		if (projectLoading || !currentProjectId) {
			return { data: null, error: "プロジェクトが選択されていません" };
		}
		const [{ data: domainRows, error: domainError }, { data: functionRows, error: functionError }] =
			await Promise.all([
				listSystemDomains(currentProjectId),
				listSystemFunctions(currentProjectId)
			]);
		const error = domainError ?? functionError;
		if (error) {
			return { data: null, error };
		}

		// 機能数を計算（useMemo は不要 - 単純なMap構築）
		const map = new Map<string, number>();
		(functionRows ?? []).forEach((fn: SystemFunction) => {
			const domainId = fn.systemDomainId ?? "";
			if (!domainId) return;
			map.set(domainId, (map.get(domainId) ?? 0) + 1);
		});

		const data = (domainRows ?? []).map(
			(d: SystemDomain): SystemDomainWithCount => ({
				...d,
				functionCount: map.get(d.id) ?? 0,
			}),
		);

		return { data, error: null };
	};

	return (
		<ResourceListPage
			config={systemDomainListConfig}
			fetchData={fetchData}
			deleteItem={(id) => {
				if (projectLoading || !currentProjectId) {
					return Promise.resolve({ data: null, error: "プロジェクトが選択されていません" });
				}
				return deleteSystemDomain(id, currentProjectId);
			}}
		/>
	);
}
