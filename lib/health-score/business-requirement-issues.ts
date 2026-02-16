import type { BusinessRequirementHealthInput, HealthScoreIssue, HealthScoreSeverity } from "./index";

const createIssue = (
	id: string,
	label: string,
	severity: HealthScoreSeverity,
	completed: number,
	total: number
): HealthScoreIssue => ({
	id,
	label,
	severity,
	completed,
	total,
	ratio: total === 0 ? 1 : completed / total,
});

/**
 * 業務要件にシステム機能が紐づいている
 */
export const calculateBusinessRequirementWithSystemFunctionsIssue = (
	businessRequirements: BusinessRequirementHealthInput[]
): HealthScoreIssue => {
	return createIssue(
		"business_requirements_with_system_functions",
		"業務要件にシステム機能が紐づいている",
		"high",
		businessRequirements.filter((req) => req.relatedSystemFunctionIds.length > 0).length,
		businessRequirements.length
	);
};

/**
 * 業務要件に概念が紐づいている
 */
export const calculateBusinessRequirementWithConceptsIssue = (
	businessRequirements: BusinessRequirementHealthInput[]
): HealthScoreIssue => {
	return createIssue(
		"business_requirements_with_concepts",
		"業務要件に概念が紐づいている",
		"high",
		businessRequirements.filter((req) => req.conceptIds.length > 0).length,
		businessRequirements.length
	);
};
