import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";

interface SystemFunctionListHeaderProps {
  domainId: string;
  domainName: string | null;
}

export const SystemFunctionListHeader = ({
  domainId,
  domainName,
}: SystemFunctionListHeaderProps) => {
  return (
    <>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/system-domains">システム領域一覧</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>システム機能一覧</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-[32px] font-semibold tracking-tight text-slate-900">
            システム機能一覧
          </h1>
          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] font-mono px-2 py-0.5">
            {domainId}
          </Badge>
        </div>
        <p className="text-[13px] text-slate-500">
          {domainName ? `${domainName} のシステム機能` : "システム機能を一覧管理"}
        </p>
      </div>
    </>
  );
};
