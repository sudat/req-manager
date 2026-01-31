import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { escapeLikePattern, buildOrLikeConditions } from '@/lib/mastra/utils/sql-helpers';
import { toolSuccess, toolError } from '@/lib/mastra/utils/tool-helpers';

/**
 * search_business_domains Tool
 *
 * 業務領域（BD）を検索する
 */
export const searchBusinessDomainsTool = createTool({
  id: 'search_business_domains',
  description: `業務領域（BD）を検索する。

使用方法:
- ユーザーが「GL」「一般会計」などと言った場合、このToolで検索する
- code、name、areaのいずれかで部分一致検索が可能
- プロジェクトIDで絞り込みが可能

注意:
- 「GL」はareaフィールドで検索するとマッチする
- 「一般会計」はnameフィールドで検索するとマッチする`,
  inputSchema: z.object({
    projectId: z.string().describe('プロジェクトID'),
    query: z.string().describe('検索キーワード（codeまたはname）'),
  }),
  execute: async (inputData) => {
    const { projectId, query } = inputData;

    console.log('[searchBusinessDomains] Called:', { projectId, query });

    try {
      // SQL Injection対策: ユーザー入力をエスケープ
      const orCondition = buildOrLikeConditions(query, ['id', 'name', 'area']);

      // 検索条件: idが前方一致、またはname/areaが部分一致
      const { data: bds, error } = await supabase
        .from('business_domains')
        .select('id, name, area')
        .eq('project_id', projectId)
        .or(orCondition)
        .limit(10);

      if (error) {
        console.error('[searchBusinessDomains] DB Error:', error);
        throw error;
      }

      console.log('[searchBusinessDomains] Result:', { count: bds?.length, bds });

      if (!bds || bds.length === 0) {
        return toolSuccess(
          `業務領域「${query}」が見つかりませんでした。検索対象: code, name, area。projectId: ${projectId}`,
          { results: [], count: 0 }
        );
      }

      return toolSuccess(
        `${bds.length}件の業務領域が見つかりました: ${bds.map(bd => `${bd.id}: ${bd.name}`).join(', ')}`,
        { results: bds, count: bds.length }
      );
    } catch (error: any) {
      console.error('[searchBusinessDomains] Exception:', error);
      return toolError(error, '業務領域の検索に失敗しました');
    }
  },
});
