import type { RelatedRequirementInfo } from "@/lib/domain/value-objects";
import type { AcceptanceCriterionJson } from "@/lib/data/structured";

// ========================================
// Type Definitions
// ========================================

export interface BusinessRequirement {
	id: string;
	taskId: string;
	title: string;
	relatedSystemRequirementIds?: string[];
}

export interface SystemRequirement {
	id: string;
	taskId: string;
	title: string;
	summary: string;
	conceptIds: string[];
	impacts: string[];
	acceptanceCriteria: string[];
	acceptanceCriteriaJson: AcceptanceCriterionJson[];
	businessRequirementIds: string[];
}

// ========================================
// Transformer Functions
// ========================================

/**
 * レガシーデータからシステム要件ID→業務要件IDマップを構築する
 * @param businessRequirements - 業務要件リスト
 * @returns システム要件IDから業務要件ID配列へのマップ
 */
export function buildSysReqToBizReqsMap(
	businessRequirements: BusinessRequirement[]
): Map<string, string[]> {
	const map = new Map<string, string[]>();
	for (const bizReq of businessRequirements) {
		for (const sysReqId of bizReq.relatedSystemRequirementIds ?? []) {
			const list = map.get(sysReqId);
			if (list) {
				list.push(bizReq.id);
			} else {
				map.set(sysReqId, [bizReq.id]);
			}
		}
	}
	return map;
}

/**
 * システム要件の配列からシステム要件ID→業務要件IDマップを構築する
 * @param systemRequirements - システム要件リスト
 * @param legacyMap - レガシーデータから構築されたマップ（フォールバック用）
 * @returns システム要件IDから業務要件ID配列へのマップ
 */
export function buildSysReqToBizReqsMapFromSystemReqs(
	systemRequirements: SystemRequirement[],
	legacyMap: Map<string, string[]>
): Map<string, string[]> {
	const map = new Map<string, string[]>();
	for (const req of systemRequirements) {
		if (req.businessRequirementIds.length > 0) {
			map.set(req.id, req.businessRequirementIds);
			continue;
		}
		const legacy = legacyMap.get(req.id);
		if (legacy) {
			map.set(req.id, legacy);
		}
	}
	return map;
}

/**
 * 関連要件情報を構築する
 * @param sysReqs - システム要件リスト
 * @param sysReqToBizReqsMap - システム要件ID→業務要件IDマップ
 * @param businessReqMap - 業務要件ID→業務要件マップ
 * @param taskBusinessMap - タスクID→ビジネスIDマップ
 * @param conceptMap - コンセプトID→コンセプト名マップ
 * @returns 関連要件情報リスト
 */
export function buildRelatedRequirements(
	sysReqs: SystemRequirement[],
	sysReqToBizReqsMap: Map<string, string[]>,
	businessReqMap: Map<string, BusinessRequirement>,
	taskBusinessMap: Map<string, string>,
	conceptMap: Map<string, string>,
): RelatedRequirementInfo[] {
	const result: RelatedRequirementInfo[] = [];

	for (const sysReq of sysReqs) {
		const systemReqConcepts = sysReq.conceptIds.map((id) => ({
			id,
			name: conceptMap.get(id) ?? id,
		}));

		const relatedBizReqIds = sysReqToBizReqsMap.get(sysReq.id) ?? [];

		// 関連業務要件をまとめて取得
		const relatedBusinessReqs = relatedBizReqIds
			.map((id) => businessReqMap.get(id))
			.filter((req): req is BusinessRequirement => req !== undefined);

		// 関連業務要件がない場合、1つだけ表示
		if (relatedBusinessReqs.length === 0) {
			result.push({
				systemReqId: sysReq.id,
				systemReqTitle: sysReq.title,
				systemReqSummary: sysReq.summary,
				systemReqConcepts,
				systemReqImpacts: sysReq.impacts,
				systemReqAcceptanceCriteria: sysReq.acceptanceCriteria,
				systemReqAcceptanceCriteriaJson: sysReq.acceptanceCriteriaJson,
				businessReqId: "",
				businessReqTitle: "",
				businessId: taskBusinessMap.get(sysReq.taskId) ?? "",
				taskId: sysReq.taskId,
				relatedBusinessReqs: [],
			});
			continue;
		}

		// 1つのシステム要件に対して、関連するすべての業務要件の情報を含める
		// メインの業務要件（最初のもの）を表示用に使用
		const mainBizReq = relatedBusinessReqs[0];
		const mainBusinessId = taskBusinessMap.get(mainBizReq.taskId) ?? "";

		result.push({
			systemReqId: sysReq.id,
			systemReqTitle: sysReq.title,
			systemReqSummary: sysReq.summary,
			systemReqConcepts,
			systemReqImpacts: sysReq.impacts,
			systemReqAcceptanceCriteria: sysReq.acceptanceCriteria,
			systemReqAcceptanceCriteriaJson: sysReq.acceptanceCriteriaJson,
			businessReqId: mainBizReq.id,
			businessReqTitle: mainBizReq.title,
			businessId: mainBusinessId,
			taskId: mainBizReq.taskId,
			// 関連業務要件のリスト（UI側で使用可能）
			relatedBusinessReqs: relatedBusinessReqs.map((req) => ({
				id: req.id,
				title: req.title,
				taskId: req.taskId,
				businessId: taskBusinessMap.get(req.taskId) ?? "",
			})),
		});
	}

	return result;
}
