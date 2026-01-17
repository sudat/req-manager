"use client";

import { useEffect, useState } from "react";
import { listTasks, listTasksByBusinessId } from "@/lib/data/tasks";
import { getBusinessById } from "@/lib/data/businesses";
import { listConcepts } from "@/lib/data/concepts";
import { listSystemFunctions } from "@/lib/data/system-functions";
import { listSystemDomains, type SystemDomain } from "@/lib/data/system-domains";
import { nextSequentialId } from "@/lib/data/id";
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

  useEffect(() => {
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
        listTasksByBusinessId(bizId!),
        getBusinessById(bizId!),
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

      const ids = (allTasks ?? []).map((task) => task.id);
      const nextId = nextSequentialId("TASK-", ids);
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
  }, [bizId]);

  useEffect(() => {
    let active = true;

    async function fetchOptions(): Promise<void> {
      const [
        { data: conceptRows, error: conceptError },
        { data: srfRows, error: srfError },
        { data: domainRows, error: domainError },
      ] = await Promise.all([
        listConcepts(),
        listSystemFunctions(),
        listSystemDomains(),
      ]);

      if (!active) return;

      const fetchError = conceptError ?? srfError ?? domainError;
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
          name: srf.summary?.split("：")[0] ?? srf.summary,
        }))
      );
      setSystemDomains(domainRows ?? []);
      setOptionsError(null);
    }

    fetchOptions();

    return () => {
      active = false;
    };
  }, []);

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
  };
}
