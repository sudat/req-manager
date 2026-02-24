import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { MobileHeader } from "@/components/layout/mobile-header";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { CURRENT_PROJECT_ID_KEY, DEFAULT_PROJECT_ID } from "@/lib/constants/project";
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
import { getInvestigationResultByChangeRequestId } from "@/lib/data/investigation-results";
import { listDesignDecisionLogsByChangeRequestId } from "@/lib/data/design-decision-logs";
import { TicketBasicInfoCard } from "@/components/tickets/ticket-basic-info-card";
import { TicketImpactCard } from "@/components/tickets/ticket-impact-card";
import { AcceptanceConfirmationPanel } from "@/components/tickets/acceptance-confirmation-panel";
import { InvestigateButton } from "@/components/tickets/investigate-button";
import { TicketInvestigationSection } from "@/components/tickets/ticket-investigation-section";
import { GenerateInstructionPackageButton } from "@/components/tickets/generate-instruction-package-button";
import { TicketDesignDecisionLogCard } from "@/components/tickets/ticket-design-decision-log-card";
import type { DesignDecisionLogTargetType } from "@/lib/domain/value-objects";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const projectId = cookieStore.get(CURRENT_PROJECT_ID_KEY)?.value ?? DEFAULT_PROJECT_ID;
  const { data: changeRequest, error } = await getChangeRequestById(id, projectId);

  if (error || !changeRequest) {
    notFound();
  }

  const { data: impactScopes } = await listImpactScopesByChangeRequestId(id, projectId);
  const { data: investigationResult } = await getInvestigationResultByChangeRequestId(id, projectId);
  const { data: designDecisionLogs } = await listDesignDecisionLogsByChangeRequestId(id);
  const targetOptionMap = new Map<string, {
    targetType: DesignDecisionLogTargetType;
    targetId: string;
    label: string;
  }>();

  const addTargetOption = (
    targetType: DesignDecisionLogTargetType,
    targetId: string,
    label: string
  ) => {
    if (!targetId) return;
    const key = `${targetType}:${targetId}`;
    if (!targetOptionMap.has(key)) {
      targetOptionMap.set(key, { targetType, targetId, label });
    }
  };

  addTargetOption("change_request", id, changeRequest.title);
  (impactScopes ?? []).forEach((scope) => {
    if (scope.targetType === "business_requirement") {
      addTargetOption("br", scope.targetId, scope.targetTitle);
    } else if (scope.targetType === "system_requirement") {
      addTargetOption("sr", scope.targetId, scope.targetTitle);
    } else if (scope.targetType === "system_function") {
      addTargetOption("sf", scope.targetId, scope.targetTitle);
    } else if (scope.targetType === "file") {
      addTargetOption("impl_unit", scope.targetId, scope.targetTitle);
    }
  });

  (investigationResult?.topDownResult.affectedBRs ?? []).forEach((brId) =>
    addTargetOption("br", brId, brId)
  );
  (investigationResult?.topDownResult.affectedSFs ?? []).forEach((sfId) =>
    addTargetOption("sf", sfId, sfId)
  );
  (investigationResult?.topDownResult.affectedSRs ?? []).forEach((srId) =>
    addTargetOption("sr", srId, srId)
  );
  (investigationResult?.topDownResult.affectedACs ?? []).forEach((acId) =>
    addTargetOption("ac", acId, acId)
  );
  const targetOptions = Array.from(targetOptionMap.values());

  return (
    <>
      <MobileHeader />
      <div className="min-h-screen bg-slate-50">
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
              {changeRequest.status === "open" && (
                <InvestigateButton changeRequestId={id} />
              )}
              <GenerateInstructionPackageButton
                changeRequestId={id}
                disabled={
                  !investigationResult ||
                  changeRequest.status === "open"
                }
              />
            </div>
          </div>

          <h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-4">{changeRequest.title}</h1>

          <div className="space-y-4">
            <TicketBasicInfoCard changeRequest={changeRequest} />

            {/* 影響範囲カード */}
            {impactScopes && impactScopes.length > 0 && (
              <TicketImpactCard impactScopes={impactScopes} />
            )}

            {/* 影響調査結果（Phase 5） */}
            <TicketInvestigationSection
              changeRequestId={id}
              projectId={projectId}
              initialResult={investigationResult ?? null}
            />

            <TicketDesignDecisionLogCard
              changeRequestId={id}
              initialLogs={designDecisionLogs ?? []}
              targetOptions={targetOptions}
            />

            {/* 受入条件確認パネル - Phase 5.6で実装済み */}
            <AcceptanceConfirmationPanel changeRequestId={id} />
          </div>
        </div>
      </div>
    </>
  );
}
