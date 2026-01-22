import type { ImpactScope } from "@/lib/domain/value-objects";
import type { SelectedRequirement } from "@/components/tickets/impact-scope-selector";

// ========================================
// Type Definitions
// ========================================

export interface ImpactScopeTransformResult {
	selectedRequirements: SelectedRequirement[];
	businessReqIds: string[];
	systemReqIds: string[];
}

// ========================================
// Transformer Functions
// ========================================

/**
 * 影響範囲データから選択された要件情報を構築する
 * @param impactScopes - 影響範囲リスト
 * @returns 変換結果（選択要件、業務要件ID配列、システム要件ID配列）
 */
export async function transformImpactScopesToSelectedRequirements(
	impactScopes: ImpactScope[],
	projectId: string
): Promise<ImpactScopeTransformResult> {
	// タイプ別にIDを抽出
	const businessReqIds = impactScopes
		.filter((s) => s.targetType === "business_requirement")
		.map((s) => s.targetId);

	const systemReqIds = impactScopes
		.filter((s) => s.targetType === "system_requirement")
		.map((s) => s.targetId);

	// 並行して要件データを取得
	const { listBusinessRequirementsByIds } = await import("@/lib/data/business-requirements");
	const { listSystemRequirementsByIds } = await import("@/lib/data/system-requirements");

	const [bizReqsResult, sysReqsResult] = await Promise.all([
		businessReqIds.length > 0
			? listBusinessRequirementsByIds(businessReqIds, projectId)
			: { data: [], error: null },
		systemReqIds.length > 0
			? listSystemRequirementsByIds(systemReqIds, projectId)
			: { data: [], error: null },
	]);

	if (bizReqsResult.error || sysReqsResult.error) {
		throw new Error(
			bizReqsResult.error || sysReqsResult.error || "要件データの取得に失敗しました"
		);
	}

	// 選択済み要件を構築
	const selected: SelectedRequirement[] = [];

	if (bizReqsResult.data) {
		for (const req of bizReqsResult.data) {
			selected.push({
				type: "business_requirement",
				id: req.id,
				title: req.title,
				sourceId: req.taskId,
				acceptanceCriteria: req.acceptanceCriteriaJson.map((ac) => ({
					id: ac.id,
					description: ac.description,
					verificationMethod: ac.verification_method,
				})),
			});
		}
	}

	if (sysReqsResult.data) {
		for (const req of sysReqsResult.data) {
			selected.push({
				type: "system_requirement",
				id: req.id,
				title: req.title,
				sourceId: req.taskId,
				acceptanceCriteria: req.acceptanceCriteriaJson.map((ac) => ({
					id: ac.id,
					description: ac.description,
					verificationMethod: ac.verification_method,
				})),
			});
		}
	}

	return {
		selectedRequirements: selected,
		businessReqIds,
		systemReqIds,
	};
}
