import { useEffect, useState, useRef, useCallback } from "react"
import { listSystemDomains, type SystemDomain } from "@/lib/data/system-domains"
import { listSystemFunctionsByDomain } from "@/lib/data/system-functions"
import { listSystemRequirementsByTaskId } from "@/lib/data/system-requirements"
import type { SystemRequirement } from "@/lib/data/system-requirements"
import type { SystemFunction } from "@/lib/domain/entities"

export interface UseSystemRequirementCascadeReturn {
	systemDomains: SystemDomain[]
	selectedDomainId: string | null
	selectDomainId: (id: string | null) => void
	systemFunctions: SystemFunction[]
	selectedFunctionId: string | null
	selectFunctionId: (id: string | null) => void
	systemReqs: SystemRequirement[]
	loading: boolean
	error: string | null
}

/**
 * システム要件のカスケードデータフェッチフック
 * システム領域 → システム機能 → システム要件 の連動読み込みを管理
 */
export function useSystemRequirementCascade(): UseSystemRequirementCascadeReturn {
	const [systemDomains, setSystemDomains] = useState<SystemDomain[]>([])
	const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null)
	const [systemFunctions, setSystemFunctions] = useState<SystemFunction[]>([])
	const [selectedFunctionId, setSelectedFunctionId] = useState<string | null>(null)
	const [systemReqs, setSystemReqs] = useState<SystemRequirement[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// 前回の選択値を追跡（useCallback の依存関係問題を回避）
	const prevDomainIdRef = useRef<string | null>(null)

	// システム領域一覧読み込み
	useEffect(() => {
		let active = true
		const loadDomains = async () => {
			setLoading(true)
			const { data, error: err } = await listSystemDomains()
			if (!active) return
			if (err) {
				setError(err)
			} else {
				setSystemDomains(data ?? [])
			}
			setLoading(false)
		}
		loadDomains()
		return () => {
			active = false
		}
	}, [])

	// システム機能読み込み
	useEffect(() => {
		if (!selectedDomainId) {
			setSystemFunctions([])
			setSystemReqs([])
			return
		}

		let active = true
		const loadFunctions = async () => {
			const { data, error: err } = await listSystemFunctionsByDomain(selectedDomainId)
			if (!active) return
			if (err) {
				setError(err)
			} else {
				setSystemFunctions(data ?? [])
			}
		}
		loadFunctions()
		return () => {
			active = false
		}
	}, [selectedDomainId])

	// システム要件読み込み
	useEffect(() => {
		if (!selectedFunctionId) {
			setSystemReqs([])
			return
		}

		let active = true
		const loadSystemReqs = async () => {
			const { data, error: err } = await listSystemRequirementsByTaskId(selectedFunctionId)
			if (!active) return
			if (err) {
				setError(err)
			} else {
				setSystemReqs(data ?? [])
			}
		}
		loadSystemReqs()
		return () => {
			active = false
		}
	}, [selectedFunctionId])

	// カスケードクリア付きのセッター（依存関係なし）
	const selectDomainId = useCallback((id: string | null) => {
		// 前回と異なる値で、かつ前回が null でない場合のみ下流をクリア
		if (prevDomainIdRef.current !== null && prevDomainIdRef.current !== id) {
			setSelectedFunctionId(null)
		}
		prevDomainIdRef.current = id
		setSelectedDomainId(id)
	}, [])

	const selectFunctionId = useCallback((id: string | null) => {
		setSelectedFunctionId(id)
	}, [])

	return {
		systemDomains,
		selectedDomainId,
		selectDomainId,
		systemFunctions,
		selectedFunctionId,
		selectFunctionId,
		systemReqs,
		loading,
		error,
	}
}
