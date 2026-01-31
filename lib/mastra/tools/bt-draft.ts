import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { buildOrLikeConditions } from '@/lib/mastra/utils/sql-helpers';
import { getNextBtId, normalizeAreaCode } from '@/lib/utils/id-rules';
import { callOpenAI } from '@/lib/mastra/utils/llm-helpers';
import { toolSuccess, toolError } from '@/lib/mastra/utils/tool-helpers';

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
- 草案はマークダウン形式でユーザーに提示し、「はい」で即座にcommitDraftToolを呼び出して登録する`,
  inputSchema: z.object({
    naturalLanguageInput: z.string().describe('ユーザーが入力した業務内容の説明'),
    bdId: z.string().optional().describe('業務領域ID（例: "BIZ-001", "BIZ-GL-001"など、searchBusinessDomainsToolが返すid）'),
    bdName: z.string().optional().describe('業務領域名（例: "GL", "一般会計"）- bdIdがない場合に使用。searchBusinessDomainsToolで業務領域を検索してからbdIdを取得することを推奨'),
    projectId: z.string().describe('プロジェクトID（UUID形式）。必須。'),
    generateBR: z.boolean().optional().default(false).describe('同時にBR草案も生成するか'),
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

      // LLM呼び出し（OpenAI API）
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
      });

      console.log('[bt_draft] LLM Response:', { model: llmResponse.model, usage: llmResponse.usage });

      const llmContent = llmResponse.content;
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
