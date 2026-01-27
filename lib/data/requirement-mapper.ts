import type { Requirement } from "@/lib/domain";
import type { BusinessRequirementInput } from "@/lib/data/business-requirements";
import type { SystemRequirementInput } from "@/lib/data/system-requirements";
import {
	acceptanceCriteriaJsonToLegacy,
	mergeAcceptanceCriteriaJsonWithLegacy,
} from "@/lib/data/structured";

// 業務要件: Requirement → BusinessRequirementInput
export function toBusinessRequirementInput(
	requirement: Requirement,
	taskId: string,
	sortOrder: number,
): BusinessRequirementInput {
	const goal = requirement.goal.trim() || requirement.summary.trim();
	return {
		id: requirement.id,
		taskId,
		title: requirement.title,
		goal,
		constraints: requirement.constraints.trim(),
		owner: requirement.owner.trim(),
		conceptIds: requirement.conceptIds,
		srfId: requirement.srfId,
		systemDomainIds: requirement.systemDomainIds,
		impacts: [], // 影響領域は廃止
		relatedSystemRequirementIds: requirement.relatedSystemRequirementIds ?? [],
		sortOrder,
	};
}

// 業務要件: BusinessRequirement → Requirement
export function fromBusinessRequirement(
	br: import("@/lib/data/business-requirements").BusinessRequirement,
): Requirement {
	return {
		id: br.id,
		type: "業務要件",
		title: br.title,
		summary: br.summary ?? br.goal,
		goal: br.goal,
		constraints: br.constraints,
		owner: br.owner,
		conceptIds: br.conceptIds,
		srfId: br.srfId,
		systemDomainIds: br.systemDomainIds ?? [],
		acceptanceCriteria: br.acceptanceCriteria,
		acceptanceCriteriaJson: br.acceptanceCriteriaJson,
		category: undefined,
		businessRequirementIds: [],
		relatedSystemRequirementIds: br.relatedSystemRequirementIds ?? [],
	};
}

// システム要件: Requirement → SystemRequirementInput
export function toSystemRequirementInput(
	requirement: Requirement,
	taskId: string,
	sortOrder: number,
): SystemRequirementInput {
	const acceptanceCriteriaJson = mergeAcceptanceCriteriaJsonWithLegacy(
		requirement.acceptanceCriteriaJson,
		requirement.acceptanceCriteria
	);
	return {
		id: requirement.id,
		taskId,
		srfId: requirement.srfId,
		title: requirement.title,
		summary: requirement.summary,
		conceptIds: requirement.conceptIds,
		impacts: [], // 影響領域は廃止
		category: requirement.category,
		businessRequirementIds: requirement.businessRequirementIds ?? [],
		relatedDeliverableIds: requirement.relatedDeliverableIds ?? [],
		acceptanceCriteriaJson,
		acceptanceCriteria: acceptanceCriteriaJsonToLegacy(acceptanceCriteriaJson),
		systemDomainIds: requirement.systemDomainIds,
		sortOrder,
	};
}

// システム要件: SystemRequirement → Requirement
export function fromSystemRequirement(
	sr: import("@/lib/data/system-requirements").SystemRequirement,
): Requirement {
	return {
		id: sr.id,
		type: "システム要件",
		title: sr.title,
		summary: sr.summary,
		goal: "",
		constraints: "",
		owner: "",
		conceptIds: sr.conceptIds,
		srfId: sr.srfId,
		systemDomainIds: sr.systemDomainIds ?? [],
		acceptanceCriteria: sr.acceptanceCriteria,
		acceptanceCriteriaJson: sr.acceptanceCriteriaJson,
		category: sr.category,
		businessRequirementIds: sr.businessRequirementIds ?? [],
		relatedDeliverableIds: sr.relatedDeliverableIds ?? [],
		relatedSystemRequirementIds: [],
		taskId: sr.taskId, // taskIdを追加（外部キー制約対応）
	};
}
