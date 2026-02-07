import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { buildOrLikeConditions } from '@/lib/mastra/utils/sql-helpers';
import { getNextBtId, normalizeAreaCode } from '@/lib/utils/id-rules';
import { callOpenAI } from '@/lib/mastra/utils/llm-helpers';
import { toolSuccess, toolError } from '@/lib/mastra/utils/tool-helpers';
import { getConceptsLookupMap, findSimilarConcepts } from '@/lib/data/concepts';
import { resolveProjectLlmRuntimeSettings } from '@/lib/mastra/utils/llm-settings';

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
2. 業務領域のコード（bdId）または名前（bdName）を取得する
   - 前者の場合はそのまま使用
   - 後者の場合はデータベースからIDを検索
3. このToolを呼び出して草案を生成する

注意:
- bdIdとbdNameの両方が提供された場合はbdIdを優先
- bdNameが提供された場合、完全一致または部分一致で検索
- 草案はマークダウン形式でユーザーに提示し、「はい」で即座にcommitDraftToolを呼び出して登録する`,
  inputSchema: z.object({
    naturalLanguageInput: z.string().describe('ユーザーが入力した業務内容の説明'),
    bdId: z.string().optional().describe('業務領域コード（例: "AR", "GL" など、searchBusinessDomainsToolが返すarea）'),
    bdName: z.string().optional().describe('業務領域名（例: "一般会計"）- bdIdがない場合に使用。searchBusinessDomainsToolで業務領域を検索してからbdIdを取得することを推奨'),
    projectId: z.string().describe('プロジェクトID（UUID形式）。必須。'),
    generateBR: z.boolean().optional().default(true).describe('同時にBR草案も生成するか'),
  }),
  execute: async (inputData) => {
    const { naturalLanguageInput, bdId, bdName, projectId, generateBR } = inputData;

    try {
      let resolvedBdArea = bdId;

      // bdIdがない場合はbdNameから検索
      if (!resolvedBdArea && bdName && projectId) {
        // SQL Injection対策: ユーザー入力をエスケープ
        const orCondition = buildOrLikeConditions(bdName, ['name', 'area']);

        const { data: bds } = await supabase
          .from('business_domains')
          .select('area, name')
          .eq('project_id', projectId)
          .or(orCondition)
          .limit(10);

        if (!bds || bds.length === 0) {
          throw new Error(`業務領域「${bdName}」が見つかりません`);
        }

        if (bds.length > 1) {
          const matches = bds.map(bd => `${bd.area}: ${bd.name}`).join(', ');
          throw new Error(`複数の業務領域が一致しました: ${matches}`);
        }

        resolvedBdArea = bds[0].area;
        console.log(`[bt_draft] Found bdArea: ${resolvedBdArea} for bdName: ${bdName}`);
      }

      if (!resolvedBdArea) {
        throw new Error('bdIdまたはbdNameのいずれかを指定してください');
      }

      // 1. BD情報を取得
      const { data: bd } = await supabase
        .from('business_domains')
        .select('area, name, project_id')
        .eq('area', resolvedBdArea)
        .eq('project_id', projectId)
        .single();

      if (!bd) {
        throw new Error('業務領域が見つかりません');
      }

      // 2. 既存BTを取得（コード採番のため）
      const areaCode = normalizeAreaCode((bd.area || '') as string) || 'BD';

      const { data: existingBTs } = await supabase
        .from('business_tasks')
        .select('id')
        .eq('business_area', resolvedBdArea)
        .order('id', { ascending: false })
        .limit(200);

      // 3. 新しいコード採番（BT-AREA-####）
      const newCode = getNextBtId(areaCode, (existingBTs || []).map((bt) => bt.id));

      // 3.5. 既存概念マップを取得（概念照合用）
      const conceptMap = await getConceptsLookupMap(projectId);
      const existingConceptsArray = Array.from(conceptMap.values());
      const llmSettings = await resolveProjectLlmRuntimeSettings(projectId);
      const llmOptions = {
        provider: (llmSettings.provider === 'zai' ? 'zai' : 'openai') as 'openai' | 'zai',
        model: llmSettings.model,
        temperature: llmSettings.temperature,
        baseUrl: llmSettings.baseUrl,
        verbosity: llmSettings.verbosity,
      };

      // 4. LLMで業務タスクの各項目を生成
      const llmPrompt = `
