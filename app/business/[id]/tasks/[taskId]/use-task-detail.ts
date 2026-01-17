"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import type { Task } from "@/lib/domain";
import type { TaskKnowledge } from "@/lib/domain";
import { createEmptyTaskKnowledge } from "@/lib/utils/task-knowledge";
import { listBusinessRequirementsByTaskId, type BusinessRequirement } from "@/lib/data/business-requirements";
import { listSystemRequirementsByTaskId, type SystemRequirement } from "@/lib/data/system-requirements";
import { getTaskById } from "@/lib/data/tasks";
import { listConcepts } from "@/lib/data/concepts";
import { listSystemFunctions } from "@/lib/data/system-functions";
import { listSystemDomains, type SystemDomain } from "@/lib/data/system-domains";
import { useAsyncData, useAsyncDataItem } from "./hooks/useAsyncData";

type UseTaskDetailParams = {
	bizId: string;
	taskId: string;
};

type UseTaskDetailReturn = {
	task: Task | null;
	taskLoading: boolean;
	taskError: string | null;
	businessRequirements: BusinessRequirement[];
	requirementsLoading: boolean;
	requirementsError: string | null;
	systemRequirements: SystemRequirement[];
	systemRequirementsLoading: boolean;
	systemRequirementsError: string | null;
	optionsError: string | null;
	knowledge: TaskKnowledge;
	conceptMap: Map<string, string>;
	systemFunctionMap: Map<string, string>;
	systemFunctionDomainMap: Map<string, string | null>;
	systemDomainMap: Map<string, string>;
	systemFunctions: { id: string; name: string; systemDomainId: string | null }[];
};

export function useTaskDetail({ bizId, taskId }: UseTaskDetailParams): UseTaskDetailReturn {
	const storageKey = `task-knowledge:${bizId}:${taskId}`;
	const defaultKnowledge = useMemo(
		() => createEmptyTaskKnowledge(bizId, taskId),
		[bizId, taskId],
	);

	const [knowledge] = useState<TaskKnowledge>(() => {
		if (typeof window === "undefined") return defaultKnowledge;
		try {
			const raw = window.localStorage.getItem(storageKey);
			if (!raw) return defaultKnowledge;
			const parsed = JSON.parse(raw) as TaskKnowledge;
			if (parsed?.bizId !== bizId || parsed?.taskId !== taskId) return defaultKnowledge;
			return parsed;
		} catch {
			return defaultKnowledge;
		}
	});

	// タスク取得
	const fetchTask = useCallback(() => getTaskById(taskId), [taskId]);
	const { data: task, loading: taskLoading, error: taskError } = useAsyncDataItem<Task>(
		fetchTask
	);

	// 業務要件取得
	const fetchBusinessRequirements = useCallback(
		() => listBusinessRequirementsByTaskId(taskId),
		[taskId]
	);
	const {
		data: businessRequirements,
		loading: requirementsLoading,
		error: requirementsError,
	} = useAsyncData<BusinessRequirement>(fetchBusinessRequirements);

	// システム要件取得
	const fetchSystemRequirements = useCallback(
		() => listSystemRequirementsByTaskId(taskId),
		[taskId]
	);
	const {
		data: systemRequirements,
		loading: systemRequirementsLoading,
		error: systemRequirementsError,
	} = useAsyncData<SystemRequirement>(fetchSystemRequirements);

	// オプションデータ（コンセプト・システム機能・システムドメイン）取得
	const [optionsError, setOptionsError] = useState<string | null>(null);
	const [concepts, setConcepts] = useState<{ id: string; name: string }[]>([]);
	const [systemFunctions, setSystemFunctions] = useState<
		{ id: string; name: string; systemDomainId: string | null }[]
	>([]);
	const [systemDomains, setSystemDomains] = useState<SystemDomain[]>([]);
	const optionsActiveRef = useRef(true);

	// オプションデータの取得はPromise.allパターンのため、独自のuseEffectを使用
	useEffect(() => {
		optionsActiveRef.current = true;

		async function fetchOptions(): Promise<void> {
			const [conceptResult, srfResult, domainResult] = await Promise.all([
				listConcepts(),
				listSystemFunctions(),
				listSystemDomains(),
			]);
			if (!optionsActiveRef.current) return;

			const fetchError = conceptResult.error ?? srfResult.error ?? domainResult.error;
			if (fetchError) {
				setOptionsError(fetchError);
				return;
			}

			setConcepts((conceptResult.data ?? []).map((c) => ({ id: c.id, name: c.name })));
			setSystemFunctions(
				(srfResult.data ?? []).map((srf) => ({
					id: srf.id,
					name: srf.summary?.split(":")[0] ?? srf.summary,
					systemDomainId: srf.systemDomainId ?? null,
				}))
			);
			setSystemDomains(domainResult.data ?? []);
			setOptionsError(null);
		}

		fetchOptions();

		return () => {
			optionsActiveRef.current = false;
		};
	}, []);

	const conceptMap = useMemo(
		() => new Map(concepts.map((c) => [c.id, c.name])),
		[concepts]
	);

	const systemFunctionMap = useMemo(
		() => new Map(systemFunctions.map((srf) => [srf.id, srf.name])),
		[systemFunctions]
	);

	const systemFunctionDomainMap = useMemo(
		() => new Map(systemFunctions.map((srf) => [srf.id, srf.systemDomainId])),
		[systemFunctions]
	);

	const systemDomainMap = useMemo(
		() => new Map(systemDomains.map((domain) => [domain.id, domain.name])),
		[systemDomains]
	);

	return {
		task,
		taskLoading,
		taskError,
		businessRequirements,
		requirementsLoading,
		requirementsError,
		systemRequirements,
		systemRequirementsLoading,
		systemRequirementsError,
		optionsError,
		knowledge,
		conceptMap,
		systemFunctionMap,
		systemFunctionDomainMap,
		systemDomainMap,
		systemFunctions,
	};
}
