import type { ChangeRequest } from "@/lib/domain/value-objects";
import { useListFilter } from "./use-list-filter";

export interface UseChangeRequestFiltersReturn {
  searchQuery: string;
  statusFilter: string;
  filteredRequests: ChangeRequest[];
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: string) => void;
}

interface UseChangeRequestFiltersProps {
  requests: ChangeRequest[];
}

export function useChangeRequestFilters({
  requests,
}: UseChangeRequestFiltersProps): UseChangeRequestFiltersReturn {
  const {
    searchQuery,
    statusFilter,
    filteredItems,
    setSearchQuery,
    setStatusFilter,
  } = useListFilter({
    items: requests,
    searchFields: (cr) => [cr.title, cr.ticketId],
    statusField: "status",
  });

  return {
    searchQuery,
    statusFilter,
    filteredRequests: filteredItems,
    setSearchQuery,
    setStatusFilter,
  };
}
