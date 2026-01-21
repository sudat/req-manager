import type { AcceptanceCriterionJson } from "@/lib/data/structured";
import type { EntryPoint } from "@/lib/domain";

export type HealthScoreSeverity = "high" | "medium";
export type HealthScoreLevel = "good" | "warning" | "critical";
export type HealthScoreWarningSeverity = "warning" | "critical";

export type HealthScoreIssue = {
	id: string;
	label: string;
	severity: HealthScoreSeverity;
	completed: number;
	total: number;
	ratio: number;
};

export type HealthScoreWarning = {
	id: string;
	label: string;
	severity: HealthScoreWarningSeverity;
};

export type HealthScoreStats = {
	businessRequirements: number;
	systemRequirements: number;
	systemFunctions: number;
	entryPoints: number;
	requirements: number;
};

export type HealthScoreSummary = {
	score: number;
	level: HealthScoreLevel;
	issues: HealthScoreIssue[];
	warnings: HealthScoreWarning[];
	stats: HealthScoreStats;
};

export type BusinessRequirementHealthInput = {
	id: string;
	title: string;
	summary: string;
	conceptIds: string[];
	impacts: string[];
	relatedSystemRequirementIds: string[];
	acceptanceCriteriaJson: AcceptanceCriterionJson[];
};

export type SystemRequirementHealthInput = {
	id: string;
	title: string;
	summary: string;
	conceptIds: string[];
	impacts: string[];
	businessRequirementIds: string[];
	categoryRaw?: string | null;
	acceptanceCriteriaJson: AcceptanceCriterionJson[];
};

export type SystemFunctionHealthInput = {
	id: string;
	title: string;
	entryPoints?: EntryPoint[];
};

export type ConceptHealthInput = {
	id: string;
	name: string;
	synonyms: string[];
};

export type HealthScoreInput = {
	businessRequirements?: BusinessRequirementHealthInput[];
	systemRequirements?: SystemRequirementHealthInput[];
	systemFunctions?: SystemFunctionHealthInput[];
	concepts?: ConceptHealthInput[];
};

const severityWeight: Record<HealthScoreSeverity, number> = {
	high: 2,
	medium: 1,
};

const allowedCategories = new Set([
	"function",
	"data",
	"exception",
	"auth",
	"non_functional",
]);

const acceptanceLintTerms = [
	"使いやすい",
	"見やすい",
	"わかりやすい",
	"高速",
	"速い",
	"遅い",
	"良い",
	"適切",
	"十分",
	"簡単",
	"便利",
	"快適",
	"柔軟",
];

const normalizeText = (value: string): string => value.toLowerCase();

const ensureArray = <T>(value: T[] | undefined): T[] => value ?? [];

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

const hasAcceptanceCriteria = (items: AcceptanceCriterionJson[]): boolean =>
	items.some((item) => item.description.trim().length > 0);

const hasAcceptanceLintWarning = (items: AcceptanceCriterionJson[]): boolean => {
	if (items.length === 0) return false;
	return items.some((item) => {
		const description = item.description.trim();
		if (description.length === 0) return true;
		const normalized = normalizeText(description);
		return acceptanceLintTerms.some((term) => normalized.includes(normalizeText(term)));
	});
};

const buildRequirementText = (
	title: string,
	summary: string,
	criteria: AcceptanceCriterionJson[]
): string => {
	const criteriaText = criteria.map((item) => item.description).filter(Boolean).join(" ");
	return normalizeText([title, summary, criteriaText].filter(Boolean).join(" "));
};

const buildConceptEntries = (concepts: ConceptHealthInput[]) =>
	concepts
		.map((concept) => ({
			id: concept.id,
			terms: [concept.name, ...concept.synonyms]
				.map((term) => term.trim())
				.filter((term) => term.length >= 2)
				.map((term) => normalizeText(term)),
		}))
		.filter((concept) => concept.terms.length > 0);

const getScoreLevel = (score: number): HealthScoreLevel => {
	if (score >= 80) return "good";
	if (score >= 60) return "warning";
	return "critical";
};

