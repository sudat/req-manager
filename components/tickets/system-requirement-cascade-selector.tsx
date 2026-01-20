import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { ChevronRight, Check } from "lucide-react"
import type { SystemRequirement } from "@/lib/data/system-requirements"
import type { SystemDomain } from "@/lib/data/system-domains"
import type { SystemFunction } from "@/lib/domain/entities"

interface SystemRequirementCascadeSelectorProps {
	systemDomains: SystemDomain[]
	selectedDomainId: string | null
	selectDomainId: (id: string | null) => void
	systemFunctions: SystemFunction[]
	selectedFunctionId: string | null
	selectFunctionId: (id: string | null) => void
	systemReqs: SystemRequirement[]
	isSelected: (type: "system_requirement", id: string) => boolean
	onToggleReq: (req: SystemRequirement) => void
}

export function SystemRequirementCascadeSelector({
	systemDomains,
	selectedDomainId,
	selectDomainId,
	systemFunctions,
	selectedFunctionId,
	selectFunctionId,
	systemReqs,
	isSelected,
	onToggleReq,
}: SystemRequirementCascadeSelectorProps) {
	return (
		<Card className="p-4">
			<div className="space-y-4">
				{/* システム領域選択 */}
				<div>
					<Label>1. システム領域を選択</Label>
					<div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
						{systemDomains.map((domain) => (
							<button
								key={domain.id}
								type="button"
								onClick={() => selectDomainId(domain.id)}
								className={`p-3 text-left rounded-lg border transition-colors ${
									selectedDomainId === domain.id
										? "border-slate-900 bg-slate-900 text-white"
										: "border-slate-200 hover:border-slate-400"
								}`}
							>
								<div className="font-medium text-sm">{domain.name}</div>
							</button>
						))}
					</div>
				</div>

				{/* システム機能選択 */}
				{selectedDomainId && systemFunctions.length > 0 && (
					<div>
						<Label>2. システム機能を選択</Label>
						<div className="space-y-2 mt-2">
							{systemFunctions.map((func) => (
								<button
									key={func.id}
									type="button"
									onClick={() => selectFunctionId(func.id)}
									className={`w-full p-3 text-left rounded-lg border transition-colors flex items-center justify-between ${
										selectedFunctionId === func.id
											? "border-slate-900 bg-slate-100"
											: "border-slate-200 hover:border-slate-400"
									}`}
								>
									<div>
										<div className="font-medium text-sm">{func.title}</div>
										<div className="text-xs text-slate-500 mt-1">{func.summary}</div>
									</div>
									<ChevronRight className="h-4 w-4 text-slate-400" />
								</button>
							))}
						</div>
					</div>
				)}

				{/* システム要件選択 */}
				{selectedFunctionId && systemReqs.length > 0 && (
					<div>
						<Label>3. システム要件を選択</Label>
						<div className="space-y-2 mt-2">
							{systemReqs.map((req) => {
								const checked = isSelected("system_requirement", req.id)
								return (
									<div
										key={req.id}
										className={`p-3 rounded-lg border transition-colors flex items-start gap-3 ${
											checked ? "border-slate-900 bg-slate-50" : "border-slate-200"
										}`}
									>
										<Checkbox
											id={`sr-${req.id}`}
											checked={checked}
											onCheckedChange={() => onToggleReq(req)}
											className="mt-1"
										/>
										<div className="flex-1 min-w-0">
											<Label htmlFor={`sr-${req.id}`} className="font-medium text-sm cursor-pointer">
												{req.title}
											</Label>
											{req.summary && (
												<p className="text-xs text-slate-500 mt-1 line-clamp-2">{req.summary}</p>
											)}
											{req.acceptanceCriteriaJson.length > 0 && (
												<Badge variant="outline" className="mt-2 text-xs">
													受入条件 {req.acceptanceCriteriaJson.length}件
												</Badge>
											)}
										</div>
										{checked && <Check className="h-4 w-4 text-slate-900 mt-1" />}
									</div>
								)
							})}
						</div>
					</div>
				)}

				{selectedDomainId && systemFunctions.length === 0 && (
					<p className="text-sm text-slate-500">このシステム領域にはシステム機能がありません</p>
				)}
				{selectedFunctionId && systemReqs.length === 0 && (
					<p className="text-sm text-slate-500">このシステム機能にはシステム要件がありません</p>
				)}
			</div>
		</Card>
	)
}
