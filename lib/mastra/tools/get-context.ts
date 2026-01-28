import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { ContextProvider } from '../context';
import type { UILocation } from '../context/types';

/**
 * get_context Tool
 *
 * コンテキスト情報を取得する
 */
export const getContextTool = createTool({
  id: 'get_context',
  description: '現在のコンテキスト情報（PR、位置、既存要件、概念辞書）を取得する',
  inputSchema: z.object({
    locationType: z.enum(['bd', 'bt', 'br', 'sd', 'sf', 'sr', 'cr', 'project']),
    locationId: z.string(),
    locationName: z.string(),
    projectId: z.string(),
    breadcrumb: z.array(z.string()).optional(),
  }),
  execute: async (inputData) => {
    const { locationType, locationId, locationName, projectId, breadcrumb } =
      inputData;

    try {
      const location: UILocation = {
        type: locationType,
        id: locationId,
        name: locationName,
        projectId,
        breadcrumb: breadcrumb || [],
      };

      // Context Providerでコンテキストを構築
      const agentContext = await ContextProvider.buildContext(location);

      return {
        success: true,
        context: agentContext,
        message: 'コンテキスト情報を取得しました',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'コンテキスト取得に失敗しました',
      };
    }
  },
});
