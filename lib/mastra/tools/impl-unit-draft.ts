import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { getOpenAIApiKey } from '@/lib/config/env';

/**
 * impl_unit_draft Tool
 *
 * 実装単位SDの草案を生成する
 */
export const implUnitDraftTool = createTool({
  id: 'impl_unit_draft',
  description: '実装単位SDの草案を生成する',
  inputSchema: z.object({
    sfId: z.string(),
    naturalLanguageInput: z.string().optional(),
  }),
  outputSchema: z.object({
    implUnitDraft: z.object({
      code: z.string(),
      name: z.string(),
      entry_point: z.string(),
      design_notes: z.string().optional(),
      system_function_id: z.string(),
    }),
    uncertainties: z.array(z.string()).optional(),
    previewAvailable: z.boolean(),
  }),
  execute: async (inputData) => {
    const { sfId, naturalLanguageInput } = inputData;

    try {
      // 1. SF情報を取得
      const { data: sf } = await supabase
        .from('system_functions')
        .select('id, title, system_domain:system_domains(project_id)')
        .eq('id', sfId)
        .single();

      if (!sf) {
        throw new Error('システム機能が見つかりません');
      }

      const sfData = sf as any;
      const sfName = sfData.title;
      const sfIdValue = sfData.id;

      // 2. プロダクト要件（coding_conventions）を取得
      const projectId = sfData.system_domain?.project_id;
      const { data: pr } = await supabase
        .from('product_requirements')
        .select('coding_conventions, tech_stack_profile')
        .eq('project_id', projectId)
        .single();

      // 3. 既存実装単位SDを取得（コード採番のため）
      const { data: existingUnits } = await supabase
        .from('impl_unit_sds')
        .select('id')
        .eq('srf_id', sfId)
        .order('id', { ascending: false })
        .limit(1);

      // 4. 新しいコード採番（sfIdからプレフィックスを生成）
      const sfIdParts = sfIdValue.split('-');
      const sfCodeNum = sfIdParts[sfIdParts.length - 1] || '001';
      const lastCode = existingUnits?.[0]?.id || `IU-${sfCodeNum}-000`;
      const lastNumber = parseInt(lastCode.split('-').pop() || '0', 10);
      const newCode = `IU-${sfCodeNum}-${String(lastNumber + 1).padStart(3, '0')}`;

      // 5. coding_conventionsに従ったentry_point生成
      let entryPoint = 'app/page.tsx'; // デフォルト

      if (pr?.coding_conventions) {
        // Next.js App Router の場合
        if (pr.coding_conventions.includes('App Router')) {
          const featureName = sfName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-');
          entryPoint = `app/(with-sidebar)/${featureName}/page.tsx`;
        }
        // Next.js Pages Router の場合
        else if (pr.coding_conventions.includes('Pages')) {
          const featureName = sfName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-');
          entryPoint = `pages/${featureName}/index.tsx`;
        }
      }

      // 6. LLMで実装設計案を生成
      let designNotes = '';

      if (naturalLanguageInput) {
        designNotes = naturalLanguageInput;
      } else {
        const openaiApiKey = getOpenAIApiKey();

        const llmPrompt = `
以下のシステム機能の実装設計案を生成してください。

【システム機能】
- 機能名: ${sfName}
- 機能ID: ${sfIdValue}

【技術スタック】
${pr?.tech_stack_profile || 'Next.js + TypeScript'}

【コーディング規約】
${pr?.coding_conventions || 'App Router を使用'}

【エントリーポイント】
${entryPoint}

【出力形式（Markdown）】
# ${sfName}の実装設計

## 概要
[機能の概要を1-2文で]

## 技術構成
- フレームワーク: [具体的に]
- 状態管理: [具体的に]
- データ取得: [具体的に]

## UIコンポーネント構成
- [主要コンポーネント1]
  - 役割: [具体的に]
  - Props: [具体的に]
- [主要コンポーネント2]
  ...

## データフロー
1. [ユーザー操作]
2. [データ取得・更新]
3. [画面反映]

## バリデーション
- [検証項目1]
- [検証項目2]

## エラーハンドリング
- [エラーケース1]
- [エラーケース2]

【生成ルール】
- 具体的な実装イメージが湧くレベルで詳細に記述
- 技術スタックに従った実装方法を提案
- Next.js の best practices に従う
`;

        try {
          const llmResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openaiApiKey}`,
            },
            body: JSON.stringify({
              model: 'gpt-5-mini',
              messages: [
                { role: 'system', content: 'あなたはフロントエンド設計の専門家です。実装可能な詳細設計書を生成します。' },
                { role: 'user', content: llmPrompt },
              ],
            }),
          });

          if (llmResponse.ok) {
            const llmResult = await llmResponse.json();
            designNotes = llmResult.choices[0].message.content;
          } else {
            console.error('[impl_unit_draft] OpenAI API error');
            // フォールバック
            designNotes =
              `${sfName}の実装設計\n\n` +
              `技術スタック: ${pr?.tech_stack_profile || 'Next.js + TypeScript'}\n` +
              `エントリーポイント: ${entryPoint}\n\n` +
              `主な実装項目:\n` +
              `- UIコンポーネント\n` +
              `- データ取得・更新ロジック\n` +
              `- バリデーション\n`;
          }
        } catch (error) {
          console.error('[impl_unit_draft] LLM generation error:', error);
          // フォールバック
          designNotes =
            `${sfName}の実装設計\n\n` +
            `技術スタック: ${pr?.tech_stack_profile || 'Next.js + TypeScript'}\n` +
            `エントリーポイント: ${entryPoint}\n\n` +
            `主な実装項目:\n` +
            `- UIコンポーネント\n` +
            `- データ取得・更新ロジック\n` +
            `- バリデーション\n`;
        }
      }

      // 7. 実装単位SD草案を生成
      const implUnitDraft = {
        code: newCode,
        name: `${sfName}実装`,
        entry_point: entryPoint,
        design_notes: designNotes,
        system_function_id: sfId,
      };

      // 8. 未確定事項を抽出
      const uncertainties: string[] = [];
      if (!pr?.coding_conventions) {
        uncertainties.push('コーディング規約が未設定です');
      }
      if (!pr?.tech_stack_profile) {
        uncertainties.push('技術スタックが未設定です');
      }

      return {
        implUnitDraft,
        uncertainties,
        previewAvailable: true,
      };
    } catch (error: any) {
      throw new Error(`実装単位SD草案生成に失敗: ${error.message}`);
    }
  },
});
