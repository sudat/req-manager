import type {
	ImplUnitSdHealthInput,
	BusinessRequirementHealthInput,
	SystemRequirementHealthInput,
	HealthScoreIssue,
	HealthScoreSeverity
} from "./index";

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

const ensureArray = <T>(value: T[] | undefined): T[] => value ?? [];

/**
 * 実装単位SDにエントリポイントが設定されている
 */
export const calculateImplUnitSdWithEntryPointsIssue = (
	implUnitSds: ImplUnitSdHealthInput[]
): HealthScoreIssue => {
	return createIssue(
		"impl_unit_sds_with_entry_points",
		"実装単位SDにエントリポイントが設定されている",
		"high",
		implUnitSds.filter((sd) => ensureArray(sd.entryPoints).length > 0).length,
		implUnitSds.length
	);
};

/**
 * 概念辞書の用語にリンクされている
 */
export const calculateConceptTermsWithLinksIssue = (
	businessRequirements: BusinessRequirementHealthInput[],
	systemRequirements: SystemRequirementHealthInput[],
	conceptCheckTarget: 'business' | 'system' | 'all' = 'business'
): HealthScoreIssue => {
	const target = conceptCheckTarget;
	const requirementsWithConcepts =
		target === 'system' ?
			systemRequirements.filter((req) => req.conceptIds.length > 0) :
		target === 'all' ?
			[...businessRequirements, ...systemRequirements].filter((req) => req.conceptIds.length > 0) :
			businessRequirements.filter((req) => req.conceptIds.length > 0);

	const totalRequirements =
		target === 'system' ? systemRequirements.length :
		target === 'all' ? businessRequirements.length + systemRequirements.length :
		businessRequirements.length;

	return createIssue(
		"concept_terms_with_links",
		"概念辞書の用語にリンクされている",
		"medium",
		requirementsWithConcepts.length,
		totalRequirements
	);
};
