import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { callOpenAI } from '@/lib/mastra/utils/llm-helpers';
import { getConceptsLookupMap, findSimilarConcepts } from '@/lib/data/concepts';
import { resolveProjectLlmRuntimeSettings } from '@/lib/mastra/utils/llm-settings';

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
    projectId: z.string().describe('プロジェクトID（UUID形式）。必須。'),
    btName: z.string().optional(),
    allowDraft: z.boolean().optional().default(false),
  }),
  outputSchema: z.object({
    brDraft: z.object({
      code: z.string(),
      requirement: z.string(),
      rationale: z.string(),
      business_task_id: z.string(),
      concept_ids: z.array(z.string()).optional(),
    }),
    conceptCandidates: z.array(z.object({
      term: z.string(),
      context: z.string(),
      isExisting: z.boolean(),
      existingDefinition: z.string().optional(),
      suggestion: z.string().optional(),
      matchType: z.enum(['exact', 'similar', 'new']).optional(),
      similarConcept: z.object({
        id: z.string(),
        name: z.string(),
        definition: z.string(),
        similarityScore: z.number(),
      }).optional(),
    })).optional(),
    uncertainties: z.array(z.string()).optional(),
    previewAvailable: z.boolean(),
  }),
  execute: async (inputData) => {
    const { naturalLanguageInput, btId, projectId, btName, allowDraft } = inputData;

    try {
      // 1. BT情報を取得
      console.log('[br_draft] Searching for BT:', { btId });

      const { data: bt } = await supabase
        .from('business_tasks')
        .select('id, name, project_id')
        .eq('id', btId)
        .single();

      const resolvedBt = bt
        ? { id: bt.id, name: bt.name, project_id: bt.project_id }
        : null;

      if (!resolvedBt) {
        console.error('[br_draft] BT not found:', { btId });
        if (!projectId) {
          throw new Error(
            `業務タスクが見つかりません（検索ID: ${btId}）。BT IDが正しいか確認してください。`
          );
        }
        console.log('[br_draft] Using draft BT fallback:', { btId, projectId, btName });
      }

      const btRecord = resolvedBt ?? {
        id: btId,
        name: btName ?? btId,
        project_id: projectId!,
      };

      console.log('[br_draft] BT resolved:', { id: btRecord.id, name: btRecord.name, projectId: btRecord.project_id });
      const llmSettings = await resolveProjectLlmRuntimeSettings(btRecord.project_id);
      const llmOptions = {
        provider: (llmSettings.provider === 'zai' ? 'zai' : 'openai') as 'openai' | 'zai',
        model: llmSettings.model,
        temperature: llmSettings.temperature,
        baseUrl: llmSettings.baseUrl,
        verbosity: llmSettings.verbosity,
      };

      // 1.5. 既存概念マップを取得（概念照合用）
      const conceptMap = await getConceptsLookupMap(btRecord.project_id);
      const existingConceptsArray = Array.from(conceptMap.values());

      // 2. 既存BRを取得（コード採番と重複回避のため）
      const { data: existingBRs } = await supabase
        .from('business_requirements')
        .select('code, requirement')
        .eq('business_task_id', btId)
        .order('code', { ascending: false });

      // 3. 新しいコード採番
      const lastCode = existingBRs?.[0]?.code || `${btRecord.id}-000`;
      const lastNumber = parseInt(lastCode.split('-').pop() || '0', 10);
      const newCode = `${btRecord.id}-${String(lastNumber + 1).padStart(3, '0')}`;

      // 4. LLMで要件と根拠を抽出・生成
      const llmPrompt = `
以下の業務要件説明から、要件文と根拠を抽出・生成してください。

【業務タスク】
${btRecord.id} - ${btRecord.name}

【要件説明】
${naturalLanguageInput}

【出力形式（JSON）】
{
  "requirement": "〜できる（能動態で記述）",
  "rationale": "なぜこの要件が必要か、ビジネス上の理由",
  "concepts": ["概念1", "概念2", "..."]
}

【生成ルール】
- requirementは「〜できる」「〜する」で終わる能動態の文にする
- rationaleはビジネス価値・背景を記述する（「〜のため」で終わる）
- conceptsは要件で使われる重要な概念・用語を抽出
`;

      const llmResponse = await callOpenAI<{
        requirement?: string;
        rationale?: string;
        concepts?: string[];
      }>({
        systemPrompt: 'あなたは要件定義の専門家です。',
        userPrompt: llmPrompt,
        jsonMode: true,
        provider: llmOptions.provider,
        model: llmOptions.model,
        temperature: llmOptions.temperature,
        baseUrl: llmOptions.baseUrl,
        maxTokens: 1200,
        timeoutMs: 180000,
      });

      const llmContent = llmResponse.content;

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

      // 7. 概念候補を抽出し、既存概念と照合
      const rawConcepts = llmContent.concepts || [];
      const conceptCandidates: Array<{
        term: string;
        context: string;
        isExisting: boolean;
        existingDefinition?: string;
        suggestion?: string;
        matchType?: 'exact' | 'similar' | 'new';
        similarConcept?: { id: string; name: string; definition: string; similarityScore: number };
      }> = [];

      for (const term of rawConcepts) {
        const existing = conceptMap.get(term.toLowerCase());
        if (existing) {
          // 完全一致
          conceptCandidates.push({
            term,
            context: `業務要件「${requirement}」で使用`,
            isExisting: true,
            existingDefinition: existing.definition,
            suggestion: `既存概念「${existing.name}」として登録済みです`,
            matchType: 'exact',
          });
        } else {
          // 完全一致がない場合、類似概念を検索
          // 90%以上は除外、70%-89%を提示
          const similarConcepts = await findSimilarConcepts(term, existingConceptsArray, 0.7, 0.9, llmOptions);

          if (similarConcepts.length > 0) {
            // 類似一致（最も類似度が高い概念を採用）
            const topSimilar = similarConcepts[0];
            conceptCandidates.push({
              term,
              context: `業務要件「${requirement}」で使用`,
              isExisting: false,
              suggestion: `類似概念「${topSimilar.name}」が見つかりました（類似度: ${topSimilar.similarityScore}%）`,
              matchType: 'similar',
              similarConcept: topSimilar,
            });
          } else {
            // 新規概念（類似概念がなかった、または90%以上で除外された）
            conceptCandidates.push({
              term,
              context: `業務要件「${requirement}」で使用`,
              isExisting: false,
              suggestion: '概念辞書に登録することを検討してください',
              matchType: 'new',
            });
          }
        }
      }

      // 8. 未確定事項を抽出
      const uncertainties: string[] = [];
      if (!resolvedBt && (allowDraft || projectId)) {
        uncertainties.push('業務タスクが未確定のため、内容は草案として扱われます');
      }
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
