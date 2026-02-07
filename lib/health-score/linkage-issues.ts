import type {
	DesignDocumentHealthInput,
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
 * DDにエントリポイントが設定されている
 */
export const calculateDesignDocumentWithEntryPointsIssue = (
	designDocuments: DesignDocumentHealthInput[]
): HealthScoreIssue => {
	return createIssue(
		"design_documents_with_entry_points",
		"DDにエントリポイントが設定されている",
		"high",
		designDocuments.filter((sd) => ensureArray(sd.entryPoints).length > 0).length,
		designDocuments.length
	);
};
