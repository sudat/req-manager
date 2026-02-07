import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { buildOrLikeConditions } from '@/lib/mastra/utils/sql-helpers';
import { toolSuccess, toolError } from '@/lib/mastra/utils/tool-helpers';
import { callSearchRequirementsMcp } from '@/lib/mcp/search-client';

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
    types: z.array(z.enum(['bt', 'br', 'sf', 'sr', 'dd'])).optional(),
  }),
  execute: async (inputData) => {
    const { projectId, query, types } = inputData;

    const extractRequirementId = (text: string): string | null => {
      const match = text.match(/\b(BT|BR|SF|SR)-[A-Z0-9_]+-\d{4}(?:-\d{3,4})?\b/i);
      return match ? match[0].toUpperCase() : null;
    };

    const filterResultsForId = (
      results: Array<Record<string, unknown>>,
      id: string
    ) => {
      const prefix = id.split('-')[0]?.toLowerCase();
      const typeMap: Record<string, string> = {
        bt: 'bt',
        br: 'br',
        sf: 'sf',
        sr: 'sr',
      };
      const expectedType = prefix ? typeMap[prefix] : undefined;
      if (!expectedType) return results;

      const exact = results.filter((item) => {
        const resultType = item.resultType as string | undefined;
        const itemId = (item.id ?? item.code) as string | undefined;
        return resultType === expectedType && itemId === id;
      });
      if (exact.length > 0) return exact;

      const startsWith = results.filter((item) => {
        const resultType = item.resultType as string | undefined;
        const itemId = (item.id ?? item.code) as string | undefined;
        return resultType === expectedType && typeof itemId === 'string' && itemId.startsWith(id);
      });
      if (startsWith.length > 0) return startsWith;

      return results;
    };

    const idCandidate = extractRequirementId(query);
    const normalizedQuery = idCandidate ?? query;

    // MCP側は bt/br/sf/sr のみ受け付け → dd は除外
    const mcpTypes = types?.filter((t): t is 'bt' | 'br' | 'sf' | 'sr' => t !== 'dd');

    try {
      const mcpResult = await callSearchRequirementsMcp({
        projectId,
        query: normalizedQuery,
        types: mcpTypes,
      });

      const filteredResults = idCandidate
        ? filterResultsForId(mcpResult.results, idCandidate)
        : mcpResult.results;

      return toolSuccess(`${filteredResults.length}件の要件が見つかりました`, {
        results: filteredResults,
        count: filteredResults.length,
      });
    } catch (error) {
      console.warn('[searchRequirements] MCP fallback:', error);
    }

    try {
      const results: any[] = [];

      const searchTypes = types || ['bt', 'br', 'sf', 'sr', 'dd'];

      const btOr = buildOrLikeConditions(normalizedQuery, ['id', 'name', 'summary']);
      const brOr = buildOrLikeConditions(normalizedQuery, ['id', 'task_id', 'title', 'goal']);
      const sfOr = buildOrLikeConditions(normalizedQuery, ['id', 'title', 'summary']);
      const srOr = buildOrLikeConditions(normalizedQuery, ['id', 'title', 'summary']);

      // BT検索
      if (searchTypes.includes('bt')) {
        const { data } = await supabase
          .from('business_tasks')
          .select('id, name, summary, business_area, project_id')
          .eq('project_id', projectId)
          .or(btOr)
          .limit(10);

        if (data) {
          results.push(
            ...data.map((item) => ({
              resultType: 'bt',
              id: item.id,
              name: item.name,
              description: (item as any).summary ?? "",
              business_area: (item as any).business_area,
            }))
          );
        }
      }

      // BR検索
      if (searchTypes.includes('br')) {
        const { data } = await supabase
          .from('business_requirements')
          .select('id, title, goal, task_id')
          .eq('project_id', projectId)
          .or(brOr)
          .limit(10);

        if (data) {
          results.push(
            ...data.map((item: any) => ({
              resultType: 'br',
              id: item.id,
              code: item.id,
              requirement: item.title ?? '',
              rationale: item.goal ?? '',
              business_task_id: item.task_id,
              task_id: item.task_id,
            }))
          );
        }
      }

      // SF検索
      if (searchTypes.includes('sf')) {
        const { data } = await supabase
          .from('system_functions')
          .select('id, title, summary, system_domain_id')
          .eq('project_id', projectId)
          .or(sfOr)
          .limit(10);

        if (data) {
          results.push(
            ...data.map((item: any) => ({
              resultType: 'sf',
              id: item.id,
              code: item.id,
              name: item.title ?? '',
              description: item.summary ?? '',
              system_domain_id: item.system_domain_id,
            }))
          );
        }
      }

      // SR検索
      if (searchTypes.includes('sr')) {
        const { data } = await supabase
          .from('system_requirements')
          .select('id, title, summary, category, srf_ids')
          .eq('project_id', projectId)
          .or(srOr)
          .limit(10);

        if (data) {
          results.push(
            ...data.map((item: any) => ({
              resultType: 'sr',
              id: item.id,
              code: item.id,
              type: item.category ?? 'function',
              title: item.title ?? '',
              summary: item.summary ?? '',
              requirement: item.summary ?? '',
              rationale: '',
              srf_ids: item.srf_ids ?? [],
              system_function_id: Array.isArray(item.srf_ids) ? item.srf_ids[0] : undefined,
            }))
          );
        }
      }

      // DD検索
      if (searchTypes.includes('dd')) {
        const ddOr = buildOrLikeConditions(normalizedQuery, ['id', 'name', 'summary']);
        const { data } = await supabase
          .from('design_documents')
          .select('id, name, type, summary, srf_id')
          .eq('project_id', projectId)
          .or(ddOr)
          .limit(10);

        if (data) {
          results.push(
            ...data.map((item: any) => ({
              resultType: 'dd',
              id: item.id,
              code: item.id,
              name: item.name ?? '',
              type: item.type ?? 'screen',
              description: item.summary ?? '',
              srf_id: item.srf_id,
            }))
          );
        }
      }

      const filteredResults = idCandidate
        ? filterResultsForId(results as Array<Record<string, unknown>>, idCandidate)
        : results;

      return toolSuccess(`${filteredResults.length}件の要件が見つかりました`, {
        results: filteredResults,
        count: filteredResults.length,
      });
    } catch (error: any) {
      return toolError(error, '要件検索に失敗しました');
    }
  },
});
