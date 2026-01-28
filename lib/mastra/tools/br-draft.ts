import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';

/**
 * br_draft Tool
 *
 * 業務要件（BR）の草案を生成する
 */
export const brDraftTool = createTool({
  id: 'br_draft',
  description: '業務要件（BR）の草案を生成する',
  inputSchema: z.object({
    naturalLanguageInput: z.string(),
    btId: z.string(),
  }),
  outputSchema: z.object({
    brDraft: z.object({
      code: z.string(),
      requirement: z.string(),
      rationale: z.string(),
      business_task_id: z.string(),
      concept_ids: z.array(z.string()).optional(),
    }),
    conceptCandidates: z.array(z.string()).optional(),
    uncertainties: z.array(z.string()).optional(),
    previewAvailable: z.boolean(),
  }),
  execute: async (inputData) => {
    const { naturalLanguageInput, btId } = inputData;

    try {
      // 1. BT情報を取得
      const { data: bt } = await supabase
        .from('business_tasks')
        .select('code, name')
        .eq('id', btId)
        .single();

      if (!bt) {
        throw new Error('業務タスクが見つかりません');
      }

      // 2. 既存BRを取得（コード採番と重複回避のため）
      const { data: existingBRs } = await supabase
        .from('business_requirements')
        .select('code, requirement')
        .eq('business_task_id', btId)
        .order('code', { ascending: false });

      // 3. 新しいコード採番
      const lastCode = existingBRs?.[0]?.code || `${bt.code}-000`;
      const lastNumber = parseInt(lastCode.split('-').pop() || '0', 10);
      const newCode = `${bt.code}-${String(lastNumber + 1).padStart(3, '0')}`;

      // 4. 自然言語から要件と根拠を抽出（簡易版）
      // TODO: 実際にはLLMを使って整形する
      const requirement = naturalLanguageInput.trim();
      const rationale = '業務を効率的に実行するため'; // デフォルト

      // 5. 重複チェック（既存BRとの類似度確認）
      const isDuplicate = existingBRs?.some(
        (br) =>
          br.requirement.toLowerCase().includes(requirement.toLowerCase()) ||
          requirement.toLowerCase().includes(br.requirement.toLowerCase())
      );

      if (isDuplicate) {
        throw new Error(
          '類似する業務要件が既に存在します。既存要件を確認してください。'
        );
      }

      // 6. BR草案を生成
      const brDraft = {
        code: newCode,
        requirement,
        rationale,
        business_task_id: btId,
        concept_ids: [],
      };

      // 7. 概念候補を抽出（簡易版）
      // TODO: 実際にはLLMで概念抽出
      const conceptCandidates: string[] = [];

      // 8. 未確定事項を抽出
      const uncertainties: string[] = [];
      if (requirement.length < 10) {
        uncertainties.push('要件が簡潔すぎる可能性があります');
      }
      if (!requirement.includes('できる') && !requirement.includes('する')) {
        uncertainties.push('要件が動詞で終わっていません');
      }

      return {
        brDraft,
        conceptCandidates,
        uncertainties,
        previewAvailable: true,
      };
    } catch (error: any) {
      throw new Error(`BR草案生成に失敗: ${error.message}`);
    }
  },
});
