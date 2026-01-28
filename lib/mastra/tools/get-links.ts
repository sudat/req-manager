import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';

/**
 * get_links Tool
 *
 * 要件間リンクを取得する
 */
export const getLinksTool = createTool({
  id: 'get_links',
  description: '要件間のリンク（関係性）を取得する',
  inputSchema: z.object({
    requirementId: z.string(),
    direction: z.enum(['from', 'to', 'both']).optional().default('both'),
  }),
  execute: async (inputData) => {
    const { requirementId, direction } = inputData;

    try {
      const links: any[] = [];

      // 発信元としてのリンク（この要件から他への参照）
      if (direction === 'from' || direction === 'both') {
        const { data: fromLinks } = await supabase
          .from('requirement_links')
          .select('*')
          .eq('source_id', requirementId);

        if (fromLinks) {
          links.push(
            ...fromLinks.map((link) => ({
              ...link,
              direction: 'from',
            }))
          );
        }
      }

      // 受信先としてのリンク（他からこの要件への参照）
      if (direction === 'to' || direction === 'both') {
        const { data: toLinks } = await supabase
          .from('requirement_links')
          .select('*')
          .eq('target_id', requirementId);

        if (toLinks) {
          links.push(
            ...toLinks.map((link) => ({
              ...link,
              direction: 'to',
            }))
          );
        }
      }

      // リンクタイプごとに集計
      const linksByType = links.reduce((acc: any, link) => {
        const type = link.link_type;
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(link);
        return acc;
      }, {});

      return {
        success: true,
        links,
        count: links.length,
        linksByType,
        message: `${links.length}件のリンクが見つかりました`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'リンク取得に失敗しました',
      };
    }
  },
});
