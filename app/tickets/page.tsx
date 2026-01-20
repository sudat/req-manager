"use client"

import { useRouter } from "next/navigation";
import { MobileHeader } from "@/components/layout/mobile-header";
import { ChangeRequestListHeader } from "@/components/tickets/change-request-list-header";
import { ChangeRequestListToolbar } from "@/components/tickets/change-request-list-toolbar";
import { ChangeRequestTable } from "@/components/tickets/change-request-table";
import { useChangeRequests } from "@/hooks/use-change-requests";
import { useChangeRequestFilters } from "@/hooks/use-change-request-filters";
import { confirmDelete } from "@/lib/ui/confirm";

export default function TicketsPage() {
  const router = useRouter();
  const { changeRequests, loading, error, deleteRequest, clearError } = useChangeRequests();

  const {
    searchQuery,
    statusFilter,
    filteredRequests,
    setSearchQuery,
    setStatusFilter,
  } = useChangeRequestFilters({ requests: changeRequests });

  const handleRowClick = (ticketId: string) => {
    router.push(`/tickets/${ticketId}`);
  };

  const handleDelete = async (id: string, ticketId: string) => {
    if (!confirmDelete(`${ticketId}`)) return;
    await deleteRequest(id, ticketId);
  };

  return (
    <>
      <MobileHeader />
      <div className="flex-1 min-h-screen bg-white">
        <div className="mx-auto max-w-[1400px] px-8 py-4">
          <ChangeRequestListHeader />
          <ChangeRequestListToolbar
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            onSearchChange={setSearchQuery}
            onStatusChange={setStatusFilter}
          />
          {error && (
            <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3">
              <p className="text-[13px] text-rose-600">{error}</p>
            </div>
          )}
          <ChangeRequestTable
            loading={loading}
            requests={filteredRequests}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            onRowClick={handleRowClick}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </>
  );
}
