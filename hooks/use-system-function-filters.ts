import { useMemo, useState } from "react";
import type { SystemFunction, SrfCategory, SrfStatus } from "@/lib/domain";

export interface UseSystemFunctionFiltersProps {
  functions: SystemFunction[];
}

export interface UseSystemFunctionFiltersReturn {
  query: string;
  statusFilter: SrfStatus | "all";
  categoryFilter: SrfCategory | "all";
  filteredFunctions: SystemFunction[];
  setQuery: (query: string) => void;
  setStatusFilter: (filter: SrfStatus | "all") => void;
  setCategoryFilter: (filter: SrfCategory | "all") => void;
}

export const useSystemFunctionFilters = ({
  functions,
}: UseSystemFunctionFiltersProps): UseSystemFunctionFiltersReturn => {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<SrfStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<SrfCategory | "all">("all");

  const filteredFunctions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return functions.filter((item) => {
      const matchesQuery = normalized
        ? [item.id, item.title].join(" ").toLowerCase().includes(normalized)
        : true;
      const matchesStatus = statusFilter === "all" ? true : item.status === statusFilter;
      const matchesCategory = categoryFilter === "all" ? true : item.category === categoryFilter;
      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [functions, query, statusFilter, categoryFilter]);

  return {
    query,
    statusFilter,
    categoryFilter,
    filteredFunctions,
    setQuery,
    setStatusFilter,
    setCategoryFilter,
  };
};
