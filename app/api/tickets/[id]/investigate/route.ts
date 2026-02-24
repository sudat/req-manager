import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { listImpactScopesByChangeRequestId } from "@/lib/data/impact-scopes";
import { listSfIdsByBrId, listSuspectLinks } from "@/lib/data/requirement-links";
import { listSystemFunctions } from "@/lib/data/system-functions";
import { listDesignDocumentsBySrfId } from "@/lib/data/design-documents";
import { listAcceptanceCriteriaBySystemRequirementIds } from "@/lib/data/acceptance-criteria";
import { createInvestigationResult } from "@/lib/data/investigation-results";
import { updateChangeRequestStatus } from "@/lib/data/change-requests";
import { createDesignDecisionLogs, type DesignDecisionLogInput } from "@/lib/data/design-decision-logs";
import { getProjectById } from "@/lib/data/projects";
import { getProjectInvestigationSettings } from "@/lib/data/project-settings";
import { analyzeRepositoryBottomUpImpact } from "@/lib/analysis/dependency-analysis";
import { CURRENT_PROJECT_ID_KEY, DEFAULT_PROJECT_ID } from "@/lib/constants/project";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: crId } = await params;
    const cookieStore = await cookies();
    const projectId = cookieStore.get(CURRENT_PROJECT_ID_KEY)?.value ?? DEFAULT_PROJECT_ID;

    // 1. 影響対象を取得
    const { data: impactScopes, error: scopeError } = await listImpactScopesByChangeRequestId(crId, projectId);
    if (scopeError) {
      return NextResponse.json({ error: "影響範囲の取得に失敗しました" }, { status: 500 });
    }

    // BR IDを収集
    const brIds = (impactScopes ?? [])
      .filter((s) => s.targetType === "business_requirement")
      .map((s) => s.targetId);

    // 2. BR → SF via realizes リンク
    const affectedSFIds = new Set<string>();
    const sfToBrIds = new Map<string, Set<string>>();
    for (const brId of brIds) {
      const sfIds = await listSfIdsByBrId(brId, projectId);
      sfIds.forEach((id) => {
        affectedSFIds.add(id);
        if (!sfToBrIds.has(id)) sfToBrIds.set(id, new Set<string>());
        sfToBrIds.get(id)?.add(brId);
      });
    }

    // 3. SF → SR + DD entry_points
    const affectedSRIds = new Set<string>();
    const srToSfIds = new Map<string, Set<string>>();
    const affectedEntryPoints: Array<{ sfId: string; path: string }> = [];

    if (affectedSFIds.size > 0) {
      const { data: allSFs } = await listSystemFunctions(projectId);
      const sfMap = new Map((allSFs ?? []).map((sf) => [sf.id, sf]));

      for (const sfId of affectedSFIds) {
        const sf = sfMap.get(sfId);
        if (!sf) continue;
        (sf.requirementIds ?? []).forEach((srId) => {
          affectedSRIds.add(srId);
          if (!srToSfIds.has(srId)) srToSfIds.set(srId, new Set<string>());
          srToSfIds.get(srId)?.add(sfId);
        });

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
    const acToSrIds = new Map<string, Set<string>>();
    if (affectedSRIds.size > 0) {
      const { data: acs } = await listAcceptanceCriteriaBySystemRequirementIds(
        Array.from(affectedSRIds),
        projectId
      );
      (acs ?? []).forEach((ac) => {
        affectedACIds.push(ac.id);
        if (!acToSrIds.has(ac.id)) acToSrIds.set(ac.id, new Set<string>());
        acToSrIds.get(ac.id)?.add(ac.systemRequirementId);
      });
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

    // 6.5 ボトムアップ（コード依存）解析を実行（MVP: public repoのみ）
    const entryPointPaths = Array.from(new Set(affectedEntryPoints.map((ep) => ep.path)));
    const [projectResult, settingsResult] = await Promise.all([
      getProjectById(projectId),
      getProjectInvestigationSettings(projectId),
    ]);
    const bottomUpResult = await analyzeRepositoryBottomUpImpact({
      repositoryUrl: projectResult.data?.githubUrl ?? null,
      entryPoints: entryPointPaths,
      settings: settingsResult.data ?? {
        exploration: { default_max_depth: 5, default_include_patterns: [], default_exclude_patterns: [] },
        allow_paths_rule: {
          base_rule: { include_direct_impacts: true, include_indirect_impacts: true, confidence_threshold: 0.3, max_depth: 5 },
          shared_module_rule: { auto_include: true, notify_on_include: true, require_confirmation_if_count_exceeds: 10 },
          safety_limits: { max_total_files: 50, max_directories: 10, escalate_if_exceeds: true },
        },
        impact_review: { auto_trigger_threshold: 50, default_aggressiveness: "moderate", require_human_confirmation: true },
        shared_module_patterns: [],
      },
    });

    const { data: saved, error: saveError } = await createInvestigationResult({
      changeRequestId: crId,
      projectId,
      status: "completed",
      topDownResult,
      bottomUpResult,
      suspectLinksDetected,
    });

    if (saveError) {
      return NextResponse.json({ error: "調査結果の保存に失敗しました" }, { status: 500 });
    }

    // 7. 設計決定ログ（agent）を自動投入（失敗しても本処理は継続）
    const decisionLogs: DesignDecisionLogInput[] = [];

    brIds.forEach((brId) => {
      decisionLogs.push({
        changeRequestId: crId,
        createdBy: "agent",
        contextTargetType: "br",
        contextTargetId: brId,
        contextField: "impact_investigation",
        decision: `BR ${brId} を影響対象に採用`,
        rationaleType: "user_input",
        rationaleExplanation: "変更要求の影響範囲として明示的に選択されていたため。",
        status: "proposed",
      });
    });

    Array.from(affectedSFIds).forEach((sfId) => {
      const fromBrs = Array.from(sfToBrIds.get(sfId) ?? []);
      decisionLogs.push({
        changeRequestId: crId,
        createdBy: "agent",
        contextTargetType: "sf",
        contextTargetId: sfId,
        contextField: "impact_investigation",
        decision: `SF ${sfId} を影響対象に採用`,
        rationaleType: "inference",
        rationaleExplanation: fromBrs.length > 0
          ? `BR ${fromBrs.join(", ")} から realizes リンクで到達したため。`
          : "BRからのトレーサビリティにより影響候補と判断したため。",
        status: "proposed",
      });
    });

    Array.from(affectedSRIds).forEach((srId) => {
      const fromSfs = Array.from(srToSfIds.get(srId) ?? []);
      decisionLogs.push({
        changeRequestId: crId,
        createdBy: "agent",
        contextTargetType: "sr",
        contextTargetId: srId,
        contextField: "impact_investigation",
        decision: `SR ${srId} を影響対象に採用`,
        rationaleType: "inference",
        rationaleExplanation: fromSfs.length > 0
          ? `SF ${fromSfs.join(", ")} の requirementIds に含まれていたため。`
          : "SFとの依存関係から影響候補と判断したため。",
        status: "proposed",
      });
    });

    affectedACIds.forEach((acId) => {
      const fromSrs = Array.from(acToSrIds.get(acId) ?? []);
      decisionLogs.push({
        changeRequestId: crId,
        createdBy: "agent",
        contextTargetType: "ac",
        contextTargetId: acId,
        contextField: "impact_investigation",
        decision: `AC ${acId} を影響対象に採用`,
        rationaleType: "inference",
        rationaleExplanation: fromSrs.length > 0
          ? `SR ${fromSrs.join(", ")} に紐づく受入条件として抽出されたため。`
          : "SR配下の受入条件として影響候補に含めたため。",
        status: "proposed",
      });
    });

    const { error: decisionLogError } = await createDesignDecisionLogs(decisionLogs);
    if (decisionLogError) {
      console.warn("Failed to persist design decision logs:", decisionLogError);
    }

    // 8. CRのstatusを'review'に更新
    await updateChangeRequestStatus(crId, "review", projectId);

    return NextResponse.json({
      success: true,
      investigationId: saved?.id,
      topDownResult,
      bottomUpResult,
      suspectLinksDetected,
    });
  } catch (error) {
    console.error("Investigation error:", error);
    return NextResponse.json({ error: "影響調査に失敗しました" }, { status: 500 });
  }
}
