import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { escapeLikePattern, buildOrLikeConditions } from '@/lib/mastra/utils/sql-helpers';

/**
 * search_requirements Tool
 *
 * 既存要件を検索する
 */
export const searchRequirementsTool = createTool({
  id: 'search_requirements',
  description: '既存要件を検索する（キーワード検索）',
  inputSchema: z.object({
    projectId: z.string(),
    query: z.string(),
    types: z.array(z.enum(['bt', 'br', 'sf', 'sr'])).optional(),
  }),
  execute: async (inputData) => {
    const { projectId, query, types } = inputData;

    try {
      const results: any[] = [];

      const searchTypes = types || ['bt', 'br', 'sf', 'sr'];

      // SQL Injection対策: ユーザー入力をエスケープ
      const escapedQuery = escapeLikePattern(query);

      // BT検索
      if (searchTypes.includes('bt')) {
        const { data } = await supabase
          .from('business_tasks')
          .select('id, code, name, description, business_domain_id')
          .eq('business_domain_id', projectId) // TODO: project_idで絞る
          .or(`name.ilike.%${escapedQuery}%,description.ilike.%${escapedQuery}%`)
          .limit(10);

        if (data) {
          results.push(
            ...data.map((item) => ({ resultType: 'bt', ...item }))
          );
        }
      }

      // BR検索
      if (searchTypes.includes('br')) {
        const { data } = await supabase
          .from('business_requirements')
          .select('id, code, requirement, rationale, business_task_id')
          .or(`requirement.ilike.%${escapedQuery}%,rationale.ilike.%${escapedQuery}%`)
          .limit(10);

        if (data) {
          results.push(
            ...data.map((item) => ({ resultType: 'br', ...item }))
          );
        }
      }

      // SF検索
      if (searchTypes.includes('sf')) {
        const { data } = await supabase
          .from('system_functions')
          .select('id, code, name, description, system_domain_id')
          .or(`name.ilike.%${escapedQuery}%,description.ilike.%${escapedQuery}%`)
          .limit(10);

        if (data) {
          results.push(
            ...data.map((item) => ({ resultType: 'sf', ...item }))
          );
        }
      }

      // SR検索
      if (searchTypes.includes('sr')) {
        const { data } = await supabase
          .from('system_requirements')
          .select('id, code, type, requirement, rationale, system_function_id')
          .or(`requirement.ilike.%${escapedQuery}%,rationale.ilike.%${escapedQuery}%`)
          .limit(10);

        if (data) {
          results.push(
            ...data.map((item) => ({
              resultType: 'sr',
              ...item
            }))
          );
        }
      }

      return {
        success: true,
        results,
        count: results.length,
        message: `${results.length}件の要件が見つかりました`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: '要件検索に失敗しました',
      };
    }
  },
});