export const buildHealthScoreSummary = ({
	businessRequirements = [],
	systemRequirements = [],
	systemFunctions = [],
	concepts = [],
}: HealthScoreInput): HealthScoreSummary => {
	const entryPoints = systemFunctions.flatMap((fn) => ensureArray(fn.entryPoints));
	const requirementCount = businessRequirements.length + systemRequirements.length;

	const issues: HealthScoreIssue[] = [];

	issues.push(
		createIssue(
			"business_requirements_with_system_requirements",
			"業務要件にシステム要件が紐づいている",
			"high",
			businessRequirements.filter((req) => req.relatedSystemRequirementIds.length > 0).length,
			businessRequirements.length
		)
	);

	issues.push(
		createIssue(
			"system_requirements_with_business_requirements",
			"システム要件に業務要件が紐づいている",
			"high",
			systemRequirements.filter((req) => req.businessRequirementIds.length > 0).length,
			systemRequirements.length
		)
	);

	issues.push(
		createIssue(
			"system_functions_with_entry_points",
			"システム機能にエントリポイントが設定されている",
			"high",
			systemFunctions.filter((fn) => ensureArray(fn.entryPoints).length > 0).length,
			systemFunctions.length
		)
	);

	issues.push(
		createIssue(
			"entry_points_with_responsibility",
			"エントリポイントに責務が設定されている",
			"medium",
			entryPoints.filter((entry) => entry.responsibility && entry.responsibility.trim().length > 0)
				.length,
			entryPoints.length
		)
	);

	const conceptEntries = buildConceptEntries(concepts);
	let requirementsWithConceptTerms = 0;
	let requirementsWithConceptLinks = 0;

	if (conceptEntries.length > 0) {
		const allRequirements = [
			...businessRequirements.map((req) => ({
				id: req.id,
				text: buildRequirementText(req.title, req.summary, req.acceptanceCriteriaJson),
				conceptIds: req.conceptIds,
			})),
			...systemRequirements.map((req) => ({
				id: req.id,
				text: buildRequirementText(req.title, req.summary, req.acceptanceCriteriaJson),
				conceptIds: req.conceptIds,
			})),
		];

		for (const req of allRequirements) {
			const matchedConceptIds = conceptEntries
				.filter((concept) => concept.terms.some((term) => req.text.includes(term)))
				.map((concept) => concept.id);

			if (matchedConceptIds.length === 0) continue;
			requirementsWithConceptTerms += 1;
			const linkedIds = new Set(req.conceptIds);
			const hasAllLinks = matchedConceptIds.every((id) => linkedIds.has(id));
			if (hasAllLinks) requirementsWithConceptLinks += 1;
		}
	}

	issues.push(
		createIssue(
			"concept_terms_with_links",
			"概念辞書の用語にリンクされている",
			"medium",
			requirementsWithConceptLinks,
			requirementsWithConceptTerms
		)
	);

	issues.push(
		createIssue(
			"business_requirements_with_concepts",
			"業務要件に概念が紐づいている",
			"high",
			businessRequirements.filter((req) => req.conceptIds.length > 0).length,
			businessRequirements.length
		)
	);

	issues.push(
		createIssue(
			"business_requirements_with_impacts",
			"業務要件に影響範囲が設定されている",
			"high",
			businessRequirements.filter((req) => req.impacts.length > 0).length,
			businessRequirements.length
		)
	);

	issues.push(
		createIssue(
			"system_requirements_with_category",
			"システム要件に観点種別が設定されている",
			"high",
			systemRequirements.filter((req) => req.categoryRaw && allowedCategories.has(req.categoryRaw))
				.length,
			systemRequirements.length
		)
	);

	issues.push(
		createIssue(
			"requirements_with_acceptance_criteria",
			"受入条件が設定されている",
			"high",
			[...businessRequirements, ...systemRequirements].filter(
				(req) => hasAcceptanceCriteria(req.acceptanceCriteriaJson)
			).length,
			requirementCount
		)
	);

	issues.push(
		createIssue(
			"acceptance_criteria_well_written",
			"受入条件が適切に記述されている",
			"high",
			[...businessRequirements, ...systemRequirements].filter((req) =>
				!hasAcceptanceLintWarning(req.acceptanceCriteriaJson)
			).length,
			requirementCount
		)
	);

	const scoredIssues = issues.filter((issue) => issue.total > 0);
	const totalWeight = scoredIssues.reduce(
		(sum, issue) => sum + severityWeight[issue.severity],
		0
	);

	const rawScore =
		totalWeight === 0
			? 100
			: (scoredIssues.reduce((sum, issue) => {
					const compliance = issue.ratio;
					return sum + compliance * severityWeight[issue.severity];
			  }, 0) /
					totalWeight) *
			  100;

	const score = Math.max(0, Math.min(100, Math.round(rawScore)));
	const level = getScoreLevel(score);

	const warnings: HealthScoreWarning[] = [];
	const systemFunctionsWithEntryPoints = systemFunctions.filter(
		(fn) => ensureArray(fn.entryPoints).length > 0
	).length;
	const entryPointCoverage =
		systemFunctions.length === 0 ? 1 : systemFunctionsWithEntryPoints / systemFunctions.length;
	if (systemFunctions.length > 0 && entryPointCoverage < 0.3) {
		warnings.push({
			id: "entry_point_coverage_low",
			label: "エントリポイント登録率が30%未満です",
			severity: "critical",
		});
	}

	const missingCategoryCount = systemRequirements.filter(
		(req) => !req.categoryRaw || !allowedCategories.has(req.categoryRaw)
	).length;
	const missingCategoryRate =
		systemRequirements.length === 0 ? 0 : missingCategoryCount / systemRequirements.length;
	if (systemRequirements.length > 0 && missingCategoryRate > 0.5) {
		warnings.push({
			id: "category_missing_high",
			label: "観点種別の未設定率が50%を超えています",
			severity: "warning",
		});
	}

	return {
		score,
		level,
		issues,
		warnings,
		stats: {
			businessRequirements: businessRequirements.length,
			systemRequirements: systemRequirements.length,
			systemFunctions: systemFunctions.length,
			entryPoints: entryPoints.length,
			requirements: requirementCount,
		},
	};
};
