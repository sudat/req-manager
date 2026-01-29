"use client";

import { useEffect, useState } from "react";
import { useProject } from "@/components/project/project-context";
import { getBusinessByKey } from "@/lib/data/businesses";
import { listConcepts } from "@/lib/data/concepts";
import { listSystemFunctions } from "@/lib/data/system-functions";
import { listSystemDomains, type SystemDomain } from "@/lib/data/system-domains";
import { listSystemRequirements } from "@/lib/data/system-requirements";
import { listTasks, listTasksByBusinessId } from "@/lib/data/tasks";
import type { SelectableItem } from "@/lib/domain/forms";
import { getNextBtId } from "@/lib/utils/id-rules";

type UseManualAddDataResult = {
  loading: boolean;
  error: string | null;
  optionsError: string | null;
  taskId: string;
  sortOrder: number;
  businessId: string | null;
  businessArea: string | null;
  businessName: string | null;
  concepts: SelectableItem[];
  systemFunctions: SelectableItem[];
  systemDomains: SystemDomain[];
  systemRequirements: SelectableItem[];
};

export function useManualAddData(businessKey: string | null): UseManualAddDataResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState("BT-BD-0001");
  const [sortOrder, setSortOrder] = useState(1);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessArea, setBusinessArea] = useState<string | null>(null);
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
      if (!businessKey) {
        if (!active) return;
        setLoading(false);
        setBusinessName(null);
        setBusinessId(null);
        setBusinessArea(null);
        setError(null);
        setTaskId("BT-BD-0001");
        setSortOrder(1);
        return;
      }

      setLoading(true);

      const [
        { data: allTasks, error: allError },
        { data: business, error: businessError },
      ] = await Promise.all([
        listTasks(currentProjectId ?? undefined),
        getBusinessByKey(businessKey!, currentProjectId ?? undefined),
      ]);

      if (!active) return;

      const fetchError = allError ?? businessError;
      if (fetchError) {
        setError(fetchError);
        setLoading(false);
        return;
      }

      if (!business) {
        setError("指定された業務が見つかりません。");
        setBusinessName(null);
        setBusinessId(null);
        setBusinessArea(null);
        setLoading(false);
        return;
      }

      const { data: bizTasks, error: bizError } = await listTasksByBusinessId(
        business.id,
        currentProjectId ?? undefined
      );

      if (!active) return;

      if (bizError) {
        setError(bizError);
        setLoading(false);
        return;
      }

      const nextId = getNextBtId(business.area ?? "BD", (allTasks ?? []).map((task) => task.id));
      const maxOrder = (bizTasks ?? []).reduce(
        (max, task) => Math.max(max, task.sortOrder ?? 0),
        0
      );

      setTaskId(nextId);
      setSortOrder(maxOrder + 1);
      setBusinessId(business.id);
      setBusinessArea(business.area ?? null);
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
  }, [businessKey, currentProjectId, projectLoading]);

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
    businessId,
    businessArea,
    businessName,
    concepts,
    systemFunctions,
    systemDomains,
    systemRequirements,
  };
}
