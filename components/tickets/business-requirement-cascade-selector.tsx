import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { ChevronRight, Check } from "lucide-react"
import type { BusinessRequirement } from "@/lib/data/business-requirements"
import type { Business, Task } from "@/lib/domain/entities"

interface BusinessRequirementCascadeSelectorProps {
	businesses: Business[]
	selectedBusinessId: string | null
	selectBusinessId: (id: string | null) => void
	tasks: Task[]
	selectedTaskId: string | null
	selectTaskId: (id: string | null) => void
	businessReqs: BusinessRequirement[]
	isSelected: (type: "business_requirement", id: string) => boolean
	onToggleReq: (req: BusinessRequirement) => void
}

export function BusinessRequirementCascadeSelector({
	businesses,
	selectedBusinessId,
	selectBusinessId,
	tasks,
	selectedTaskId,
	selectTaskId,
	businessReqs,
	isSelected,
	onToggleReq,
}: BusinessRequirementCascadeSelectorProps) {
	return (
		<Card className="p-4">
			<div className="space-y-4">
				{/* ビジネス領域選択 */}
				<div>
					<Label>1. ビジネス領域を選択</Label>
					<div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
						{businesses.map((biz) => (
							<button
								key={biz.id}
								type="button"
								onClick={() => selectBusinessId(biz.id)}
								className={`p-3 text-left rounded-lg border transition-colors ${
									selectedBusinessId === biz.id
										? "border-slate-900 bg-slate-900 text-white"
										: "border-slate-200 hover:border-slate-400"
								}`}
							>
								<div className="font-medium text-sm">{biz.name}</div>
								<div
									className={`text-xs mt-1 ${
										selectedBusinessId === biz.id ? "text-slate-300" : "text-slate-500"
									}`}
								>
									{biz.area}
								</div>
							</button>
						))}
					</div>
				</div>

				{/* 業務タスク選択 */}
				{selectedBusinessId && tasks.length > 0 && (
					<div>
						<Label>2. 業務タスクを選択</Label>
						<div className="space-y-2 mt-2">
							{tasks.map((task) => (
								<button
									key={task.id}
									type="button"
									onClick={() => selectTaskId(task.id)}
									className={`w-full p-3 text-left rounded-lg border transition-colors flex items-center justify-between ${
										selectedTaskId === task.id
											? "border-slate-900 bg-slate-100"
											: "border-slate-200 hover:border-slate-400"
									}`}
								>
									<div>
										<div className="font-medium text-sm">{task.name}</div>
										<div className="text-xs text-slate-500 mt-1">{task.summary}</div>
									</div>
									<ChevronRight className="h-4 w-4 text-slate-400" />
								</button>
							))}
						</div>
					</div>
				)}

				{/* 業務要件選択 */}
				{selectedTaskId && businessReqs.length > 0 && (
					<div>
						<Label>3. 業務要件を選択</Label>
						<div className="space-y-2 mt-2">
							{businessReqs.map((req) => {
								const checked = isSelected("business_requirement", req.id)
								return (
									<div
										key={req.id}
										className={`p-3 rounded-lg border transition-colors flex items-start gap-3 ${
											checked ? "border-slate-900 bg-slate-50" : "border-slate-200"
										}`}
									>
										<Checkbox
											id={`br-${req.id}`}
											checked={checked}
											onCheckedChange={() => onToggleReq(req)}
											className="mt-1"
										/>
										<div className="flex-1 min-w-0">
											<Label htmlFor={`br-${req.id}`} className="font-medium text-sm cursor-pointer">
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

				{selectedBusinessId && tasks.length === 0 && (
					<p className="text-sm text-slate-500">このビジネス領域には業務タスクがありません</p>
				)}
				{selectedTaskId && businessReqs.length === 0 && (
					<p className="text-sm text-slate-500">この業務タスクには業務要件がありません</p>
				)}
			</div>
		</Card>
	)
}
