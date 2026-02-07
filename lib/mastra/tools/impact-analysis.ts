import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { toolSuccess, toolError } from '@/lib/mastra/utils/tool-helpers';
import { listImpactScopesByChangeRequestId } from '@/lib/data/impact-scopes';
import { listSfIdsByBrId, listSuspectLinks } from '@/lib/data/requirement-links';
import { listBusinessRequirementsByIds } from '@/lib/data/business-requirements';
import { listSystemFunctions } from '@/lib/data/system-functions';
import { listSystemRequirementsByIds } from '@/lib/data/system-requirements';
import { listDesignDocumentsBySrfId } from '@/lib/data/design-documents';
import { listAcceptanceCriteriaBySystemRequirementIds } from '@/lib/data/acceptance-criteria';
import { createInvestigationResult } from '@/lib/data/investigation-results';

/**
 * impact_analysis Tool
 *
 * 変更要求（CR）のトップダウン影響分析を実行する。
 * 影響対象のBR → SF → SR → AC / DD(entry_points) を辿り、
 * 疑義リンクも検出して investigation_results に保存する。
 */
export const impactAnalysisTool = createTool({
  id: 'impact_analysis',
  description: `変更要求（CR）のトップダウン影響分析を実行する。
影響範囲（impact_scopes）から対象のBRを取得し、BR → SF → SR → AC と辿り、
エントリポイント・疑義リンクも収集する。結果は investigation_results に保存される。`,
  inputSchema: z.object({
    crId: z.string().describe('変更要求ID（UUID形式）'),
    projectId: z.string().describe('プロジェクトID（UUID形式）'),
  }),
  execute: async ({ crId, projectId }) => {
    try {
      // 1. 影響対象を取得
      const { data: impactScopes, error: scopeError } = await listImpactScopesByChangeRequestId(crId);
      if (scopeError) return toolError(scopeError, '影響範囲の取得に失敗しました');

      // 影響対象からBR IDを収集
      const brIds = (impactScopes ?? [])
        .filter((s) => s.targetType === 'business_requirement')
        .map((s) => s.targetId);

      // 2. BR → SF via realizes リンク
      const affectedSFIds = new Set<string>();
      for (const brId of brIds) {
        const sfIds = await listSfIdsByBrId(brId, projectId);
        sfIds.forEach((id) => affectedSFIds.add(id));
      }

      // 3. SF → SR (requirementIds) + DD (entry_points)
      const affectedSRIds = new Set<string>();
      const affectedEntryPoints: Array<{ sfId: string; path: string }> = [];

      if (affectedSFIds.size > 0) {
        const { data: allSFs } = await listSystemFunctions(projectId);
        const sfMap = new Map((allSFs ?? []).map((sf) => [sf.id, sf]));

        for (const sfId of affectedSFIds) {
          const sf = sfMap.get(sfId);
          if (!sf) continue;

          // SR収集
          (sf.requirementIds ?? []).forEach((srId) => affectedSRIds.add(srId));

          // DD entry_points収集
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

      // 5. 疑義リンク検出（全件取得して対象要件と交差チェック）
      const allSuspectLinks = await listSuspectLinks(projectId);
      const targetRequirementIds = new Set<string>([
        ...brIds,
        ...affectedSFIds,
        ...affectedSRIds,
        ...affectedACIds,
      ]);

      const suspectLinksDetected = allSuspectLinks
        .filter(
          (link) =>
            targetRequirementIds.has(link.sourceId) ||
            targetRequirementIds.has(link.targetId)
        )
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
        status: 'completed',
        topDownResult,
        suspectLinksDetected,
      });

      if (saveError) return toolError(saveError, '調査結果の保存に失敗しました');

      return toolSuccess('影響分析完了', {
        investigationId: saved?.id,
        affectedBRs: topDownResult.affectedBRs,
        affectedSFs: topDownResult.affectedSFs,
        affectedSRs: topDownResult.affectedSRs,
        affectedACs: topDownResult.affectedACs,
        affectedEntryPoints: topDownResult.affectedEntryPoints,
        suspectLinks: suspectLinksDetected,
      });
    } catch (error: any) {
      return toolError(error, '影響分析に失敗しました');
    }
  },
});
