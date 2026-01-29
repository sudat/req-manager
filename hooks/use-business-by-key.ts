"use client";

import { useEffect, useState } from "react";
import { getBusinessByKey } from "@/lib/data/businesses";
import { useProject } from "@/components/project/project-context";
import type { Business } from "@/lib/domain";

type UseBusinessByKeyResult = {
  business: Business | null;
  businessId: string | null;
  businessArea: string | null;
  loading: boolean;
  error: string | null;
};

export function useBusinessByKey(businessKey: string | null): UseBusinessByKeyResult {
  const { currentProjectId, loading: projectLoading } = useProject();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectLoading) return;
    if (!currentProjectId) {
      setError("プロジェクトが選択されていません");
      setBusiness(null);
      setLoading(false);
      return;
    }

    if (!businessKey) {
      setError("業務領域が指定されていません");
      setBusiness(null);
      setLoading(false);
      return;
    }

    let active = true;

    async function fetchBusiness(): Promise<void> {
      setLoading(true);
      const { data, error: fetchError } = await getBusinessByKey(
        businessKey,
        currentProjectId
      );
      if (!active) return;

      if (fetchError) {
        setError(fetchError);
        setBusiness(null);
      } else {
        setError(null);
        setBusiness(data ?? null);
      }
      setLoading(false);
    }

    fetchBusiness();

    return () => {
      active = false;
    };
  }, [businessKey, currentProjectId, projectLoading]);

  return {
    business,
    businessId: business?.id ?? null,
    businessArea: business?.area ?? null,
    loading,
    error,
  };
}
