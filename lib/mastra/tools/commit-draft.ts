import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';

/**
 * commit_draft Tool
 *
 * 草案を正本に登録する（確定操作）
 */
export const commitDraftTool = createTool({
  id: 'commit_draft',
  description: '草案を正本に登録する（確定操作）',
  inputSchema: z.object({
    draftId: z.string(),
    type: z.enum(['bt', 'br', 'sf', 'sr', 'ac', 'impl_unit']),
    content: z.any(),
  }),
  execute: async (inputData) => {
    const { draftId, type, content } = inputData;

    try {
      let result: any = null;

      // タイプに応じて正本テーブルに登録
      switch (type) {
        case 'bt': {
          const { data, error } = await supabase
            .from('business_tasks')
            .insert({
              business_domain_id: content.business_domain_id,
              code: content.code,
              name: content.name,
              description: content.description,
              concept_ids: content.concept_ids || [],
            })
            .select()
            .single();

          if (error) throw error;
          result = data;
          break;
        }

        case 'br': {
          const { data, error } = await supabase
            .from('business_requirements')
            .insert({
              business_task_id: content.business_task_id,
              code: content.code,
              requirement: content.requirement,
              rationale: content.rationale,
              concept_ids: content.concept_ids || [],
            })
            .select()
            .single();

          if (error) throw error;
          result = data;
          break;
        }

        case 'sf': {
          const { data, error } = await supabase
            .from('system_functions')
            .insert({
              system_domain_id: content.system_domain_id,
              code: content.code,
              name: content.name,
              description: content.description,
              concept_ids: content.concept_ids || [],
            })
            .select()
            .single();

          if (error) throw error;
          result = data;
          break;
        }

        case 'sr': {
          const { data, error } = await supabase
            .from('system_requirements')
            .insert({
              system_function_id: content.system_function_id,
              code: content.code,
              type: content.type,
              requirement: content.requirement,
              rationale: content.rationale,
              concept_ids: content.concept_ids || [],
            })
            .select()
            .single();

          if (error) throw error;
          result = data;
          break;
        }

        case 'ac': {
          const { data, error } = await supabase
            .from('acceptance_criteria')
            .insert({
              system_requirement_id: content.system_requirement_id,
              code: content.code,
              given: content.given,
              when: content.when,
              then: content.then,
            })
            .select()
            .single();

          if (error) throw error;
          result = data;
          break;
        }

        case 'impl_unit': {
          const { data, error } = await supabase
            .from('impl_unit_sds')
            .insert({
              system_function_id: content.system_function_id,
              code: content.code,
              name: content.name,
              entry_point: content.entry_point,
              design_notes: content.design_notes,
            })
            .select()
            .single();

          if (error) throw error;
          result = data;
          break;
        }

        default:
          throw new Error(`Unknown draft type: ${type}`);
      }

      // TODO: 草案ステータスを'committed'に更新
      // await supabase
      //   .from('drafts')
      //   .update({ status: 'committed' })
      //   .eq('id', draftId);

      return {
        success: true,
        id: result.id,
        type,
        message: `草案を正本に登録しました（${type} ID: ${result.id}）`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: '草案の確定に失敗しました',
      };
    }
  },
});
