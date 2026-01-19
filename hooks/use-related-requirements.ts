"use client";

import { useEffect, useState } from "react";
import type { RelatedRequirementInfo } from "@/lib/domain";
import { listBusinessRequirementsByTaskIds } from "@/lib/data/business-requirements";
import { listConcepts } from "@/lib/data/concepts";
import { listSystemRequirementsBySrfId } from "@/lib/data/system-requirements";
import { listTasksByIds } from "@/lib/data/tasks";

interface UseRelatedRequirementsResult {
	data: RelatedRequirementInfo[];
	loading: boolean;
	error: string | null;
}

export function useRelatedRequirements(srfId: string): UseRelatedRequirementsResult {
	const [data, setData] = useState<RelatedRequirementInfo[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let active = true;

		async function fetchRelatedRequirements(): Promise<void> {
			setLoading(true);

			const { data: systemRequirements, error: sysError } = await listSystemRequirementsBySrfId(srfId);
			if (!active) return;
			if (sysError) {
				setError(sysError);
				setData([]);
				setLoading(false);
				return;
			}

			const sysReqs = systemRequirements ?? [];
			if (sysReqs.length === 0) {
				setError(null);
				setData([]);
				setLoading(false);
				return;
			}

			const taskIds = Array.from(new Set(sysReqs.map((req) => req.taskId)));
			const { data: businessRequirements, error: businessReqError } =
				await listBusinessRequirementsByTaskIds(taskIds);
			if (!active) return;
			if (businessReqError) {
				setError(businessReqError);
				setData([]);
				setLoading(false);
				return;
			}

			const legacyMap = buildSysReqToBizReqsMap(businessRequirements ?? []);
			const sysReqToBizReqsMap = buildSysReqToBizReqsMapFromSystemReqs(sysReqs, legacyMap);

			const [taskResult, conceptResult] = await Promise.all([
				listTasksByIds(taskIds),
				listConcepts(),
			]);
			if (!active) return;

			const fetchError = taskResult.error ?? conceptResult.error;
			if (fetchError) {
				setError(fetchError);
				setData([]);
				setLoading(false);
				return;
			}

			const businessReqMap = new Map(
				(businessRequirements ?? []).map((req) => [req.id, req]),
			);
			const taskBusinessMap = new Map(
				(taskResult.data ?? []).map((task) => [task.id, task.businessId]),
			);
			const conceptMap = new Map(
				(conceptResult.data ?? []).map((concept) => [concept.id, concept.name]),
			);

			const result = buildRelatedRequirements(
				sysReqs,
				sysReqToBizReqsMap,
				businessReqMap,
				taskBusinessMap,
				conceptMap,
			);

			setData(result);
			setError(null);
			setLoading(false);
		}

		fetchRelatedRequirements();
		return () => {
			active = false;
		};
	}, [srfId]);

	return { data, loading, error };
}

interface BusinessRequirement {
	id: string;
	taskId: string;
	title: string;
	relatedSystemRequirementIds?: string[];
}

function buildSysReqToBizReqsMap(businessRequirements: BusinessRequirement[]): Map<string, string[]> {
	const map = new Map<string, string[]>();
	for (const bizReq of businessRequirements) {
		for (const sysReqId of bizReq.relatedSystemRequirementIds ?? []) {
			const list = map.get(sysReqId);
			if (list) {
				list.push(bizReq.id);
			} else {
				map.set(sysReqId, [bizReq.id]);
			}
		}
	}
	return map;
}

interface SystemRequirement {
	id: string;
	taskId: string;
	title: string;
	summary: string;
	conceptIds: string[];
	impacts: string[];
	acceptanceCriteria: string[];
	businessRequirementIds: string[];
}

function buildSysReqToBizReqsMapFromSystemReqs(
	systemRequirements: SystemRequirement[],
	legacyMap: Map<string, string[]>
): Map<string, string[]> {
	const map = new Map<string, string[]>();
	for (const req of systemRequirements) {
		if (req.businessRequirementIds.length > 0) {
			map.set(req.id, req.businessRequirementIds);
			continue;
		}
		const legacy = legacyMap.get(req.id);
		if (legacy) {
			map.set(req.id, legacy);
		}
	}
	return map;
}

function buildRelatedRequirements(
	sysReqs: SystemRequirement[],
	sysReqToBizReqsMap: Map<string, string[]>,
	businessReqMap: Map<string, BusinessRequirement>,
	taskBusinessMap: Map<string, string>,
	conceptMap: Map<string, string>,
): RelatedRequirementInfo[] {
	const result: RelatedRequirementInfo[] = [];

	for (const sysReq of sysReqs) {
		const systemReqConcepts = sysReq.conceptIds.map((id) => ({
			id,
			name: conceptMap.get(id) ?? id,
		}));

		const relatedBizReqIds = sysReqToBizReqsMap.get(sysReq.id) ?? [];

		// 関連業務要件をまとめて取得
		const relatedBusinessReqs = relatedBizReqIds
			.map((id) => businessReqMap.get(id))
			.filter((req): req is BusinessRequirement => req !== undefined);

		// 関連業務要件がない場合、1つだけ表示
		if (relatedBusinessReqs.length === 0) {
			result.push({
				systemReqId: sysReq.id,
				systemReqTitle: sysReq.title,
				systemReqSummary: sysReq.summary,
				systemReqConcepts,
				systemReqImpacts: sysReq.impacts,
				systemReqAcceptanceCriteria: sysReq.acceptanceCriteria,
				businessReqId: "",
				businessReqTitle: "",
				businessId: taskBusinessMap.get(sysReq.taskId) ?? "",
				taskId: sysReq.taskId,
				relatedBusinessReqs: [],
			});
			continue;
		}

		// 1つのシステム要件に対して、関連するすべての業務要件の情報を含める
		// メインの業務要件（最初のもの）を表示用に使用
		const mainBizReq = relatedBusinessReqs[0];
		const mainBusinessId = taskBusinessMap.get(mainBizReq.taskId) ?? "";

		result.push({
			systemReqId: sysReq.id,
			systemReqTitle: sysReq.title,
			systemReqSummary: sysReq.summary,
			systemReqConcepts,
			systemReqImpacts: sysReq.impacts,
			systemReqAcceptanceCriteria: sysReq.acceptanceCriteria,
			businessReqId: mainBizReq.id,
			businessReqTitle: mainBizReq.title,
			businessId: mainBusinessId,
			taskId: mainBizReq.taskId,
			// 関連業務要件のリスト（UI側で使用可能）
			relatedBusinessReqs: relatedBusinessReqs.map((req) => ({
				id: req.id,
				title: req.title,
				taskId: req.taskId,
				businessId: taskBusinessMap.get(req.taskId) ?? "",
			})),
		});
	}

	return result;
}
