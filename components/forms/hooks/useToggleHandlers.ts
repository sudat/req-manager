"use client";

import type { Requirement } from "@/lib/domain/forms";

/**
 * 選択ダイアログのトグルハンドラーを生成するフック
 * @param activeRequirement アクティブな要件
 * @param onUpdateRequirement 要件更新コールバック
 * @returns トグルハンドラー群
 */
export function useToggleHandlers(
	activeRequirement: Requirement | null,
	onUpdateRequirement: (reqId: string, patch: Partial<Requirement>) => void
) {
	// 複数選択トグルハンドラー生成
	const createMultiToggle = (
		key:
			| "conceptIds"
			| "systemDomainIds"
			| "businessRequirementIds"
			| "relatedSystemRequirementIds"
			| "relatedDeliverableIds"
	) => {
		return (itemId: string, checked: boolean) => {
			if (!activeRequirement) return;
			const currentIds = (activeRequirement[key] ?? []) as string[];
			const next = checked
				? [...currentIds, itemId]
				: currentIds.filter((id) => id !== itemId);
			onUpdateRequirement(activeRequirement.id, { [key]: next } as Partial<Requirement>);
		};
	};

	// 単一選択トグルハンドラー生成
	const createSingleToggle = (key: "srfId") => {
		return (itemId: string, checked: boolean) => {
			if (!activeRequirement) return;
			onUpdateRequirement(activeRequirement.id, { [key]: checked ? itemId : null });
		};
	};

	return {
		handleConceptToggle: createMultiToggle("conceptIds"),
		handleSystemFunctionToggle: createSingleToggle("srfId"),
		handleDomainToggle: createMultiToggle("systemDomainIds"),
		handleBusinessRequirementToggle: createMultiToggle("businessRequirementIds"),
		handleSystemRequirementToggle: createMultiToggle("relatedSystemRequirementIds"),
		handleDeliverableToggle: createMultiToggle("relatedDeliverableIds"),
	};
}
