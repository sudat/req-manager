import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { listImpactScopesByChangeRequestId } from "@/lib/data/impact-scopes";
import { listSfIdsByBrId, listSuspectLinks } from "@/lib/data/requirement-links";
import { listSystemFunctions } from "@/lib/data/system-functions";
import { listDesignDocumentsBySrfId } from "@/lib/data/design-documents";
import { listAcceptanceCriteriaBySystemRequirementIds } from "@/lib/data/acceptance-criteria";
import { createInvestigationResult } from "@/lib/data/investigation-results";
import { updateChangeRequestStatus } from "@/lib/data/change-requests";

const DEFAULT_PROJECT_ID = "00000000-0000-0000-0000-000000000001";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: crId } = await params;
    const cookieStore = await cookies();
    const projectId = cookieStore.get("current-project-id")?.value ?? DEFAULT_PROJECT_ID;

    // 1. 影響対象を取得
    const { data: impactScopes, error: scopeError } = await listImpactScopesByChangeRequestId(crId);
    if (scopeError) {
      return NextResponse.json({ error: "影響範囲の取得に失敗しました" }, { status: 500 });
    }

    // BR IDを収集
    const brIds = (impactScopes ?? [])
      .filter((s) => s.targetType === "business_requirement")
      .map((s) => s.targetId);

    // 2. BR → SF via realizes リンク
    const affectedSFIds = new Set<string>();
    for (const brId of brIds) {
      const sfIds = await listSfIdsByBrId(brId, projectId);
      sfIds.forEach((id) => affectedSFIds.add(id));
    }

    // 3. SF → SR + DD entry_points
    const affectedSRIds = new Set<string>();
    const affectedEntryPoints: Array<{ sfId: string; path: string }> = [];

    if (affectedSFIds.size > 0) {
      const { data: allSFs } = await listSystemFunctions(projectId);
      const sfMap = new Map((allSFs ?? []).map((sf) => [sf.id, sf]));

      for (const sfId of affectedSFIds) {
        const sf = sfMap.get(sfId);
        if (!sf) continue;
        (sf.requirementIds ?? []).forEach((srId) => affectedSRIds.add(srId));

        const { data: dds } = await listDesignDocumentsBySrfId(sfId, projectId);
        for (const dd of dds ?? []) {
          for (const ep of dd.entryPoints ?? []) {
            affectedEntryPoints.push({ sfId, path: ep.path });
          }
        }
      }
    }

    // 4. SR → AC
    const affectedACIds: string[] = [];
    if (affectedSRIds.size > 0) {
      const { data: acs } = await listAcceptanceCriteriaBySystemRequirementIds(
        Array.from(affectedSRIds),
        projectId
      );
      (acs ?? []).forEach((ac) => affectedACIds.push(ac.id));
    }

    // 5. 疑義リンク検出
    const allSuspectLinks = await listSuspectLinks(projectId);
    const targetIds = new Set<string>([...brIds, ...affectedSFIds, ...affectedSRIds, ...affectedACIds]);
    const suspectLinksDetected = allSuspectLinks
      .filter((link) => targetIds.has(link.sourceId) || targetIds.has(link.targetId))
      .map((link) => ({
        id: link.id,
        sourceType: link.sourceType,
        sourceId: link.sourceId,
        targetType: link.targetType,
        targetId: link.targetId,
        linkType: link.linkType,
        suspectReason: link.suspectReason,
      }));

    // 6. investigation_results に保存
    const topDownResult = {
      affectedBRs: brIds,
      affectedSFs: Array.from(affectedSFIds),
      affectedSRs: Array.from(affectedSRIds),
      affectedACs: affectedACIds,
      affectedEntryPoints,
    };

    const { data: saved, error: saveError } = await createInvestigationResult({
      changeRequestId: crId,
      projectId,
      status: "completed",
      topDownResult,
      suspectLinksDetected,
    });

    if (saveError) {
      return NextResponse.json({ error: "調査結果の保存に失敗しました" }, { status: 500 });
    }

    // 7. CRのstatusを'review'に更新
    await updateChangeRequestStatus(crId, "review", projectId);

    return NextResponse.json({
      success: true,
      investigationId: saved?.id,
      topDownResult,
      suspectLinksDetected,
    });
  } catch (error) {
    console.error("Investigation error:", error);
    return NextResponse.json({ error: "影響調査に失敗しました" }, { status: 500 });
  }
}
