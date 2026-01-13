"use client";

import { useEffect, useMemo, useState } from "react";
import type { Task } from "@/lib/mock/data/types";
import type { TaskKnowledge } from "@/lib/mock/task-knowledge";
import { getDefaultTaskKnowledge } from "@/lib/mock/task-knowledge";
import { getTaskById } from "@/lib/data/tasks";
import { listBusinessRequirementsByTaskId, type BusinessRequirement } from "@/lib/data/business-requirements";
import { listConcepts } from "@/lib/data/concepts";
import { listSystemFunctions } from "@/lib/data/system-functions";
import { listSystemDomains, type SystemDomain } from "@/lib/data/system-domains";

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
  optionsError: string | null;
  knowledge: TaskKnowledge;
  conceptMap: Map<string, string>;
  systemFunctionMap: Map<string, string>;
  systemFunctionDomainMap: Map<string, string | null>;
  systemDomainMap: Map<string, string>;
};

export function useTaskDetail({ bizId, taskId }: UseTaskDetailParams): UseTaskDetailReturn {
  const storageKey = `task-knowledge:${bizId}:${taskId}`;
  const defaultKnowledge = useMemo(
    () => getDefaultTaskKnowledge({ bizId, taskId }),
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

  const [task, setTask] = useState<Task | null>(null);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [taskLoading, setTaskLoading] = useState(true);

  const [businessRequirements, setBusinessRequirements] = useState<BusinessRequirement[]>([]);
  const [requirementsError, setRequirementsError] = useState<string | null>(null);
  const [requirementsLoading, setRequirementsLoading] = useState(true);

  const [concepts, setConcepts] = useState<{ id: string; name: string }[]>([]);
  const [systemFunctions, setSystemFunctions] = useState<{ id: string; name: string; systemDomainId: string | null }[]>([]);
  const [systemDomains, setSystemDomains] = useState<SystemDomain[]>([]);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function fetchTask(): Promise<void> {
      setTaskLoading(true);
      const { data, error } = await getTaskById(taskId);
      if (!active) return;
      if (error) {
        setTaskError(error);
        setTask(null);
      } else {
        setTaskError(null);
        setTask(data);
      }
      setTaskLoading(false);
    }
    fetchTask();
    return () => {
      active = false;
    };
  }, [taskId]);

  useEffect(() => {
    let active = true;
    async function fetchRequirements(): Promise<void> {
      setRequirementsLoading(true);
      const { data, error } = await listBusinessRequirementsByTaskId(taskId);
      if (!active) return;
      if (error) {
        setRequirementsError(error);
        setBusinessRequirements([]);
      } else {
        setRequirementsError(null);
        setBusinessRequirements(data ?? []);
      }
      setRequirementsLoading(false);
    }
    fetchRequirements();
    return () => {
      active = false;
    };
  }, [taskId]);

  useEffect(() => {
    let active = true;
    async function fetchOptions(): Promise<void> {
      const [conceptResult, srfResult, domainResult] = await Promise.all([
        listConcepts(),
        listSystemFunctions(),
        listSystemDomains(),
      ]);
      if (!active) return;

      const fetchError = conceptResult.error ?? srfResult.error ?? domainResult.error;
      if (fetchError) {
        setOptionsError(fetchError);
        return;
      }

      setConcepts((conceptResult.data ?? []).map((c) => ({ id: c.id, name: c.name })));
      setSystemFunctions((srfResult.data ?? []).map((srf) => ({
        id: srf.id,
        name: srf.summary?.split(":")[0] ?? srf.summary,
        systemDomainId: srf.systemDomainId ?? null,
      })));
      setSystemDomains(domainResult.data ?? []);
      setOptionsError(null);
    }
    fetchOptions();
    return () => {
      active = false;
    };
  }, []);

  const conceptMap = useMemo(
    () => new Map(concepts.map((c) => [c.id, c.name])),
    [concepts],
  );

  const systemFunctionMap = useMemo(
    () => new Map(systemFunctions.map((srf) => [srf.id, srf.name])),
    [systemFunctions],
  );

  const systemFunctionDomainMap = useMemo(
    () => new Map(systemFunctions.map((srf) => [srf.id, srf.systemDomainId])),
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
    optionsError,
    knowledge,
    conceptMap,
    systemFunctionMap,
    systemFunctionDomainMap,
    systemDomainMap,
  };
}
