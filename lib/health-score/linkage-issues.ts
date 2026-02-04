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

