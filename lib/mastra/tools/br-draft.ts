import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { getOpenAIApiKey } from '@/lib/config/env';

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

      // 4. LLMで要件と根拠を抽出・生成
      const llmPrompt = `
以下の業務要件説明から、要件文と根拠を抽出・生成してください。

【業務タスク】
${bt.code} - ${bt.name}

【要件説明】
${naturalLanguageInput}

【出力形式（JSON）】
{
  "requirement": "〜できる（能動態で記述）",
  "rationale": "なぜこの要件が必要か、ビジネス上の理由"
}

【生成ルール】
- requirementは「〜できる」「〜する」で終わる能動態の文にする
- rationaleはビジネス価値・背景を記述する（「〜のため」で終わる）
`;

      const openaiApiKey = getOpenAIApiKey();

      const llmResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-5-mini',
          messages: [
            { role: 'system', content: 'あなたは要件定義の専門家です。' },
            { role: 'user', content: llmPrompt },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (!llmResponse.ok) {
        throw new Error(`OpenAI API error: ${llmResponse.statusText}`);
      }

      const llmResult = await llmResponse.json();
      const llmContent = JSON.parse(llmResult.choices[0].message.content);

      const requirement = llmContent.requirement || naturalLanguageInput.trim();
      const rationale = llmContent.rationale || '業務を効率的に実行するため';

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
