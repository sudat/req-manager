import { useEffect, useState } from "react";
import type { SystemFunction } from "@/lib/domain";
import { listSystemFunctionsByDomain } from "@/lib/data/system-functions";
import { getSystemDomainById } from "@/lib/data/system-domains";
import { deleteSystemRequirementsBySrfId } from "@/lib/data/system-requirements";

export interface UseSystemFunctionsReturn {
  functions: SystemFunction[];
  domainName: string | null;
  loading: boolean;
  error: string | null;
  deleteFunction: (srf: SystemFunction) => Promise<void>;
  clearError: () => void;
}

export const useSystemFunctions = (domainId: string): UseSystemFunctionsReturn => {
  const [functions, setFunctions] = useState<SystemFunction[]>([]);
  const [domainName, setDomainName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      const [{ data: domain, error: domainError }, { data, error: fetchError }] = await Promise.all([
        getSystemDomainById(domainId),
        listSystemFunctionsByDomain(domainId),
      ]);
      if (!active) return;
      const mergedError = domainError ?? fetchError;
      if (mergedError) {
        setError(mergedError);
        setFunctions([]);
        setDomainName(null);
      } else {
        setError(null);
        setDomainName(domain?.name ?? null);
        setFunctions(data ?? []);
      }
      setLoading(false);
    };
    fetchData();
    return () => {
      active = false;
    };
  }, [domainId]);

  const deleteFunction = async (srf: SystemFunction) => {
    const { error: requirementDeleteError } = await deleteSystemRequirementsBySrfId(srf.id);
    if (requirementDeleteError) {
      setError(requirementDeleteError);
      return;
    }
    const { deleteSystemFunction } = await import("@/lib/data/system-functions");
    const { error: deleteError } = await deleteSystemFunction(srf.id);
    if (deleteError) {
      setError(deleteError);
      return;
    }
    setFunctions((prev) => prev.filter((item) => item.id !== srf.id));
  };

  const clearError = () => setError(null);

  return {
    functions,
    domainName,
    loading,
    error,
    deleteFunction,
    clearError,
  };
};
