"use client"

import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { useBusinessRequirementCascade } from "@/hooks/use-business-requirement-cascade"
import { useSystemRequirementCascade } from "@/hooks/use-system-requirement-cascade"
import { useRequirementSelection, type SelectedRequirement } from "@/hooks/use-requirement-selection"
import { ImpactScopeSelectedPanel } from "@/components/tickets/impact-scope-selected-panel"
import { BusinessRequirementCascadeSelector } from "@/components/tickets/business-requirement-cascade-selector"
import { SystemRequirementCascadeSelector } from "@/components/tickets/system-requirement-cascade-selector"

export type { SelectedRequirement }

interface ImpactScopeSelectorProps {
	changeRequestId?: string
	initialSelection?: SelectedRequirement[]
	onSelectionChange?: (selection: SelectedRequirement[]) => void
	readonly?: boolean
}

export function ImpactScopeSelector({
	changeRequestId,
	initialSelection = [],
	onSelectionChange,
	readonly = false,
}: ImpactScopeSelectorProps) {
	const businessCascade = useBusinessRequirementCascade()
	const systemCascade = useSystemRequirementCascade()
	const selection = useRequirementSelection({
		initialSelection,
		onSelectionChange,
		readonly,
	})

	if (businessCascade.loading || systemCascade.loading) {
		return (
			<Card className="p-6">
				<div className="flex items-center justify-center py-8">
					<Loader2 className="h-6 w-6 animate-spin text-slate-400" />
				</div>
			</Card>
		)
	}

	return (
		<div className="space-y-4">
			<ImpactScopeSelectedPanel
				selectedItems={selection.selectedItems}
				readonly={readonly}
				onRemove={selection.remove}
			/>

			{!readonly && (
				<Tabs defaultValue="business" className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="business">
							業務要件
							{selection.businessSelectedCount > 0 && (
								<Badge variant="secondary" className="ml-2">
									{selection.businessSelectedCount}
								</Badge>
							)}
						</TabsTrigger>
						<TabsTrigger value="system">
							システム要件
							{selection.systemSelectedCount > 0 && (
								<Badge variant="secondary" className="ml-2">
									{selection.systemSelectedCount}
								</Badge>
							)}
						</TabsTrigger>
					</TabsList>

					<TabsContent value="business" className="space-y-4">
						<BusinessRequirementCascadeSelector
							businesses={businessCascade.businesses}
							selectedBusinessId={businessCascade.selectedBusinessId}
							selectBusinessId={businessCascade.selectBusinessId}
							tasks={businessCascade.tasks}
							selectedTaskId={businessCascade.selectedTaskId}
							selectTaskId={businessCascade.selectTaskId}
							businessReqs={businessCascade.businessReqs}
							isSelected={selection.isSelected}
							onToggleReq={(req) => selection.toggle("business_requirement", req)}
						/>
					</TabsContent>

					<TabsContent value="system" className="space-y-4">
						<SystemRequirementCascadeSelector
							systemDomains={systemCascade.systemDomains}
							selectedDomainId={systemCascade.selectedDomainId}
							selectDomainId={systemCascade.selectDomainId}
							systemFunctions={systemCascade.systemFunctions}
							selectedFunctionId={systemCascade.selectedFunctionId}
							selectFunctionId={systemCascade.selectFunctionId}
							systemReqs={systemCascade.systemReqs}
							isSelected={selection.isSelected}
							onToggleReq={(req) => selection.toggle("system_requirement", req)}
						/>
					</TabsContent>
				</Tabs>
			)}
		</div>
	)
}
