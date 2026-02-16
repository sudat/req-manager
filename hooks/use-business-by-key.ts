"use client";

import { useEffect, useState } from "react";
import { getBusinessByKey } from "@/lib/data/businesses";
import { useProject } from "@/components/project/project-context";
import type { Business } from "@/lib/domain";

type UseBusinessByKeyResult = {
  business: Business | null;
  businessArea: string | null;
  loading: boolean;
  error: string | null;
};

export function useBusinessByKey(businessKey: string | null | undefined): UseBusinessByKeyResult {
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

    // null/undefined は「業務領域キーが指定されていない」としてエラー表示
    if (businessKey === null || businessKey === undefined) {
      setLoading(false);
      setError("業務領域キーが指定されていません");
      setBusiness(null);
      return;
    }
    // 空文字列が渡された場合はエラーにする（本来のバリデーション）
    if (businessKey === "") {
      setError("業務領域が指定されていません");
      setBusiness(null);
      setLoading(false);
      return;
    }

    let active = true;

    async function fetchBusiness(): Promise<void> {
      // この時点でbusinessKeyとcurrentProjectIdはnullではない（上でチェック済み）
      if (!businessKey || !currentProjectId) return;

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
    businessArea: business?.area ?? null,
    loading,
    error,
  };
}
