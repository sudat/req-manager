import { useEffect, useState, useRef, useCallback } from "react"
import { listBusinesses } from "@/lib/data/businesses"
import { listTasksByBusinessId } from "@/lib/data/tasks"
import { listBusinessRequirementsByTaskId } from "@/lib/data/business-requirements"
import type { BusinessRequirement } from "@/lib/data/business-requirements"
import type { Business, Task } from "@/lib/domain/entities"

export interface UseBusinessRequirementCascadeReturn {
	businesses: Business[]
	selectedBusinessId: string | null
	selectBusinessId: (id: string | null) => void
	tasks: Task[]
	selectedTaskId: string | null
	selectTaskId: (id: string | null) => void
	businessReqs: BusinessRequirement[]
	loading: boolean
	error: string | null
}

/**
 * 業務要件のカスケードデータフェッチフック
 * ビジネス領域 → 業務タスク → 業務要件 の連動読み込みを管理
 */
export function useBusinessRequirementCascade(): UseBusinessRequirementCascadeReturn {
	const [businesses, setBusinesses] = useState<Business[]>([])
	const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
	const [tasks, setTasks] = useState<Task[]>([])
	const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
	const [businessReqs, setBusinessReqs] = useState<BusinessRequirement[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// 前回の選択値を追跡（useCallback の依存関係問題を回避）
	const prevBusinessIdRef = useRef<string | null>(null)

	// ビジネス領域一覧読み込み
	useEffect(() => {
		let active = true
		const loadBusinesses = async () => {
			setLoading(true)
			const { data, error: err } = await listBusinesses()
			if (!active) return
			if (err) {
				setError(err)
			} else {
				setBusinesses(data ?? [])
			}
			setLoading(false)
		}
		loadBusinesses()
		return () => {
			active = false
		}
	}, [])

	// 業務タスク読み込み
	useEffect(() => {
		if (!selectedBusinessId) {
			setTasks([])
			setBusinessReqs([])
			return
		}

		let active = true
		const loadTasks = async () => {
			const { data, error: err } = await listTasksByBusinessId(selectedBusinessId)
			if (!active) return
			if (err) {
				setError(err)
			} else {
				setTasks(data ?? [])
			}
		}
		loadTasks()
		return () => {
			active = false
		}
	}, [selectedBusinessId])

	// 業務要件読み込み
	useEffect(() => {
		if (!selectedTaskId) {
			setBusinessReqs([])
			return
		}

		let active = true
		const loadBusinessReqs = async () => {
			const { data, error: err } = await listBusinessRequirementsByTaskId(selectedTaskId)
			if (!active) return
			if (err) {
				setError(err)
			} else {
				setBusinessReqs(data ?? [])
			}
		}
		loadBusinessReqs()
		return () => {
			active = false
		}
	}, [selectedTaskId])

	// カスケードクリア付きのセッター（依存関係なし）
	const selectBusinessId = useCallback((id: string | null) => {
		// 前回と異なる値で、かつ前回が null でない場合のみ下流をクリア
		if (prevBusinessIdRef.current !== null && prevBusinessIdRef.current !== id) {
			setSelectedTaskId(null)
		}
		prevBusinessIdRef.current = id
		setSelectedBusinessId(id)
	}, [])

	const selectTaskId = useCallback((id: string | null) => {
		setSelectedTaskId(id)
	}, [])

	return {
		businesses,
		selectedBusinessId,
		selectBusinessId,
		tasks,
		selectedTaskId,
		selectTaskId,
		businessReqs,
		loading,
		error,
	}
}
