"use client"

import { use } from "react";
import { Sparkles } from "lucide-react";
import { useSystemFunctions } from "@/hooks/use-system-functions";
import { ResourceListPage } from "@/components/resource-page/resource-list-page";
import { createSystemFunctionListConfig } from "@/config/resource-lists";

export default function SystemDomainFunctionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { functions, loading, error, deleteFunction, clearError } = useSystemFunctions(id);

  const config = createSystemFunctionListConfig(id);

  return (
    <ResourceListPage
      items={functions}
      loading={loading}
      error={error}
      config={config}
      onDelete={deleteFunction}
      onClearError={clearError}
      breadcrumb={[
        { label: "システム領域一覧", href: "/system-domains" },
        { label: "システム機能一覧" },
      ]}
      headerBadge={id}
      extraHeaderActions={[
        {
          label: "AIで追加",
          href: `/chat?screen=SD&sdId=${id}`,
          icon: Sparkles,
          variant: "ai",
        },
      ]}
    />
  );
}
