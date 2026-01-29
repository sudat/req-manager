import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { buildOrLikeConditions } from '@/lib/mastra/utils/sql-helpers';
import { getNextBtId, normalizeAreaCode } from '@/lib/utils/id-rules';
import { getOpenAIApiKey } from '@/lib/config/env';

/**
 * bt_draft Tool
 *
 * 業務タスク（BT）の草案を生成する
 */
export const btDraftTool = createTool({
  id: 'bt_draft',
  description: `業務タスク（BT）の草案を生成する。

使用方法:
1. ユーザーから業務内容の詳細を聞き出す
2. 業務領域のID（bdId）または名前（bdName）を取得する
   - 前者の場合はそのまま使用
   - 後者の場合はデータベースからIDを検索
3. このToolを呼び出して草案を生成する

注意:
- bdIdとbdNameの両方が提供された場合はbdIdを優先
- bdNameが提供された場合、完全一致または部分一致で検索
- 草案は自動保存されないため、save_to_draft Toolを使用してください`,
  inputSchema: z.object({
    naturalLanguageInput: z.string().describe('ユーザーが入力した業務内容の説明'),
    bdId: z.string().optional().describe('業務領域ID（例: "BIZ-001", "BIZ-GL-001"など、searchBusinessDomainsToolが返すid）'),
    bdName: z.string().optional().describe('業務領域名（例: "GL", "一般会計"）- bdIdがない場合に使用。searchBusinessDomainsToolで業務領域を検索してからbdIdを取得することを推奨'),
    projectId: z.string().describe('プロジェクトID（UUID形式）。必須。'),
    generateBR: z.boolean().optional().default(false).describe('同時にBR草案も生成するか'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    btDraft: z.object({
      code: z.string(),
      name: z.string(),
      summary: z.string(),
      businessContext: z.string(),
      processSteps: z.array(z.string()),
      input: z.array(z.string()),
      output: z.array(z.string()),
      business_domain_id: z.string(),
      concept_ids: z.array(z.string()).optional(),
    }).optional(),
    brDrafts: z.array(z.any()).optional(),
    conceptCandidates: z.array(z.string()).optional(),
    uncertainties: z.array(z.object({
      field: z.string(),
      question: z.string(),
      suggestion: z.string().optional(),
    })).optional(),
    previewAvailable: z.boolean(),
  }),
  execute: async (inputData) => {
    const { naturalLanguageInput, bdId, bdName, projectId, generateBR } = inputData;

    try {
      let resolvedBdId = bdId;

      // bdIdがない場合はbdNameから検索
      if (!resolvedBdId && bdName && projectId) {
        // SQL Injection対策: ユーザー入力をエスケープ
        const orCondition = buildOrLikeConditions(bdName, ['id', 'name', 'area']);

        const { data: bds } = await supabase
          .from('business_domains')
          .select('id, name, area')
          .eq('project_id', projectId)
          .or(orCondition)
          .limit(10);

        if (!bds || bds.length === 0) {
          throw new Error(`業務領域「${bdName}」が見つかりません`);
        }

        if (bds.length > 1) {
          const matches = bds.map(bd => `${bd.id}: ${bd.name}`).join(', ');
          throw new Error(`複数の業務領域が一致しました: ${matches}`);
        }

        resolvedBdId = bds[0].id;
        console.log(`[bt_draft] Found bdId: ${resolvedBdId} for bdName: ${bdName}`);
      }

      if (!resolvedBdId) {
        throw new Error('bdIdまたはbdNameのいずれかを指定してください');
      }

      // 1. BD情報を取得
      const { data: bd } = await supabase
        .from('business_domains')
        .select('id, name, area, project_id')
        .eq('id', resolvedBdId)
        .single();

      if (!bd) {
        throw new Error('業務領域が見つかりません');
      }

      // 2. 既存BTを取得（コード採番のため）
      const areaCode = normalizeAreaCode((bd.area || '') as string) || 'BD';

      const { data: existingBTs } = await supabase
        .from('business_tasks')
        .select('id')
        .eq('business_id', resolvedBdId)
        .order('id', { ascending: false })
        .limit(200);

      // 3. 新しいコード採番（BT-AREA-####）
      const newCode = getNextBtId(areaCode, (existingBTs || []).map((bt) => bt.id));

      // 4. LLMで業務タスクの各項目を生成
      const llmPrompt = `
以下の業務説明から、業務タスク（BT）の各項目を抽出・生成してください。
不明な項目は一般論で推測し、uncertaintiesに追加してください。

【業務説明】
${naturalLanguageInput}

【業務領域】
${bd.id} - ${bd.name}

【出力形式（JSON）】
{
  "name": "業務タスク名（簡潔に、50文字以内）",
  "summary": "業務概要（1-2文、200文字以内）",
  "businessContext": "なぜこの業務が必要か、ビジネス上の背景（300文字以内）",
  "processSteps": ["ステップ1", "ステップ2", "..."],
  "input": ["インプット1", "インプット2", "..."],
  "output": ["アウトプット1", "アウトプット2", "..."],
  "concepts": ["概念1", "概念2", "..."],
  "uncertainties": [
    { "field": "processSteps", "question": "具体的な手順は？", "suggestion": "一般的には..." }
  ]
}

【生成ルール】
- nameは業務の本質を表す簡潔な名前にする
- summaryは「〜する業務」という形式で記述
- businessContextはビジネス価値・背景を記述
- processStepsは実際の作業手順を時系列で列挙（3-7ステップ程度）
- inputは業務に必要な入力情報・資料を列挙
- outputは業務の成果物を列挙
- conceptsは業務で使われる重要な概念・用語を抽出
- uncertaintiesは不明確な項目とその質問・提案を記述
`;

      // LLM呼び出し（OpenAI API）
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
            { role: 'system', content: 'あなたは業務分析の専門家です。業務説明から構造化されたデータを抽出します。' },
            { role: 'user', content: llmPrompt },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (!llmResponse.ok) {
        const errorBody = await llmResponse.text();
        console.error('[bt_draft] OpenAI API error:', { status: llmResponse.status, body: errorBody });
        throw new Error(`OpenAI API error: ${llmResponse.statusText}`);
      }

      const llmResult = await llmResponse.json();
      console.log('[bt_draft] LLM Response:', { model: llmResult.model, usage: llmResult.usage });

      if (!llmResult.choices?.[0]?.message?.content) {
        console.error('[bt_draft] Invalid LLM response:', llmResult);
        throw new Error('LLMのレスポンスが不正です');
      }

      const llmContent = JSON.parse(llmResult.choices[0].message.content);
      console.log('[bt_draft] LLM Content:', { name: llmContent.name, hasProcessSteps: !!llmContent.processSteps });

      // 5. BT草案を生成
      const btDraft = {
        code: newCode,
        name: llmContent.name || naturalLanguageInput.split('\n')[0].substring(0, 50),
        summary: llmContent.summary || naturalLanguageInput.substring(0, 200),
        businessContext: llmContent.businessContext || '',
        processSteps: llmContent.processSteps || [],
        input: llmContent.input || [],
        output: llmContent.output || [],
        business_domain_id: resolvedBdId,
        project_id: projectId,
        concept_ids: [],
      };

      // 6. BR草案も生成する場合（オプション）
      const brDrafts: any[] = [];
      if (generateBR) {
        // TODO: BRの自動生成ロジック
        brDrafts.push({
          code: `${newCode}-001`,
          requirement: `${btDraft.name}を実行できる`,
          rationale: '業務を効率的に実行するため',
          business_task_id: null, // 確定後に設定
        });
      }

      // 7. 概念候補を抽出
      const conceptCandidates: string[] = llmContent.concepts || [];

      // 8. 未確定事項を抽出
      const uncertainties: Array<{ field: string; question: string; suggestion?: string }> =
        llmContent.uncertainties || [];

      return {
        success: true,
        message: `業務タスク「${btDraft.name}」の草案を生成しました（コード: ${newCode}）`,
        btDraft,
        brDrafts: generateBR ? brDrafts : undefined,
        conceptCandidates,
        uncertainties,
        previewAvailable: true,
      };
    } catch (error: any) {
      console.error('[bt_draft] Error:', {
        message: error.message,
        stack: error.stack,
        naturalLanguageInput: naturalLanguageInput?.substring(0, 100),
        bdId,
        bdName,
        projectId,
      });
      return {
        success: false,
        message: `BT草案生成に失敗: ${error.message}`,
        btDraft: undefined,
        brDrafts: undefined,
        conceptCandidates: undefined,
        uncertainties: undefined,
        previewAvailable: false,
      };
    }
  },
});
