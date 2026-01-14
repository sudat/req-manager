import type { Requirement } from "@/lib/mock/task-knowledge";
import type { BusinessRequirementInput } from "@/lib/data/business-requirements";
import type { SystemRequirementInput } from "@/lib/data/system-requirements";

// 業務要件: Requirement → BusinessRequirementInput
export function toBusinessRequirementInput(
	requirement: Requirement,
	taskId: string,
	sortOrder: number,
): BusinessRequirementInput {
	return {
		id: requirement.id,
		taskId,
		title: requirement.title,
		summary: requirement.summary,
		conceptIds: requirement.concepts.map((c) => c.id),
		srfId: requirement.srfId ?? null,
		systemDomainIds: [],
		impacts: requirement.impacts,
		// 関連システム要件はまだDBスキーマにないため、無視
		relatedSystemRequirementIds: [],
		acceptanceCriteria: requirement.acceptanceCriteria,
		sortOrder,
	};
}

// 業務要件: BusinessRequirement → Requirement
export function fromBusinessRequirement(
	br: import("@/lib/data/business-requirements").BusinessRequirement,
	conceptMap: Map<string, string>, // id → name
): Requirement {
	return {
		id: br.id,
		type: "業務要件",
		title: br.title,
		summary: br.summary,
		concepts: br.conceptIds.map((id) => ({
			id,
			name: conceptMap.get(id) ?? id,
		})),
		impacts: br.impacts,
		acceptanceCriteria: br.acceptanceCriteria,
		related: br.relatedSystemRequirementIds,
		srfId: br.srfId ?? undefined,
	};
}

// システム要件: Requirement → SystemRequirementInput
export function toSystemRequirementInput(
	requirement: Requirement,
	taskId: string,
	sortOrder: number,
): SystemRequirementInput {
	return {
		id: requirement.id,
		taskId,
		srfId: requirement.srfId ?? null,
		title: requirement.title,
		summary: requirement.summary,
		conceptIds: requirement.concepts.map((c) => c.id),
		impacts: requirement.impacts,
		acceptanceCriteria: requirement.acceptanceCriteria,
		systemDomainIds: [],
		sortOrder,
	};
}

// システム要件: SystemRequirement → Requirement
export function fromSystemRequirement(
	sr: import("@/lib/data/system-requirements").SystemRequirement,
	conceptMap: Map<string, string>, // id → name
): Requirement {
	return {
		id: sr.id,
		type: "システム要件",
		title: sr.title,
		summary: sr.summary,
		concepts: sr.conceptIds.map((id) => ({
			id,
			name: conceptMap.get(id) ?? id,
		})),
		impacts: sr.impacts,
		acceptanceCriteria: sr.acceptanceCriteria,
		related: [], // 関連業務要件はまだDBスキーマにない
		srfId: sr.srfId ?? undefined,
	};
}
