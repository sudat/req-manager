import { useState, useEffect, useRef } from "react"
import type { ImpactScopeTargetType } from "@/lib/domain/value-objects"
import type { BusinessRequirement } from "@/lib/data/business-requirements"
import type { SystemRequirement } from "@/lib/data/system-requirements"

export interface SelectedRequirement {
	type: ImpactScopeTargetType
	id: string
	title: string
	sourceId: string
	acceptanceCriteria: Array<{ id: string; description: string; verificationMethod: string | null }>
}

export interface UseRequirementSelectionProps {
	initialSelection?: SelectedRequirement[]
	onSelectionChange?: (selection: SelectedRequirement[]) => void
	readonly?: boolean
}

export interface UseRequirementSelectionReturn {
	selectedItems: SelectedRequirement[]
	isSelected: (type: ImpactScopeTargetType, id: string) => boolean
	toggle: (type: ImpactScopeTargetType, req: BusinessRequirement | SystemRequirement) => void
	remove: (type: ImpactScopeTargetType, id: string) => void
	businessSelectedCount: number
	systemSelectedCount: number
}

/**
 * 選択済み要件の統一管理フック
 * toggleBusinessReq/toggleSystemReq の重複を解消
 */
export function useRequirementSelection({
	initialSelection = [],
	onSelectionChange,
	readonly = false,
}: UseRequirementSelectionProps): UseRequirementSelectionReturn {
	const [selectedItems, setSelectedItems] = useState<SelectedRequirement[]>(initialSelection)
	// 前回の initialSelection を追跡
	const prevInitialSelectionRef = useRef<SelectedRequirement[] | undefined>(undefined)

	// 初期選択の同期（内容が変わった場合のみ更新）
	useEffect(() => {
		// 初回または内容が変わった場合のみ更新
		if (
			prevInitialSelectionRef.current === undefined ||
			JSON.stringify(prevInitialSelectionRef.current) !== JSON.stringify(initialSelection)
		) {
			setSelectedItems(initialSelection)
			prevInitialSelectionRef.current = initialSelection
		}
	}, [initialSelection])

	const isSelected = (type: ImpactScopeTargetType, id: string): boolean => {
		return selectedItems.some((item) => item.type === type && item.id === id)
	}

	const toggle = (
		type: ImpactScopeTargetType,
		req: BusinessRequirement | SystemRequirement
	): void => {
		if (readonly) return

		const newItem: SelectedRequirement = {
			type,
			id: req.id,
			title: req.title,
			sourceId: req.taskId,
			acceptanceCriteria: req.acceptanceCriteriaJson.map((ac) => ({
				id: ac.id,
				description: ac.description,
				verificationMethod: ac.verification_method,
			})),
		}

		const newSelection = isSelected(type, req.id)
			? selectedItems.filter((item) => !(item.type === type && item.id === req.id))
			: [...selectedItems, newItem]

		setSelectedItems(newSelection)
		onSelectionChange?.(newSelection)
	}

	const remove = (type: ImpactScopeTargetType, id: string): void => {
		if (readonly) return

		const newSelection = selectedItems.filter((item) => !(item.type === type && item.id === id))
		setSelectedItems(newSelection)
		onSelectionChange?.(newSelection)
	}

	const businessSelectedCount = selectedItems.filter((i) => i.type === "business_requirement").length
	const systemSelectedCount = selectedItems.filter((i) => i.type === "system_requirement").length

	return {
		selectedItems,
		isSelected,
		toggle,
		remove,
		businessSelectedCount,
		systemSelectedCount,
	}
}