以下の業務説明から、業務タスク（BT）の各項目を抽出・生成してください。
不明な項目は一般論で推測し、uncertaintiesに追加してください。

【業務説明】
${naturalLanguageInput}

【業務領域】
${bd.area} - ${bd.name}

【厳密な出力形式 - 絶対に守ること】
- 以下のJSONスキーマに厳密に従うこと
- マークダウン記法（#, ##, -, 1. など）は使用しないこと
- 説明文は一切含めないこと
- 純粋なJSONオブジェクトのみを出力すること

【出力形式（JSON）】
{
  "name": "業務タスク名（簡潔に、50文字以内）",
  "summary": "業務概要（1-2文、200文字以内）",
  "businessContext": "なぜこの業務が必要か、ビジネス上の背景（300文字以内）",
  "processSteps": [
    \{ "when": "月初", "who": "経理担当", "action": "データを集計する" \},
    \{ "when": "月中", "who": "上司", "action": "内容をレビューする" \},
    \{ "when": "月末", "who": "経理担当", "action": "書類を提出する" \}
  ],
  "input": [
    \{ "name": "請求書データ", "source": "販売管理システム" \},
    \{ "name": "入金データ", "source": "銀行システム" \}
  ],
  "output": [
    \{ "name": "売上管理表", "source": "Excel" \},
    \{ "name": "入金確認リスト", "source": "社内DB" \}
  ],
  "concepts": ["概念1", "概念2", "..."],
  "uncertainties": [
    \{ "field": "processSteps", "question": "具体的な手順は？", "suggestion": "一般的には..." \}
  ]
}

【生成ルール】
- nameは業務の本質を表す簡潔な名前にする
- summaryは「〜する業務」という形式で記述
- businessContextはビジネス価値・背景を記述
- processStepsは「いつ・だれが・何を」の構造で時系列で列挙（3-7ステップ程度）
- inputは「名称」と「ソース（取得元）」の構造で列挙
- outputは「名称」と「ソース（出力先）」の構造で列挙
- conceptsは業務で使われる重要な概念・用語を抽出
- uncertaintiesは不明確な項目とその質問・提案を記述

