import { listBusinesses } from "@/lib/data/businesses";
import { listTasksByBusinessArea } from "@/lib/data/tasks";
import { listBusinessRequirementsByTaskId } from "@/lib/data/business-requirements";
import type { BusinessRequirement } from "@/lib/data/business-requirements";
import type { Business, Task } from "@/lib/domain/entities";
import { useCascadeFetch } from "./use-cascade-fetch";

export interface UseBusinessRequirementCascadeReturn {
	businesses: Business[];
	selectedBusinessId: string | null;
	selectBusinessId: (id: string | null) => void;
	tasks: Task[];
	selectedTaskId: string | null;
	selectTaskId: (id: string | null) => void;
	businessReqs: BusinessRequirement[];
	loading: boolean;
	error: string | null;
}

/**
 * 業務要件のカスケードデータフェッチフック
 * ビジネス領域 → 業務タスク → 業務要件 の連動読み込みを管理
 */
export function useBusinessRequirementCascade(): UseBusinessRequirementCascadeReturn {
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
	} = useCascadeFetch<Business, Task, BusinessRequirement>({
		fetchLevel1: listBusinesses,
		fetchLevel2: listTasksByBusinessArea,
		fetchLevel3: listBusinessRequirementsByTaskId,
	});

	return {
		businesses: level1Items,
		selectedBusinessId: selectedLevel1Id,
		selectBusinessId: selectLevel1Id,
		tasks: level2Items,
		selectedTaskId: selectedLevel2Id,
		selectTaskId: selectLevel2Id,
		businessReqs: level3Items,
		loading,
		error,
	};
}
