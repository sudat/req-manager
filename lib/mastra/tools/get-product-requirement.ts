import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getProductRequirementByProjectId } from '@/lib/data/product-requirements';
import { toolSuccess, toolError } from '@/lib/mastra/utils/tool-helpers';

/**
 * get_product_requirement Tool
 *
 * プロダクト要件（PR）を取得する
 */
export const getProductRequirementTool = createTool({
  id: 'get_product_requirement',
  description: `プロダクト要件（PR）を取得する。
プロジェクトのターゲットユーザー、技術スタック、コーディング規約などの情報を返す。
要件生成や設計時に参照するために使用する。`,
  inputSchema: z.object({
    projectId: z.string().describe('プロジェクトID（UUID形式）'),
  }),
  execute: async ({ projectId }) => {
    try {
      const result = await getProductRequirementByProjectId(projectId);
      if (result.error) {
        return toolError(result.error, 'プロダクト要件の取得に失敗しました');
      }
      if (!result.data) {
        return toolError('プロダクト要件が見つかりません', 'プロダクト要件が未設定です');
      }

      const pr = result.data;
      return toolSuccess('プロダクト要件を取得しました', {
        id: pr.id,
        targetUsers: pr.targetUsers,
        experienceGoals: pr.experienceGoals,
        qualityGoals: pr.qualityGoals,
        designSystem: pr.designSystem,
        uxGuidelines: pr.uxGuidelines,
        techStackProfile: pr.techStackProfile,
        codingConventions: pr.codingConventions,
        forbiddenChoices: pr.forbiddenChoices,
      });
    } catch (error: any) {
      return toolError(error, 'プロダクト要件の取得に失敗しました');
    }
  },
});
