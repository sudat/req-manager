import type { AcceptanceCriterionJson } from "@/lib/data/structured";
import type { EntryPoint } from "@/lib/domain";
import {
	calculateBusinessRequirementWithSystemRequirementsIssue,
	calculateBusinessRequirementWithConceptsIssue,
} from "./business-requirement-issues";
import {
	calculateSystemRequirementWithBusinessRequirementsIssue,
	calculateSystemRequirementWithCategoryIssue,
	calculateSystemRequirementWithAcceptanceCriteriaIssue,
	allowedCategories,
} from "./system-requirement-issues";
import {
	calculateImplUnitSdWithEntryPointsIssue,
} from "./linkage-issues";

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
	implUnitSds: number;
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

export type ImplUnitSdHealthInput = {
	id: string;
	name: string;
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
	implUnitSds?: ImplUnitSdHealthInput[];
	concepts?: ConceptHealthInput[];
	conceptCheckTarget?: 'business' | 'system' | 'all';
	pageType?: 'business' | 'system';
};

export type HealthIssueFilter = {
	filterParam: string;
	targetPath: 'business' | 'system';
	label: string;
};

export const healthIssueFilters: Record<string, HealthIssueFilter> = {
	business_requirements_with_system_requirements: {
		filterParam: 'missing_sr_link',
		targetPath: 'business',
		label: 'システム要件未紐付け',
	},
	system_requirements_with_business_requirements: {
		filterParam: 'missing_br_link',
		targetPath: 'system',
		label: '業務要件未紐付け',
	},
	impl_unit_sds_with_entry_points: {
		filterParam: 'missing_entrypoint',
		targetPath: 'system',
		label: 'エントリポイント未設定',
	},
	business_requirements_with_concepts: {
		filterParam: 'missing_concept_br',
		targetPath: 'business',
		label: '業務要件概念未紐付け',
	},
	system_requirements_with_category: {
		filterParam: 'missing_category',
		targetPath: 'system',
		label: '観点種別未設定',
	},
	system_requirements_with_acceptance_criteria: {
		filterParam: 'missing_acceptance',
		targetPath: 'system',
		label: '受入条件未設定',
	},
};

const severityWeight: Record<HealthScoreSeverity, number> = {
	high: 2,
	medium: 1,
};

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

const buildAcceptanceText = (item: AcceptanceCriterionJson): string =>
	[item.description, item.givenText, item.whenText, item.thenText]
		.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
		.join(" ");

const hasAcceptanceLintWarning = (items: AcceptanceCriterionJson[]): boolean => {
	if (items.length === 0) return false;
	return items.some((item) => {
		const text = buildAcceptanceText(item).trim();
		if (text.length === 0) return true;
		const normalized = normalizeText(text);
		return acceptanceLintTerms.some((term) => normalized.includes(normalizeText(term)));
	});
};

const buildRequirementText = (
	title: string,
	summary: string,
	criteria: AcceptanceCriterionJson[]
): string => {
	const criteriaText = criteria.map((item) => buildAcceptanceText(item)).filter(Boolean).join(" ");
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
	implUnitSds = [],
	concepts = [],
	conceptCheckTarget = 'business',
	pageType,
}: HealthScoreInput): HealthScoreSummary => {
	const issues: HealthScoreIssue[] = [];

	// 業務要件にシステム要件が紐づいている（業務要件ページのみ表示）
	if (pageType !== 'system') {
		issues.push(calculateBusinessRequirementWithSystemRequirementsIssue(businessRequirements));
	}

	// システム要件に業務要件が紐づいている（システム要件ページのみ表示）
	if (pageType !== 'business') {
		issues.push(calculateSystemRequirementWithBusinessRequirementsIssue(systemRequirements));
	}

	// 実装単位SDにエントリポイントが設定されている（システム要件ページのみ表示）
	if (pageType !== 'business') {
		issues.push(calculateImplUnitSdWithEntryPointsIssue(implUnitSds));
	}

	// 業務要件に概念が紐づいている（業務要件ページのみ表示）
	if (pageType !== 'system') {
		issues.push(calculateBusinessRequirementWithConceptsIssue(businessRequirements));
	}

	// システム要件に観点種別が設定されている（システム要件ページのみ表示）
	if (pageType !== 'business') {
		issues.push(calculateSystemRequirementWithCategoryIssue(systemRequirements));
	}

	// システム要件に受入条件が設定されている（システム要件ページのみ表示）
	if (pageType !== 'business') {
		issues.push(calculateSystemRequirementWithAcceptanceCriteriaIssue(systemRequirements));
	}

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
	const implUnitSdsWithEntryPoints = implUnitSds.filter(
		(sd) => (sd.entryPoints ?? []).length > 0
	).length;
	const entryPointCoverage =
		implUnitSds.length === 0 ? 1 : implUnitSdsWithEntryPoints / implUnitSds.length;
	if (implUnitSds.length > 0 && entryPointCoverage < 0.3) {
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
			implUnitSds: implUnitSds.length,
		},
	};
};
