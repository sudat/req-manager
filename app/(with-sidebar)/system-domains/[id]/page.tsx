"use client"

import { use } from "react";
import { useRouter } from "next/navigation";
import { useSystemFunctions } from "@/hooks/use-system-functions";
import { useSystemFunctionFilters } from "@/hooks/use-system-function-filters";
import { SystemFunctionListHeader } from "@/components/system-functions/system-function-list-header";
import { SystemFunctionListToolbar } from "@/components/system-functions/system-function-list-toolbar";
import { SystemFunctionTable } from "@/components/system-functions/system-function-table";
import { confirmDelete } from "@/lib/ui/confirm";

export default function SystemDomainFunctionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { functions, domainName, loading, error, deleteFunction, clearError } = useSystemFunctions(id);

  const {
    query,
    statusFilter,
    categoryFilter,
    filteredFunctions,
    setQuery,
    setStatusFilter,
    setCategoryFilter,
  } = useSystemFunctionFilters({ functions });

  const handleRowClick = (srfId: string) => {
    router.push(`/system-domains/${id}/${srfId}`);
  };

  const handleDelete = async (srf: typeof functions[number]) => {
    if (!confirmDelete(`${srf.title}（${srf.id}）`)) return;
    await deleteFunction(srf);
  };

  const isFiltered = query !== "" || statusFilter !== "all" || categoryFilter !== "all";

  return (
    <div className="flex-1 min-h-screen bg-white">
      <div className="mx-auto max-w-[1400px] px-8 py-4">
        <SystemFunctionListHeader domainId={id} domainName={domainName} />
        <SystemFunctionListToolbar
          domainId={id}
          query={query}
          statusFilter={statusFilter}
          categoryFilter={categoryFilter}
          onQueryChange={setQuery}
          onStatusFilterChange={setStatusFilter}
          onCategoryFilterChange={setCategoryFilter}
        />
        {error && (
          <div className="mb-4 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-sm flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="text-rose-500 hover:text-rose-700 font-medium"
            >
              閉じる
            </button>
          </div>
        )}
        <SystemFunctionTable
          domainId={id}
          loading={loading}
          error={error}
          functions={filteredFunctions}
          isFiltered={isFiltered}
          onRowClick={handleRowClick}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
