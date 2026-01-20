import type { SelectedRequirement } from "@/components/tickets/impact-scope-selector";

// ========================================
// Type Definitions
// ========================================

export interface AcceptanceConfirmationInput {
	changeRequestId: string;
	acceptanceCriterionId: string;
	acceptanceCriterionSourceType: "business_requirement" | "system_requirement";
	acceptanceCriterionSourceId: string;
	acceptanceCriterionDescription: string;
	acceptanceCriterionVerificationMethod: string | null;
}

// ========================================
// Builder Functions
// ========================================

/**
 * 選択された要件から受入確認入力データを構築する
 * @param selectedRequirements - 選択された要件リスト
 * @param changeRequestId - 変更要求ID
 * @returns 受入確認入力配列
 */
export function buildAcceptanceInputs(
	selectedRequirements: SelectedRequirement[],
	changeRequestId: string
): AcceptanceConfirmationInput[] {
	const inputs: AcceptanceConfirmationInput[] = [];

	for (const req of selectedRequirements) {
		for (const ac of req.acceptanceCriteria) {
			inputs.push({
				changeRequestId,
				acceptanceCriterionId: ac.id,
				acceptanceCriterionSourceType:
					req.type === "business_requirement" ? "business_requirement" : "system_requirement",
				acceptanceCriterionSourceId: req.id,
				acceptanceCriterionDescription: ac.description,
				acceptanceCriterionVerificationMethod: ac.verificationMethod,
			});
		}
	}

	return inputs;
}

/**
 * 選択された要件から影響範囲入力データを構築する
 * @param selectedRequirements - 選択された要件リスト
 * @param changeRequestId - 変更要求ID
 * @returns 影響範囲入力配列
 */
export function buildImpactScopeInputs(
	selectedRequirements: SelectedRequirement[],
	changeRequestId: string
): Array<{
	changeRequestId: string;
	targetType: "business_requirement" | "system_requirement";
	targetId: string;
	targetTitle: string;
	rationale: string | null;
}> {
	return selectedRequirements.map((req) => ({
		changeRequestId,
		targetType: req.type as "business_requirement" | "system_requirement",
		targetId: req.id,
		targetTitle: req.title,
		rationale: null,
	}));
}
