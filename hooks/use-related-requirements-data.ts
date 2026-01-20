"use client";

import { useEffect, useState } from "react";
import type { RelatedRequirementInfo } from "@/lib/domain/value-objects";
import { listBusinessRequirementsByTaskIds } from "@/lib/data/business-requirements";
import { listConcepts } from "@/lib/data/concepts";
import { listSystemRequirementsBySrfId } from "@/lib/data/system-requirements";
import { listTasksByIds } from "@/lib/data/tasks";
import {
	buildRelatedRequirements,
	buildSysReqToBizReqsMap,
	buildSysReqToBizReqsMapFromSystemReqs,
} from "@/lib/data/transformers/related-requirements-transformer";

export interface UseRelatedRequirementsDataResult {
	/** 構築された関連要件情報 */
	relatedRequirements: RelatedRequirementInfo[];
	/** ローディング状態 */
	loading: boolean;
	/** エラーメッセージ */
	error: string | null;
}

/**
 * システム機能IDに関連するすべてのデータをフェッチするフック
 * @param srfId - システム機能ID
 * @returns 関連データとローディング・エラー状態
 */
export function useRelatedRequirementsData(
	srfId: string
): UseRelatedRequirementsDataResult {
	const [relatedRequirements, setRelatedRequirements] = useState<RelatedRequirementInfo[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let active = true;

		async function fetchData(): Promise<void> {
			setLoading(true);

			// 1. システム要件を取得
			const { data: sysReqs, error: sysError } = await listSystemRequirementsBySrfId(srfId);
			if (!active) return;
			if (sysError) {
				setError(sysError);
				setLoading(false);
				return;
			}

			const reqs = sysReqs ?? [];
			if (reqs.length === 0) {
				setRelatedRequirements([]);
				setLoading(false);
				return;
			}

			// 2. タスクIDを抽出して業務要件を取得
			const taskIds = Array.from(new Set(reqs.map((req) => req.taskId)));
			const { data: bizReqs, error: bizError } = await listBusinessRequirementsByTaskIds(taskIds);
			if (!active) return;
			if (bizError) {
				setError(bizError);
				setLoading(false);
				return;
			}
			const businessReqs = bizReqs ?? [];

			// 3. タスクとコンセプトを並行取得
			const [taskResult, conceptResult] = await Promise.all([
				listTasksByIds(taskIds),
				listConcepts(),
			]);
			if (!active) return;

			const fetchError = taskResult.error ?? conceptResult.error;
			if (fetchError) {
				setError(fetchError);
				setLoading(false);
				return;
			}

			const taskData = taskResult.data ?? [];
			const conceptData = conceptResult.data ?? [];

			// 4. マップを構築
			const legacyMap = buildSysReqToBizReqsMap(businessReqs);
			const sysReqToBizReqsMap = buildSysReqToBizReqsMapFromSystemReqs(reqs, legacyMap);

			const businessReqMap = new Map(businessReqs.map((req) => [req.id, req]));
			const taskBusinessMap = new Map(taskData.map((task) => [task.id, task.businessId]));
			const conceptMap = new Map(conceptData.map((concept) => [concept.id, concept.name]));

			// 5. 関連要件情報を構築
			const result = buildRelatedRequirements(
				reqs,
				sysReqToBizReqsMap,
				businessReqMap,
				taskBusinessMap,
				conceptMap
			);

			setRelatedRequirements(result);
			setLoading(false);
		}

		fetchData();
		return () => {
			active = false;
		};
	}, [srfId]);

	return {
		relatedRequirements,
		loading,
		error,
	};
}
