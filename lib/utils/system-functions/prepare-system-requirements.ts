import type { SystemRequirementInput } from "@/lib/data/system-requirements";
import type { SystemRequirementCard } from "@/app/system-domains/[id]/functions/create/types";
import type { BusinessRequirement } from "@/lib/data/business-requirements";

/**
 * システム要件入力データを構築する
 * @param systemRequirements システム要件リスト
 * @param businessRequirements 業務要件リスト
 * @param srfId システム機能ID
 * @returns システム要件入力データ配列
 */
export function prepareSystemRequirementInputs(
	systemRequirements: SystemRequirementCard[],
	businessRequirements: BusinessRequirement[],
	srfId: string
): SystemRequirementInput[] {
	return systemRequirements.map((sr, index) => {
		// 最初に選択された業務要件からtaskIdを取得
		const firstBizReq =
			sr.businessRequirementIds.length > 0
				? businessRequirements.find((br) => br.id === sr.businessRequirementIds[0])
				: null;
		const taskId = firstBizReq?.taskId ?? "";

		return {
			id: sr.id,
			taskId,
			srfId,
			title: sr.title.trim(),
			summary: sr.summary.trim(),
			conceptIds: [],
			impacts: [],
			acceptanceCriteria: [],
			systemDomainIds: [],
			sortOrder: index + 1,
		};
	});
}