【重要 - 絶対に守ること】
- 出力は純粋なJSONのみとし、説明文やマークダウンは含めない
- JSONの前後に\`\`\`や説明テキストを付けない
- パース可能な有効なJSONのみを出力する
`;

      const llmResponse = await callOpenAI<{
        name?: string;
        summary?: string;
        businessContext?: string;
        processSteps?: Array<{ when: string; who: string; action: string }>;
        input?: Array<{ name: string; source: string }>;
        output?: Array<{ name: string; source: string }>;
        concepts?: string[];
        uncertainties?: Array<{ field: string; question: string; suggestion?: string }>;
      }>({
        systemPrompt: 'あなたは業務分析の専門家です。業務説明から構造化されたデータを抽出します。',
        userPrompt: llmPrompt,
        jsonMode: true,
        provider: llmOptions.provider,
        model: llmOptions.model,
        temperature: llmOptions.temperature,
        baseUrl: llmOptions.baseUrl,
        maxTokens: 2000,
        timeoutMs: 180000,
      });

      console.log('[bt_draft] LLM Response:', { model: llmResponse.model, usage: llmResponse.usage });

      const llmContent = llmResponse.content;
      console.log('[bt_draft] LLM Content:', { name: llmContent.name, hasProcessSteps: !!llmContent.processSteps });
      const hasMeaningfulContent = Boolean(
        (typeof llmContent.name === 'string' && llmContent.name.trim().length > 0) ||
        (typeof llmContent.summary === 'string' && llmContent.summary.trim().length > 0) ||
        (typeof llmContent.businessContext === 'string' && llmContent.businessContext.trim().length > 0) ||
        (Array.isArray(llmContent.processSteps) && llmContent.processSteps.length > 0) ||
        (Array.isArray(llmContent.input) && llmContent.input.length > 0) ||
        (Array.isArray(llmContent.output) && llmContent.output.length > 0)
      );
      if (!hasMeaningfulContent) {
        throw new Error('LLM response was empty or invalid');
      }

      // 5. BT草案を生成
      const btDraft = {
        code: newCode,
        name: llmContent.name || naturalLanguageInput.split('\n')[0].substring(0, 50),
        summary: llmContent.summary || naturalLanguageInput.substring(0, 200),
        businessContext: llmContent.businessContext || '',
        processSteps: llmContent.processSteps || [],
        input: llmContent.input || [],
        output: llmContent.output || [],
        business_area: resolvedBdArea,
        project_id: projectId,
        concept_ids: [],
      };

      // 6. BR草案も生成する場合
      const brDrafts: any[] = [];
      if (generateBR) {
        try {
          const brLlmPrompt = `以下の業務タスク情報から、必要な業務要件（BR）を1～3件生成してください。
業務要件とは、業務タスクを達成するために必要な「ケイパビリティ」のことです。

【業務タスク情報】
名称: ${btDraft.name}
概要: ${btDraft.summary}
業務コンテキスト: ${btDraft.businessContext}

【プロセス】
${btDraft.processSteps.map((s: { when: string; who: string; action: string }) => `- ${s.when}: ${s.who}が${s.action}`).join('\n')}

【入力】
${btDraft.input.map((i: { name: string; source: string }) => `- ${i.name}（${i.source}）`).join('\n')}

【出力】
${btDraft.output.map((o: { name: string; source: string }) => `- ${o.name}（${o.source}）`).join('\n')}

【厳密な出力形式】
- 以下のJSONスキーマに厳密に従うこと
- 純粋なJSONのみを出力すること

【出力形式（JSON）】
{
  "items": [
    { "requirement": "～できる（ケイパビリティの形式で記述）", "rationale": "なぜこの要件が必要か（業務の目的や効率性観点）" }
  ]
}

【ガイドライン】
- requirementは「～できる」の形で記述する
- rationaleは業務の目的や効率性観点で簡潔に記述する
- 業務のコア活動に対応する要件を優先する
- 1～3件で、重複を避ける
- 純粋なJSONのみを出力する
`;

          const brLlmResponse = await callOpenAI<{
            items?: Array<{ requirement: string; rationale: string }>;
          }>({
            systemPrompt: 'あなたは業務分析の専門家です。業務タスクから必要な業務要件を抽出します。',
            userPrompt: brLlmPrompt,
            jsonMode: true,
            provider: llmOptions.provider,
            model: llmOptions.model,
            temperature: llmOptions.temperature,
            baseUrl: llmOptions.baseUrl,
            maxTokens: 1500,
            timeoutMs: 120000,
          });

          const brItems = brLlmResponse.content?.items || [];
          for (let i = 0; i < brItems.length; i++) {
            if (!brItems[i].requirement) continue;
            brDrafts.push({
              code: `${newCode}-${String(i + 1).padStart(3, '0')}`,
              requirement: brItems[i].requirement,
              rationale: brItems[i].rationale || '',
              business_task_id: null,
            });
          }
        } catch (brError) {
          console.warn('[bt_draft] BR生成に失敗しました。BT草案のみで続行。', brError);
        }
      }

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
            context: `業務タスク「${llmContent.name || naturalLanguageInput.split('\n')[0].substring(0, 50)}」で使用`,
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
              context: `業務タスク「${llmContent.name || naturalLanguageInput.split('\n')[0].substring(0, 50)}」で使用`,
              isExisting: false,
              suggestion: `類似概念「${topSimilar.name}」が見つかりました（類似度: ${topSimilar.similarityScore}%）`,
              matchType: 'similar',
              similarConcept: topSimilar,
            });
          } else {
            // 新規概念（類似概念がなかった、または90%以上で除外された）
            conceptCandidates.push({
              term,
              context: `業務タスク「${llmContent.name || naturalLanguageInput.split('\n')[0].substring(0, 50)}」で使用`,
              isExisting: false,
              suggestion: '概念辞書に登録することを検討してください',
              matchType: 'new',
            });
          }
        }
      }

      // 8. 未確定事項を抽出
      const uncertainties: Array<{ field: string; question: string; suggestion?: string }> =
        llmContent.uncertainties || [];

      return toolSuccess(
        `業務タスク「${btDraft.name}」の草案を生成しました（コード: ${newCode}）`,
        {
          btDraft,
          brDrafts: generateBR ? brDrafts : undefined,
          conceptCandidates,
          uncertainties,
          previewAvailable: true,
        }
      );
    } catch (error: any) {
      console.error('[bt_draft] Error:', {
        message: error.message,
        stack: error.stack,
        naturalLanguageInput: naturalLanguageInput?.substring(0, 100),
        bdId,
        bdName,
        projectId,
      });
      return toolError(error, 'BT草案生成に失敗しました');
    }
  },
});
