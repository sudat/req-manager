import { listSystemDomains, type SystemDomain } from "@/lib/data/system-domains";
import { listSystemFunctionsByDomain } from "@/lib/data/system-functions";
import { listSystemRequirementsBySrfId } from "@/lib/data/system-requirements";
import type { SystemRequirement } from "@/lib/data/system-requirements";
import type { SystemFunction } from "@/lib/domain/entities";
import { useCascadeFetch } from "./use-cascade-fetch";

export interface UseSystemRequirementCascadeReturn {
	systemDomains: SystemDomain[];
	selectedDomainId: string | null;
	selectDomainId: (id: string | null) => void;
	systemFunctions: SystemFunction[];
	selectedFunctionId: string | null;
	selectFunctionId: (id: string | null) => void;
	systemReqs: SystemRequirement[];
	loading: boolean;
	error: string | null;
}

/**
 * システム要件のカスケードデータフェッチフック
 * システム領域 → システム機能 → システム要件 の連動読み込みを管理
 */
export function useSystemRequirementCascade(): UseSystemRequirementCascadeReturn {
	const {
		level1Items,
		selectedLevel1Id,
		selectLevel1Id,
		level2Items,
		selectedLevel2Id,
		selectLevel2Id,
		level3Items,
		loading,
		error,
	} = useCascadeFetch<SystemDomain, SystemFunction, SystemRequirement>({
		fetchLevel1: listSystemDomains,
		fetchLevel2: listSystemFunctionsByDomain,
		fetchLevel3: listSystemRequirementsBySrfId,
	});

	return {
		systemDomains: level1Items,
		selectedDomainId: selectedLevel1Id,
		selectDomainId: selectLevel1Id,
		systemFunctions: level2Items,
		selectedFunctionId: selectedLevel2Id,
		selectFunctionId: selectLevel2Id,
		systemReqs: level3Items,
		loading,
		error,
	};
}
