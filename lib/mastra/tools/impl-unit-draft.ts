import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { callOpenAI } from '@/lib/mastra/utils/llm-helpers';
import { resolveProjectLlmRuntimeSettings } from '@/lib/mastra/utils/llm-settings';

/**
 * impl_unit_draft Tool
 *
 * 実装単位SDの草案を生成する
 */
export const implUnitDraftTool = createTool({
  id: 'impl_unit_draft',
  description: `システム機能（SF）から実装単位SD（Impl Unit SD）の草案を生成するツールです。

【使用タイミング】
- ユーザーが「実装単位SDを生成して」「IUを作成して」「実装設計を作成して」などと言った場合
- ユーザーがSF IDを指定した場合（例: 「SF-AP-0002から実装単位SDを生成して」）

【入力パラメータ】
- sfId: SF ID（例: "SF-AP-0002"）
- naturalLanguageInput: 追加の設計上の要望（オプション）

【出力】
- 実装単位SD草案（code、name、entry_point、design_notes、system_function_id）
- entry_pointはcoding_conventionsに従って自動生成（例: App Routerの場合: "app/(with-sidebar)/feature/page.tsx"）
- design_notesにはLLMが生成した実装設計案（技術構成、UIコンポーネント、データフローなど）が含まれる

【重要】
- ユーザーがSF IDをメッセージに含めている場合は、必ずそれを抽出して使う
- SF IDが不明な場合は、必ずユーザーにSF IDを尋ねる`,
  inputSchema: z.object({
    sfId: z.string(),
    naturalLanguageInput: z.string().optional(),
    projectId: z.string().describe('プロジェクトID（UUID形式）。必須。'),
    sfName: z.string().optional(),
    allowDraft: z.boolean().optional().default(false),
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
    const { sfId, naturalLanguageInput, projectId, sfName, allowDraft } = inputData;

    try {
      // 1. SF情報を取得
      const { data: sf } = await supabase
        .from('system_functions')
        .select('id, title, system_domain:system_domains(project_id)')
        .eq('id', sfId)
        .single();

      const resolvedSf = sf ? (sf as any) : null;
      if (!resolvedSf && !projectId) {
        throw new Error('システム機能が見つかりません');
      }

      const sfData = resolvedSf ?? { id: sfId, title: sfName ?? sfId, system_domain: { project_id: projectId } };
      const sfNameValue = sfData.title;
      const sfIdValue = sfData.id;

      // 2. プロダクト要件（coding_conventions）を取得
      const resolvedProjectId = sfData.system_domain?.project_id ?? projectId;
      const llmSettings = await resolveProjectLlmRuntimeSettings(resolvedProjectId);
      const llmOptions = {
        model: llmSettings.model,
        temperature: llmSettings.temperature,
        baseUrl: llmSettings.baseUrl,
        verbosity: llmSettings.verbosity,
      };
      const { data: pr } = await supabase
        .from('product_requirements')
        .select('coding_conventions, tech_stack_profile')
        .eq('project_id', resolvedProjectId)
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
          const featureName = sfNameValue
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-');
          entryPoint = `app/(with-sidebar)/${featureName}/page.tsx`;
        }
        // Next.js Pages Router の場合
        else if (pr.coding_conventions.includes('Pages')) {
          const featureName = sfNameValue
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
        const llmPrompt = `
以下のシステム機能の実装設計案を生成してください。

【システム機能】
- 機能名: ${sfNameValue}
- 機能ID: ${sfIdValue}

【技術スタック】
${pr?.tech_stack_profile || 'Next.js + TypeScript'}

【コーディング規約】
${pr?.coding_conventions || 'App Router を使用'}

【エントリーポイント】
${entryPoint}

【出力形式（Markdown）】
# ${sfNameValue}の実装設計

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

        const llmResponse = await callOpenAI({
          systemPrompt: 'あなたはフロントエンド設計の専門家です。実装可能な詳細設計書を生成します。',
          userPrompt: llmPrompt,
          jsonMode: false, // テキスト形式で出力
          model: llmOptions.model,
          temperature: llmOptions.temperature,
          baseUrl: llmOptions.baseUrl,
          verbosity: llmOptions.verbosity,
          maxTokens: 1500,
          timeoutMs: 180000,
        });

        designNotes = llmResponse.content;
      }

      // 7. 実装単位SD草案を生成
      const implUnitDraft = {
        code: newCode,
        name: `${sfNameValue}実装`,
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
      if (!resolvedSf && (allowDraft || projectId)) {
        uncertainties.push('システム機能が未確定のため、内容は草案として扱われます');
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
