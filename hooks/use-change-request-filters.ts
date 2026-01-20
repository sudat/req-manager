import { useMemo, useState } from "react";
import type { ChangeRequest } from "@/lib/domain/value-objects";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredRequests = useMemo(() => {
    return requests.filter((cr) => {
      const matchSearch =
        cr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cr.ticketId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === "all" || cr.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [requests, searchQuery, statusFilter]);

  return {
    searchQuery,
    statusFilter,
    filteredRequests,
    setSearchQuery,
    setStatusFilter,
  };
}
