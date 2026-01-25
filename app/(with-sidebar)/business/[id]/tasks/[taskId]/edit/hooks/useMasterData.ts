"use client";

import { useEffect, useState, useMemo } from "react";
import { useProject } from "@/components/project/project-context";

export type MasterDataItem = { id: string; name: string };

type UseMasterDataResult = {
	concepts: MasterDataItem[];
	systemFunctions: MasterDataItem[];
	systemDomains: MasterDataItem[];
	conceptMap: Map<string, string>;
	systemFunctionMap: Map<string, string>;
	systemDomainMap: Map<string, string>;
	optionsError: string | null;
	isLoading: boolean;
};

/**
 * マスターデータ（コンセプト、システム機能、システムドメイン）を取得するカスタムフック
 */
export function useMasterData(): UseMasterDataResult {
	const [concepts, setConcepts] = useState<MasterDataItem[]>([]);
	const [systemFunctions, setSystemFunctions] = useState<MasterDataItem[]>([]);
	const [systemDomains, setSystemDomains] = useState<MasterDataItem[]>([]);
	const [optionsError, setOptionsError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const { currentProjectId, loading: projectLoading } = useProject();

	useEffect(() => {
		let active = true;

		async function loadMasterData(): Promise<void> {
			try {
				if (projectLoading || !currentProjectId) {
					setOptionsError("プロジェクトが選択されていません");
					return;
				}
				const [conceptResult, srfResult, domainResult] = await Promise.all([
					import("@/lib/data/concepts").then((m) => m.listConcepts(currentProjectId)),
					import("@/lib/data/system-functions").then((m) => m.listSystemFunctions(currentProjectId)),
					import("@/lib/data/system-domains").then((m) => m.listSystemDomains(currentProjectId)),
				]);

				if (!active) return;

				const fetchError = conceptResult.error ?? srfResult.error ?? domainResult.error;
				if (fetchError) {
					setOptionsError(fetchError);
					return;
				}

				setConcepts((conceptResult.data ?? []).map((c) => ({ id: c.id, name: c.name })));
				setSystemFunctions(
					(srfResult.data ?? []).map((srf) => ({
						id: srf.id,
						name: srf.title,
					}))
				);
				setSystemDomains(
					(domainResult.data ?? []).map((d) => ({ id: d.id, name: d.name }))
				);
				setOptionsError(null);
			} catch (e) {
				if (active) {
					setOptionsError(e instanceof Error ? e.message : String(e));
				}
			} finally {
				if (active) {
					setIsLoading(false);
				}
			}
		}

		loadMasterData();

		return () => {
			active = false;
		};
	}, [currentProjectId, projectLoading]);

	const conceptMap = useMemo(() => new Map(concepts.map((c) => [c.id, c.name])), [concepts]);
	const systemFunctionMap = useMemo(
		() => new Map(systemFunctions.map((s) => [s.id, s.name])),
		[systemFunctions]
	);
	const systemDomainMap = useMemo(
		() => new Map(systemDomains.map((d) => [d.id, d.name])),
		[systemDomains]
	);

	return {
		concepts,
		systemFunctions,
		systemDomains,
		conceptMap,
		systemFunctionMap,
		systemDomainMap,
		optionsError,
		isLoading,
	};
}
