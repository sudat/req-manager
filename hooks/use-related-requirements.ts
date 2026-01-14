"use client";

import { useEffect, useState } from "react";
import type { RelatedRequirementInfo } from "@/lib/mock/data/types";
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

			const sysReqToBizReqsMap = buildSysReqToBizReqsMap(businessRequirements ?? []);

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
			if (!map.has(sysReqId)) {
				map.set(sysReqId, []);
			}
			map.get(sysReqId)!.push(bizReq.id);
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

		if (relatedBizReqIds.length === 0) {
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
			});
			continue;
		}

		for (const businessReqId of relatedBizReqIds) {
			const businessReq = businessReqMap.get(businessReqId);
			if (!businessReq) continue;
			const businessId = taskBusinessMap.get(businessReq.taskId) ?? "";
			result.push({
				systemReqId: sysReq.id,
				systemReqTitle: sysReq.title,
				systemReqSummary: sysReq.summary,
				systemReqConcepts,
				systemReqImpacts: sysReq.impacts,
				systemReqAcceptanceCriteria: sysReq.acceptanceCriteria,
				businessReqId: businessReq.id,
				businessReqTitle: businessReq.title,
				businessId,
				taskId: businessReq.taskId,
			});
		}
	}

	return result;
}
