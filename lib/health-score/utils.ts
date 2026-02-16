import type { BusinessRequirementHealthInput } from "./index";

export const buildBusinessRequirementsForHealth = (
	businessRequirements: Array<{
		id: string;
		title: string;
		summary: string;
		conceptIds: string[];
		impacts: string[];
		acceptanceCriteriaJson: BusinessRequirementHealthInput["acceptanceCriteriaJson"];
		taskId: string;
	}>,
	systemFunctions: Array<{ id: string; relatedTaskIds: string[] }>
): BusinessRequirementHealthInput[] => {
	// タスクIDからシステム機能IDへのマップを構築
	const taskToSfMap = new Map<string, string[]>();
	for (const sf of systemFunctions) {
		for (const taskId of sf.relatedTaskIds) {
			const list = taskToSfMap.get(taskId);
			if (list) {
				list.push(sf.id);
			} else {
				taskToSfMap.set(taskId, [sf.id]);
			}
		}
	}

	return businessRequirements.map((br) => ({
		id: br.id,
		title: br.title,
		summary: br.summary,
		conceptIds: br.conceptIds,
		impacts: br.impacts,
		relatedSystemFunctionIds: taskToSfMap.get(br.taskId) ?? [],
		acceptanceCriteriaJson: br.acceptanceCriteriaJson,
	}));
};
