"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { useRequirementSelection, type SelectedRequirement } from "@/hooks/use-requirement-selection"
import { ImpactScopeSelectedPanel } from "@/components/tickets/impact-scope-selected-panel"
import { useProject } from "@/components/project/project-context"
import { cn } from "@/lib/utils"
import type { Task, SystemFunction } from "@/lib/domain"
import { listTasks } from "@/lib/data/tasks"
import {
	listBusinessRequirements,
	type BusinessRequirement,
} from "@/lib/data/business-requirements"
import { listSystemFunctions } from "@/lib/data/system-functions"
import {
	listSystemRequirements,
	type SystemRequirement,
} from "@/lib/data/system-requirements"

export type { SelectedRequirement }

interface ImpactScopeSelectorProps {
	changeRequestId?: string
	initialSelection?: SelectedRequirement[]
	onSelectionChange?: (selection: SelectedRequirement[]) => void
	readonly?: boolean
}

export function ImpactScopeSelector({
	initialSelection = [],
	onSelectionChange,
	readonly = false,
}: ImpactScopeSelectorProps) {
	const { currentProjectId, loading: projectLoading } = useProject()
	const prevProjectIdRef = useRef<string | undefined>(undefined)

	const [tasks, setTasks] = useState<Task[]>([])
	const [businessReqs, setBusinessReqs] = useState<BusinessRequirement[]>([])
	const [systemFunctions, setSystemFunctions] = useState<SystemFunction[]>([])
	const [systemReqs, setSystemReqs] = useState<SystemRequirement[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const [taskDialogOpen, setTaskDialogOpen] = useState(false)
	const [systemDialogOpen, setSystemDialogOpen] = useState(false)

	const [taskSearchQuery, setTaskSearchQuery] = useState("")
	const [businessReqSearchQuery, setBusinessReqSearchQuery] = useState("")
	const [functionSearchQuery, setFunctionSearchQuery] = useState("")
	const [systemReqSearchQuery, setSystemReqSearchQuery] = useState("")

	const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
	const [selectedFunctionId, setSelectedFunctionId] = useState<string | null>(null)

	const selection = useRequirementSelection({
		initialSelection,
		onSelectionChange,
		readonly,
	})

	useEffect(() => {
		let active = true

		const load = async () => {
			if (projectLoading) return

			// プロジェクトが切り替わったら、選択状態も含めてリセット
			if (
				prevProjectIdRef.current !== undefined &&
				prevProjectIdRef.current !== currentProjectId
			) {
				selection.reset([])
				setSelectedTaskId(null)
				setSelectedFunctionId(null)
			}
			prevProjectIdRef.current = currentProjectId

			if (!currentProjectId) {
				setTasks([])
				setBusinessReqs([])
				setSystemFunctions([])
				setSystemReqs([])
				setError("プロジェクトが選択されていません")
				setLoading(false)
				return
			}

			setLoading(true)
			setError(null)

			const [tasksResult, businessReqsResult, systemFunctionsResult, systemReqsResult] =
				await Promise.all([
					listTasks(currentProjectId),
					listBusinessRequirements(currentProjectId),
					listSystemFunctions(currentProjectId),
					listSystemRequirements(currentProjectId),
				])

			if (!active) return

			const fetchError =
				tasksResult.error ||
				businessReqsResult.error ||
				systemFunctionsResult.error ||
				systemReqsResult.error

			setTasks(tasksResult.data ?? [])
			setBusinessReqs(businessReqsResult.data ?? [])
			setSystemFunctions(systemFunctionsResult.data ?? [])
			setSystemReqs(systemReqsResult.data ?? [])
			setError(fetchError ?? null)

			setSelectedTaskId((prev) => prev ?? tasksResult.data?.[0]?.id ?? null)
			setSelectedFunctionId((prev) => prev ?? systemFunctionsResult.data?.[0]?.id ?? null)
			setLoading(false)
		}

		void load()
		return () => {
			active = false
		}
	}, [currentProjectId, projectLoading, selection.reset])

	const selectedTaskName = useMemo(() => {
		if (!selectedTaskId) return null
		return tasks.find((task) => task.id === selectedTaskId)?.name ?? null
	}, [tasks, selectedTaskId])

	const selectedSystemFunctionTitle = useMemo(() => {
		if (!selectedFunctionId) return null
		return systemFunctions.find((item) => item.id === selectedFunctionId)?.title ?? null
	}, [systemFunctions, selectedFunctionId])

	const filteredTasks = useMemo(() => {
		const query = taskSearchQuery.trim().toLowerCase()
		if (!query) return tasks
		return tasks.filter((task) => {
			return (
				task.id.toLowerCase().includes(query) ||
				task.name.toLowerCase().includes(query) ||
				task.summary.toLowerCase().includes(query)
			)
		})
	}, [tasks, taskSearchQuery])

	const filteredSystemFunctions = useMemo(() => {
		const query = functionSearchQuery.trim().toLowerCase()
		if (!query) return systemFunctions
		return systemFunctions.filter((item) => {
			return (
				item.id.toLowerCase().includes(query) ||
				item.title.toLowerCase().includes(query) ||
				item.summary.toLowerCase().includes(query)
			)
		})
	}, [systemFunctions, functionSearchQuery])

	const filteredBusinessRequirements = useMemo(() => {
		if (!selectedTaskId) return []
		const query = businessReqSearchQuery.trim().toLowerCase()
		const taskFiltered = businessReqs.filter((req) => req.taskId === selectedTaskId)
		if (!query) return taskFiltered
		return taskFiltered.filter((req) => {
			return (
				req.id.toLowerCase().includes(query) ||
				req.title.toLowerCase().includes(query) ||
				req.summary.toLowerCase().includes(query)
			)
		})
	}, [businessReqs, businessReqSearchQuery, selectedTaskId])

	const filteredSystemRequirements = useMemo(() => {
		if (!selectedFunctionId) return []
		const query = systemReqSearchQuery.trim().toLowerCase()
		const functionFiltered = systemReqs.filter((req) => req.srfIds.includes(selectedFunctionId))
		if (!query) return functionFiltered
		return functionFiltered.filter((req) => {
			return (
				req.id.toLowerCase().includes(query) ||
				req.title.toLowerCase().includes(query) ||
				req.summary.toLowerCase().includes(query)
			)
		})
	}, [selectedFunctionId, systemReqSearchQuery, systemReqs])

	if (projectLoading || loading) {
		return (
			<Card className="p-6">
				<div className="flex items-center justify-center py-8">
					<Loader2 className="h-6 w-6 animate-spin text-slate-400" />
				</div>
			</Card>
		)
	}

	const businessScopeLabel =
		selection.businessSelectedCount > 0
			? `${selection.businessSelectedCount}件を選択中`
			: "業務要件を選択"

	const systemScopeLabel =
		selection.systemSelectedCount > 0
			? `${selection.systemSelectedCount}件を選択中`
			: "システム要件を選択"

	const selectionDisabled = !currentProjectId || !!error

	return (
		<div className="space-y-4">
			<ImpactScopeSelectedPanel
				selectedItems={selection.selectedItems}
				readonly={readonly}
				onRemove={selection.remove}
			/>

			{!readonly && (
				<Card className="p-4">
					<div className="space-y-3">
							<div className="grid gap-2 md:grid-cols-2">
								<button
									type="button"
									disabled={selectionDisabled}
									onClick={() => setTaskDialogOpen(true)}
									className={cn(
										"w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-left transition-colors",
										selectionDisabled ? "cursor-not-allowed opacity-60" : "hover:border-slate-400",
									)}
								>
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium text-slate-900">業務タスクから選択</span>
										<Badge variant="secondary">{businessScopeLabel}</Badge>
									</div>
								<p className="mt-1 text-xs text-slate-500">
									業務タスクを選択して、対象の業務要件をチェック
								</p>
							</button>

								<button
									type="button"
									disabled={selectionDisabled}
									onClick={() => setSystemDialogOpen(true)}
									className={cn(
										"w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-left transition-colors",
										selectionDisabled ? "cursor-not-allowed opacity-60" : "hover:border-slate-400",
									)}
								>
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium text-slate-900">システム機能から選択</span>
										<Badge variant="secondary">{systemScopeLabel}</Badge>
									</div>
								<p className="mt-1 text-xs text-slate-500">
									システム機能を選択して、対象のシステム要件をチェック
								</p>
							</button>
						</div>

							{error && <p className="text-xs text-rose-600">エラー: {error}</p>}
						</div>
					</Card>
				)}

			<Dialog
				open={taskDialogOpen}
				onOpenChange={(open) => {
					setTaskDialogOpen(open)
					if (!open) {
						setTaskSearchQuery("")
						setBusinessReqSearchQuery("")
					}
				}}
			>
				<DialogContent className="h-[80vh] w-[96vw] max-w-[96vw] sm:max-w-[96vw] lg:max-w-[1280px] overflow-hidden">
					<DialogHeader>
						<DialogTitle>業務タスクから影響範囲を選択</DialogTitle>
					</DialogHeader>

					<div className="grid h-full min-h-0 gap-3 md:grid-cols-[320px_1fr]">
						<div className="min-h-0 rounded-md border border-slate-200 p-3 space-y-2">
							<Input
								placeholder="業務タスクを検索..."
								value={taskSearchQuery}
								onChange={(event) => setTaskSearchQuery(event.target.value)}
							/>
							<div className="h-[calc(100%-48px)] overflow-y-auto pr-1 space-y-1">
								{filteredTasks.map((task) => (
									<button
										key={task.id}
										type="button"
										onClick={() => setSelectedTaskId(task.id)}
										className={cn(
											"w-full rounded-md border px-3 py-2 text-left transition-colors",
											selectedTaskId === task.id
												? "border-slate-900 bg-slate-100"
												: "border-slate-200 hover:border-slate-400",
										)}
									>
										<p className="font-mono text-[11px] text-slate-500">{task.id}</p>
										<p className="text-sm font-medium text-slate-900 mt-0.5">{task.name}</p>
									</button>
								))}
								{filteredTasks.length === 0 && (
									<p className="text-xs text-slate-500">該当する業務タスクがありません</p>
								)}
							</div>
						</div>

						<div className="min-h-0 rounded-md border border-slate-200 p-3 space-y-2">
							<Input
								placeholder="業務要件を検索..."
								value={businessReqSearchQuery}
								onChange={(event) => setBusinessReqSearchQuery(event.target.value)}
								disabled={!selectedTaskId}
							/>
							<p className="text-xs text-slate-500">
								対象タスク: {selectedTaskName ? `${selectedTaskId} / ${selectedTaskName}` : "未選択"}
							</p>

							<div className="h-[calc(100%-72px)] overflow-y-auto pr-1 space-y-2">
								{!selectedTaskId ? (
									<p className="text-sm text-slate-500">左の一覧から業務タスクを選択してください</p>
								) : filteredBusinessRequirements.length === 0 ? (
									<p className="text-sm text-slate-500">該当する業務要件がありません</p>
								) : (
									filteredBusinessRequirements.map((req) => {
										const checked = selection.isSelected("business_requirement", req.id)
										return (
											<label
												key={req.id}
												className={cn(
													"flex items-start gap-2 rounded-md border px-3 py-2 cursor-pointer",
													checked
														? "border-slate-900 bg-slate-50"
														: "border-slate-200 hover:border-slate-400",
												)}
											>
												<input
													type="checkbox"
													checked={checked}
													onChange={() => selection.toggle("business_requirement", req)}
													className="mt-1 h-4 w-4"
												/>
												<div className="min-w-0">
													<p className="text-sm font-medium text-slate-900">{req.title}</p>
													<p className="text-xs text-slate-500 mt-0.5">{req.id}</p>
												</div>
											</label>
										)
									})
								)}
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog
				open={systemDialogOpen}
				onOpenChange={(open) => {
					setSystemDialogOpen(open)
					if (!open) {
						setFunctionSearchQuery("")
						setSystemReqSearchQuery("")
					}
				}}
			>
				<DialogContent className="h-[80vh] w-[96vw] max-w-[96vw] sm:max-w-[96vw] lg:max-w-[1280px] overflow-hidden">
					<DialogHeader>
						<DialogTitle>システム機能から影響範囲を選択</DialogTitle>
					</DialogHeader>

					<div className="grid h-full min-h-0 gap-3 md:grid-cols-[320px_1fr]">
						<div className="min-h-0 rounded-md border border-slate-200 p-3 space-y-2">
							<Input
								placeholder="システム機能を検索..."
								value={functionSearchQuery}
								onChange={(event) => setFunctionSearchQuery(event.target.value)}
							/>
							<div className="h-[calc(100%-48px)] overflow-y-auto pr-1 space-y-1">
								{filteredSystemFunctions.map((item) => (
									<button
										key={item.id}
										type="button"
										onClick={() => setSelectedFunctionId(item.id)}
										className={cn(
											"w-full rounded-md border px-3 py-2 text-left transition-colors",
											selectedFunctionId === item.id
												? "border-slate-900 bg-slate-100"
												: "border-slate-200 hover:border-slate-400",
										)}
									>
										<p className="font-mono text-[11px] text-slate-500">{item.id}</p>
										<p className="text-sm font-medium text-slate-900 mt-0.5">{item.title}</p>
									</button>
								))}
								{filteredSystemFunctions.length === 0 && (
									<p className="text-xs text-slate-500">該当するシステム機能がありません</p>
								)}
							</div>
						</div>

						<div className="min-h-0 rounded-md border border-slate-200 p-3 space-y-2">
							<Input
								placeholder="システム要件を検索..."
								value={systemReqSearchQuery}
								onChange={(event) => setSystemReqSearchQuery(event.target.value)}
								disabled={!selectedFunctionId}
							/>
							<p className="text-xs text-slate-500">
								対象機能:{" "}
								{selectedSystemFunctionTitle
									? `${selectedFunctionId} / ${selectedSystemFunctionTitle}`
									: "未選択"}
							</p>

							<div className="h-[calc(100%-72px)] overflow-y-auto pr-1 space-y-2">
								{!selectedFunctionId ? (
									<p className="text-sm text-slate-500">左の一覧からシステム機能を選択してください</p>
								) : filteredSystemRequirements.length === 0 ? (
									<p className="text-sm text-slate-500">該当するシステム要件がありません</p>
								) : (
									filteredSystemRequirements.map((req) => {
										const checked = selection.isSelected("system_requirement", req.id)
										return (
											<label
												key={req.id}
												className={cn(
													"flex items-start gap-2 rounded-md border px-3 py-2 cursor-pointer",
													checked
														? "border-slate-900 bg-slate-50"
														: "border-slate-200 hover:border-slate-400",
												)}
											>
												<input
													type="checkbox"
													checked={checked}
													onChange={() => selection.toggle("system_requirement", req)}
													className="mt-1 h-4 w-4"
												/>
												<div className="min-w-0">
													<p className="text-sm font-medium text-slate-900">{req.title}</p>
													<p className="text-xs text-slate-500 mt-0.5">{req.id}</p>
												</div>
											</label>
										)
									})
								)}
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	)
}
