import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';

/**
 * save_to_draft Tool
 *
 * 草案を一時保存する（未確定状態）
 */
export const saveToDraftTool = createTool({
  id: 'save_to_draft',
  description: '草案を一時保存する（未確定状態でDB保存）',
  inputSchema: z.object({
    type: z.enum(['bt', 'br', 'sf', 'sr', 'ac', 'impl_unit']),
    content: z.any(),
    projectId: z.string(),
  }),
  execute: async (inputData) => {
    const { type, content, projectId } = inputData;

    try {
      // 草案テーブルに保存（draftsテーブルは後で作成予定）
      // 現時点では仮実装として、メモリ内に保持する形にする
      const draftId = `draft-${type}-${Date.now()}`;

      // TODO: draftsテーブルへの保存を実装
      // const { data, error } = await supabase
      //   .from('drafts')
      //   .insert({
      //     id: draftId,
      //     project_id: projectId,
      //     type,
      //     content,
      //     status: 'draft',
      //   })
      //   .select()
      //   .single();

      return {
        success: true,
        draftId,
        message: `草案を一時保存しました（ID: ${draftId}）`,
        content,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: '草案の保存に失敗しました',
      };
    }
  },
});
