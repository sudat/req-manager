import { updateBusinessRequirement } from "@/lib/data/business-requirements";
import type { SystemRequirementCard } from "@/app/system-domains/[id]/create/types";
import type { BusinessRequirement } from "@/lib/data/business-requirements";

/**
 * 業務要件の関連システム要件IDを更新する
 * @param systemRequirements システム要件リスト
 * @param businessRequirements 業務要件リスト
 * @returns エラーメッセージ（失敗時）、成功時はnull
 */
export async function linkBusinessRequirements(
	systemRequirements: SystemRequirementCard[],
	businessRequirements: BusinessRequirement[]
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
					summary: bizReq.summary,
					conceptIds: bizReq.conceptIds,
					srfId: bizReq.srfId,
					systemDomainIds: bizReq.systemDomainIds,
					impacts: bizReq.impacts,
					relatedSystemRequirementIds: updatedIds,
					acceptanceCriteria: bizReq.acceptanceCriteria,
					sortOrder: bizReq.sortOrder,
				});
				if (error) return error;
			}
		}
	}
	return null;
}
