"use client";

import { useEffect, useState } from "react";
import { useProject } from "@/components/project/project-context";
import { getBusinessById } from "@/lib/data/businesses";
import { listConcepts } from "@/lib/data/concepts";
import { nextSequentialIdFrom } from "@/lib/data/id";
import { listSystemFunctions } from "@/lib/data/system-functions";
import { listSystemDomains, type SystemDomain } from "@/lib/data/system-domains";
import { listSystemRequirements } from "@/lib/data/system-requirements";
import { listTasks, listTasksByBusinessId } from "@/lib/data/tasks";
import type { SelectableItem } from "@/lib/domain/forms";

type UseManualAddDataResult = {
  loading: boolean;
  error: string | null;
  optionsError: string | null;
  taskId: string;
  sortOrder: number;
  businessName: string | null;
  concepts: SelectableItem[];
  systemFunctions: SelectableItem[];
  systemDomains: SystemDomain[];
  systemRequirements: SelectableItem[];
};

export function useManualAddData(bizId: string | null): UseManualAddDataResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState("TASK-001");
  const [sortOrder, setSortOrder] = useState(1);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [concepts, setConcepts] = useState<SelectableItem[]>([]);
  const [systemFunctions, setSystemFunctions] = useState<SelectableItem[]>([]);
  const [systemDomains, setSystemDomains] = useState<SystemDomain[]>([]);
  const [systemRequirements, setSystemRequirements] = useState<SelectableItem[]>([]);
  const { currentProjectId, loading: projectLoading } = useProject();

  useEffect(() => {
    if (projectLoading) return;
    if (!currentProjectId) {
      setError("プロジェクトが選択されていません。");
      setLoading(false);
      return;
    }
    let active = true;

    async function fetchTaskData(): Promise<void> {
      if (!bizId) {
        if (!active) return;
        setLoading(false);
        setBusinessName(null);
        setError(null);
        setTaskId("TASK-001");
        setSortOrder(1);
        return;
      }

      setLoading(true);

      const [
        { data: allTasks, error: allError },
        { data: bizTasks, error: bizError },
        { data: business, error: businessError },
      ] = await Promise.all([
        listTasks(),
        listTasksByBusinessId(bizId!, currentProjectId ?? undefined),
        getBusinessById(bizId!, currentProjectId ?? undefined),
      ]);

      if (!active) return;

      const fetchError = allError ?? bizError ?? businessError;
      if (fetchError) {
        setError(fetchError);
        setLoading(false);
        return;
      }

      if (!business) {
        setError("指定された業務が見つかりません。");
        setBusinessName(null);
        setLoading(false);
        return;
      }

      const nextId = nextSequentialIdFrom("TASK-", allTasks ?? [], (task) => task.id);
      const maxOrder = (bizTasks ?? []).reduce(
        (max, task) => Math.max(max, task.sortOrder ?? 0),
        0
      );

      setTaskId(nextId);
      setSortOrder(maxOrder + 1);
      setBusinessName(business.name);
      setError(null);
      setLoading(false);
    }

    fetchTaskData().catch(() => {
      if (active) {
        setError("タスク情報の取得に失敗しました。");
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [bizId, currentProjectId, projectLoading]);

  useEffect(() => {
    if (projectLoading) return;
    if (!currentProjectId) {
      setOptionsError("プロジェクトが選択されていません。");
      return;
    }
    let active = true;

    async function fetchOptions(): Promise<void> {
      const [
        { data: conceptRows, error: conceptError },
        { data: srfRows, error: srfError },
        { data: domainRows, error: domainError },
        { data: sysReqRows, error: sysReqError },
      ] = await Promise.all([
        listConcepts(currentProjectId ?? undefined),
        listSystemFunctions(currentProjectId ?? undefined),
        listSystemDomains(currentProjectId ?? undefined),
        listSystemRequirements(currentProjectId ?? undefined),
      ]);

      if (!active) return;

      const fetchError = conceptError ?? srfError ?? domainError ?? sysReqError;
      if (fetchError) {
        setOptionsError(fetchError);
        return;
      }

      setConcepts(
        (conceptRows ?? []).map((c) => ({ id: c.id, name: c.name }))
      );
      setSystemFunctions(
        (srfRows ?? []).map((srf) => ({
          id: srf.id,
          name: srf.title ?? srf.id,
        }))
      );
      setSystemDomains(domainRows ?? []);
      setSystemRequirements(
        (sysReqRows ?? []).map((sr) => ({
          id: sr.id,
          name: sr.title ?? sr.id,
        }))
      );
      setOptionsError(null);
    }

    fetchOptions();

    return () => {
      active = false;
    };
  }, [currentProjectId, projectLoading]);

  return {
    loading,
    error,
    optionsError,
    taskId,
    sortOrder,
    businessName,
    concepts,
    systemFunctions,
    systemDomains,
    systemRequirements,
  };
}
