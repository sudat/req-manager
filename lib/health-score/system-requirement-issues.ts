import type { SystemRequirementHealthInput, HealthScoreIssue, HealthScoreSeverity } from "./index";
import type { AcceptanceCriterionJson } from "@/lib/data/structured";

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

const buildAcceptanceText = (item: AcceptanceCriterionJson): string =>
	[item.description, item.givenText, item.whenText, item.thenText]
		.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
		.join(" ");

const hasAcceptanceCriteria = (items: AcceptanceCriterionJson[]): boolean =>
	items.some((item) => buildAcceptanceText(item).trim().length > 0);

export const allowedCategories = new Set([
	"function",
	"data",
	"exception",
	"non_functional",
]);

/**
 * システム要件に業務要件が紐づいている
 */
export const calculateSystemRequirementWithBusinessRequirementsIssue = (
	systemRequirements: SystemRequirementHealthInput[]
): HealthScoreIssue => {
	return createIssue(
		"system_requirements_with_business_requirements",
		"システム要件に業務要件が紐づいている",
		"high",
		systemRequirements.filter((req) => req.businessRequirementIds.length > 0).length,
		systemRequirements.length
	);
};

/**
 * システム要件に観点種別が設定されている
 */
export const calculateSystemRequirementWithCategoryIssue = (
	systemRequirements: SystemRequirementHealthInput[]
): HealthScoreIssue => {
	return createIssue(
		"system_requirements_with_category",
		"システム要件に観点種別が設定されている",
		"high",
		systemRequirements.filter((req) => req.categoryRaw && allowedCategories.has(req.categoryRaw))
			.length,
		systemRequirements.length
	);
};

/**
 * システム要件に受入条件が設定されている
 */
export const calculateSystemRequirementWithAcceptanceCriteriaIssue = (
	systemRequirements: SystemRequirementHealthInput[]
): HealthScoreIssue => {
	return createIssue(
		"system_requirements_with_acceptance_criteria",
		"システム要件に受入条件が設定されている",
		"high",
		systemRequirements.filter((req) => hasAcceptanceCriteria(req.acceptanceCriteriaJson))
			.length,
		systemRequirements.length
	);
};
