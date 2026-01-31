"use client";

import { ResourceListPage } from "@/components/resource-page/resource-list-page";
import { systemDomainListConfig } from "@/config/resource-lists";
import { listSystemDomains } from "@/lib/data/system-domains";
import { listSystemFunctions } from "@/lib/data/system-functions";
import { useProject } from "@/components/project/project-context";
import type { SystemDomain } from "@/lib/data/system-domains";
import type { SystemFunction } from "@/lib/domain";

type SystemDomainWithCount = SystemDomain & { functionCount: number };

export default function SystemDomainsPage() {
	const { currentProjectId } = useProject();

	const fetchData = async () => {
		if (!currentProjectId) {
			return { data: null, error: "プロジェクトが選択されていません" };
		}

		const [{ data: domainRows, error: domainError }, { data: functionRows, error: functionError }] =
			await Promise.all([
				listSystemDomains(currentProjectId),
				listSystemFunctions(currentProjectId)
			]);

		const fetchError = domainError ?? functionError;
		if (fetchError) {
			return { data: null, error: fetchError };
		}

		// 機能数を計算
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
			deleteItem={async (id: string) => {
				const { deleteSystemDomain } = await import("@/lib/data/system-domains");
				return deleteSystemDomain(id);
			}}
		/>
	);
}
