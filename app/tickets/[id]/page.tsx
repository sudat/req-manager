import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { MobileHeader } from "@/components/layout/mobile-header";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Pencil } from "lucide-react";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getChangeRequestById } from "@/lib/data/change-requests";
import { listImpactScopesByChangeRequestId } from "@/lib/data/impact-scopes";
import { getAcceptanceConfirmationCompletionStatus } from "@/lib/data/acceptance-confirmations";
import { TicketBasicInfoCard } from "@/components/tickets/ticket-basic-info-card";
import { TicketImpactCard } from "@/components/tickets/ticket-impact-card";
import { AcceptanceConfirmationPanel } from "@/components/tickets/acceptance-confirmation-panel";

const DEFAULT_PROJECT_ID = "00000000-0000-0000-0000-000000000001";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectId = cookies().get("current-project-id")?.value ?? DEFAULT_PROJECT_ID;
  const { data: changeRequest, error } = await getChangeRequestById(id, projectId);

  if (error || !changeRequest) {
    notFound();
  }

  const { data: impactScopes } = await listImpactScopesByChangeRequestId(id);
  const { data: completionStatus } = await getAcceptanceConfirmationCompletionStatus(id);

  return (
    <>
      <MobileHeader />
      <div className="flex-1 min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[1400px] px-8 py-4">
          {/* パンくずリスト */}
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/tickets">変更要求一覧</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>変更要求詳細</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Link href={`/tickets/${id}/edit`}>
                <Button variant="outline" className="h-8 px-4 text-[14px] font-medium border-slate-200 hover:bg-slate-50 gap-2">
                  <Pencil className="h-4 w-4" />
                  編集
                </Button>
              </Link>
              <Button className="h-8 gap-2 text-[14px] bg-slate-900 hover:bg-slate-800">
                <CheckCircle2 className="h-4 w-4" />
                ベースラインに反映
              </Button>
            </div>
          </div>

          <h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-4">{changeRequest.title}</h1>

          <div className="space-y-4">
            <TicketBasicInfoCard changeRequest={changeRequest} />

            {/* 影響範囲カード */}
            {impactScopes && impactScopes.length > 0 && (
              <TicketImpactCard impactScopes={impactScopes} />
            )}

            {/* 受入条件確認パネル - Phase 5.6で実装済み */}
            <AcceptanceConfirmationPanel changeRequestId={id} />

            {/* 北極星KPI達成状況サマリー */}
            {completionStatus && (
              <div className="rounded-md border border-slate-200 bg-white p-4">
                <h3 className="text-[14px] font-semibold text-slate-900 mb-3">受入条件確認状況サマリー</h3>
                <div className="flex items-center gap-6 text-[13px]">
                  <div>
                    <span className="text-slate-500">総数:</span>
                    <span className="ml-2 font-mono text-slate-900">{completionStatus.total}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">確認済:</span>
                    <span className="ml-2 font-mono text-emerald-600">{completionStatus.verified}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">未確認:</span>
                    <span className="ml-2 font-mono text-amber-600">{completionStatus.pending}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">達成率:</span>
                    <span className="ml-2 font-mono text-slate-900">{completionStatus.completionRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
