import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import type { SelectedRequirement } from "@/hooks/use-requirement-selection"
import type { ImpactScopeTargetType } from "@/lib/domain/value-objects"

interface ImpactScopeSelectedPanelProps {
	selectedItems: SelectedRequirement[]
	readonly?: boolean
	onRemove?: (type: ImpactScopeTargetType, id: string) => void
}

export function ImpactScopeSelectedPanel({
	selectedItems,
	readonly = false,
	onRemove,
}: ImpactScopeSelectedPanelProps) {
	return (
		<Card className="p-4">
			<div className="flex items-center justify-between">
				<Label className="text-base font-semibold">選択済みの影響範囲</Label>
				<Badge variant="secondary">{selectedItems.length}件</Badge>
			</div>
			{selectedItems.length === 0 ? (
				<p className="text-sm text-slate-500 mt-2">まだ選択されていません</p>
			) : (
				<div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto">
					{selectedItems.map((item) => (
						<Badge key={`${item.type}-${item.id}`} variant="outline" className="gap-1">
							{item.type === "business_requirement" ? "業務" : "システム"}: {item.title}
							{!readonly && onRemove && (
								<button
									type="button"
									onClick={() => onRemove(item.type, item.id)}
									className="ml-1 hover:text-rose-600"
								>
									×
								</button>
							)}
						</Badge>
					))}
				</div>
			)}
		</Card>
	)
}
