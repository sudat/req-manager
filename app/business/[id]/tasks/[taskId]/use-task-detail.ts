"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import {
	type BusinessRequirement,
	listBusinessRequirementsByTaskId,
} from "@/lib/data/business-requirements";
import { listConcepts } from "@/lib/data/concepts";
import {
	listSystemDomains,
	type SystemDomain,
} from "@/lib/data/system-domains";
import { listSystemFunctions } from "@/lib/data/system-functions";
import {
	listSystemRequirementsByTaskId,
	type SystemRequirement,
} from "@/lib/data/system-requirements";
import { getTaskById } from "@/lib/data/tasks";
import type {
	Concept,
	SystemFunction,
	Task,
	TaskKnowledge,
} from "@/lib/domain";
import { createEmptyTaskKnowledge } from "@/lib/utils/task-knowledge";
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
	optionsLoading: boolean;
	knowledge: TaskKnowledge;
	concepts: Concept[];
	conceptMap: Map<string, string>;
	systemFunctionMap: Map<string, string>;
	systemFunctionDomainMap: Map<string, string | null>;
	systemDomainMap: Map<string, string>;
	systemFunctions: {
		id: string;
		name: string;
		systemDomainId: string | null;
	}[];
	systemFunctionsFull: SystemFunction[];
};

export function useTaskDetail({
	bizId,
	taskId,
}: UseTaskDetailParams): UseTaskDetailReturn {
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
			if (parsed?.bizId !== bizId || parsed?.taskId !== taskId)
				return defaultKnowledge;
			return parsed;
		} catch {
			return defaultKnowledge;
		}
	});

	// タスク取得
	const fetchTask = useCallback(() => getTaskById(taskId), [taskId]);
	const {
		data: task,
		loading: taskLoading,
		error: taskError,
	} = useAsyncDataItem<Task>(fetchTask);

	// 業務要件取得
	const fetchBusinessRequirements = useCallback(
		() => listBusinessRequirementsByTaskId(taskId),
		[taskId],
	);
	const {
		data: businessRequirements,
		loading: requirementsLoading,
		error: requirementsError,
	} = useAsyncData<BusinessRequirement>(fetchBusinessRequirements);

	// システム要件取得
	const fetchSystemRequirements = useCallback(
		() => listSystemRequirementsByTaskId(taskId),
		[taskId],
	);
	const {
		data: systemRequirements,
		loading: systemRequirementsLoading,
		error: systemRequirementsError,
	} = useAsyncData<SystemRequirement>(fetchSystemRequirements);

	// オプションデータ（コンセプト・システム機能・システムドメイン）取得
	const [optionsError, setOptionsError] = useState<string | null>(null);
	const [optionsLoading, setOptionsLoading] = useState(true);
	const [concepts, setConcepts] = useState<Concept[]>([]);
	const [systemFunctions, setSystemFunctions] = useState<SystemFunction[]>([]);
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

			const fetchError =
				conceptResult.error ?? srfResult.error ?? domainResult.error;
			if (fetchError) {
				setOptionsError(fetchError);
				setOptionsLoading(false);
				return;
			}

			setConcepts(conceptResult.data ?? []);
			setSystemFunctions(srfResult.data ?? []);
			setSystemDomains(domainResult.data ?? []);
			setOptionsError(null);
			setOptionsLoading(false);
		}

		fetchOptions();

		return () => {
			optionsActiveRef.current = false;
		};
	}, []);

	const conceptMap = useMemo(
		() => new Map(concepts.map((c) => [c.id, c.name])),
		[concepts],
	);

	const systemFunctionMap = useMemo(
		() =>
			new Map(
				systemFunctions.map((srf) => [srf.id, srf.title ?? srf.id]),
			),
		[systemFunctions],
	);

	const systemFunctionDomainMap = useMemo(
		() => new Map(systemFunctions.map((srf) => [srf.id, srf.systemDomainId ?? null])),
		[systemFunctions],
	);

	const systemFunctionOptions = useMemo(
		() =>
			systemFunctions.map((srf) => ({
				id: srf.id,
				name: srf.title ?? srf.id,
				systemDomainId: srf.systemDomainId ?? null,
			})),
		[systemFunctions],
	);

	const systemDomainMap = useMemo(
		() => new Map(systemDomains.map((domain) => [domain.id, domain.name])),
		[systemDomains],
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
		optionsLoading,
		knowledge,
		concepts,
		conceptMap,
		systemFunctionMap,
		systemFunctionDomainMap,
		systemDomainMap,
		systemFunctions: systemFunctionOptions,
		systemFunctionsFull: systemFunctions,
	};
}
