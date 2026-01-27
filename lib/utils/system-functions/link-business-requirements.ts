import { updateBusinessRequirement } from "@/lib/data/business-requirements";
import type { BusinessRequirement } from "@/lib/data/business-requirements";
import type { AcceptanceCriterionJson } from "@/lib/data/structured";

export type SystemRequirementLinkCard = {
	id: string;
	title: string;
	summary: string;
	businessRequirementIds: string[];
	acceptanceCriteriaJson: AcceptanceCriterionJson[];
};

/**
 * 業務要件の関連システム要件IDを更新する
 * @param systemRequirements システム要件リスト
 * @param businessRequirements 業務要件リスト
 * @returns エラーメッセージ（失敗時）、成功時はnull
 */
export async function linkBusinessRequirements(
	systemRequirements: SystemRequirementLinkCard[],
	businessRequirements: BusinessRequirement[],
	projectId: string
): Promise<string | null> {
	for (const sysReq of systemRequirements) {
		for (const bizReqId of sysReq.businessRequirementIds) {
			const bizReq = businessRequirements.find((br) => br.id === bizReqId);
			if (bizReq) {
				// 重複排除しながら関連システム要件IDを追加
				const updatedIds = [
					...new Set([...bizReq.relatedSystemRequirementIds, sysReq.id]),
				];
				const { error } = await updateBusinessRequirement(bizReqId, {
					taskId: bizReq.taskId,
					title: bizReq.title,
					goal: bizReq.goal,
					constraints: bizReq.constraints,
					owner: bizReq.owner,
					conceptIds: bizReq.conceptIds,
					srfId: bizReq.srfId,
					systemDomainIds: bizReq.systemDomainIds,
					impacts: bizReq.impacts,
					relatedSystemRequirementIds: updatedIds,
					sortOrder: bizReq.sortOrder,
				}, projectId);
				if (error) return error;
			}
		}
	}
	return null;
}
