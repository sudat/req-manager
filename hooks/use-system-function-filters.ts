import { useMemo, useState } from "react";
import type { SystemFunction, SrfCategory, SrfStatus } from "@/lib/domain";
import { useListFilter } from "./use-list-filter";

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
  const [categoryFilter, setCategoryFilter] = useState<SrfCategory | "all">("all");

  const {
    searchQuery: query,
    statusFilter,
    filteredItems: statusFilteredFunctions,
    setSearchQuery: setQuery,
    setStatusFilter,
  } = useListFilter({
    items: functions,
    searchFields: (fn) => [fn.id, fn.title],
    statusField: "status",
  });

  const filteredFunctions = useMemo(() => {
    if (categoryFilter === "all") return statusFilteredFunctions;
    return statusFilteredFunctions.filter((fn) => fn.category === categoryFilter);
  }, [statusFilteredFunctions, categoryFilter]);

  return {
    query,
    statusFilter: statusFilter as SrfStatus | "all",
    categoryFilter,
    filteredFunctions,
    setQuery,
    setStatusFilter: setStatusFilter as (filter: SrfStatus | "all") => void,
    setCategoryFilter,
  };
};
