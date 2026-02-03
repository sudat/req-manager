import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { toolSuccess, toolError } from '@/lib/mastra/utils/tool-helpers';

/**
 * list_business_domains Tool
 *
 * プロジェクトに紐づく業務領域（BD）を全件取得する
 */
export const listBusinessDomainsTool = createTool({
  id: 'list_business_domains',
  description: `業務領域（BD）をプロジェクト内で全件取得する。

使用方法:
- 業務タスク登録の開始時に、候補一覧を取得して提示する
- 結果の area / name を候補提示に使う

注意:
- projectId で必ず絞り込む`,
  inputSchema: z.object({
    projectId: z.string().describe('プロジェクトID'),
  }),
  execute: async (inputData) => {
    const { projectId } = inputData;

    console.log('[listBusinessDomains] Called:', { projectId });

    try {
      const { data: bds, error } = await supabase
        .from('business_domains')
        .select('area, name')
        .eq('project_id', projectId)
        .order('area');

      if (error) {
        console.error('[listBusinessDomains] DB Error:', error);
        throw error;
      }

      console.log('[listBusinessDomains] Result:', { count: bds?.length });

      if (!bds || bds.length === 0) {
        return toolSuccess(
          `業務領域が登録されていません。projectId: ${projectId}`,
          { results: [], count: 0 }
        );
      }

      return toolSuccess(
        `${bds.length}件の業務領域が見つかりました: ${bds
          .map((bd) => `${bd.area}: ${bd.name}`)
          .join(', ')}`,
        { results: bds, count: bds.length }
      );
    } catch (error: any) {
      console.error('[listBusinessDomains] Exception:', error);
      return toolError(error, '業務領域一覧の取得に失敗しました');
    }
  },
});
