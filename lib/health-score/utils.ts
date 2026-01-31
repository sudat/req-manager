import type { BusinessRequirementHealthInput, SystemRequirementHealthInput } from "./index";

export const buildBusinessRequirementsForHealth = (
	businessRequirements: Array<{
		id: string;
		title: string;
		summary: string;
		conceptIds: string[];
		impacts: string[];
		acceptanceCriteriaJson: BusinessRequirementHealthInput["acceptanceCriteriaJson"];
	}>,
	systemRequirements: Array<Pick<SystemRequirementHealthInput, "id" | "businessRequirementIds">>
): BusinessRequirementHealthInput[] => {
	const brToSrMap = new Map<string, string[]>();
	for (const sr of systemRequirements) {
		for (const brId of sr.businessRequirementIds) {
			const list = brToSrMap.get(brId);
			if (list) {
				list.push(sr.id);
			} else {
				brToSrMap.set(brId, [sr.id]);
			}
		}
	}

	return businessRequirements.map((br) => ({
		id: br.id,
		title: br.title,
		summary: br.summary,
		conceptIds: br.conceptIds,
		impacts: br.impacts,
		relatedSystemRequirementIds: brToSrMap.get(br.id) ?? [],
		acceptanceCriteriaJson: br.acceptanceCriteriaJson,
	}));
};
