import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';

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
        .select('code, name, system_domain:system_domains(project_id)')
        .eq('id', sfId)
        .single();

      if (!sf) {
        throw new Error('システム機能が見つかりません');
      }

      // 2. プロダクト要件（coding_conventions）を取得
      const projectId = (sf as any).system_domain?.project_id;
      const { data: pr } = await supabase
        .from('product_requirements')
        .select('coding_conventions, tech_stack_profile')
        .eq('project_id', projectId)
        .single();

      // 3. 既存実装単位SDを取得（コード採番のため）
      const { data: existingUnits } = await supabase
        .from('impl_unit_sds')
        .select('code')
        .eq('system_function_id', sfId)
        .order('code', { ascending: false })
        .limit(1);

      // 4. 新しいコード採番
      const sfCodeNum = sf.code.split('-')[1] || '001';
      const lastCode = existingUnits?.[0]?.code || `IU-${sfCodeNum}-000`;
      const lastNumber = parseInt(lastCode.split('-').pop() || '0', 10);
      const newCode = `IU-${sfCodeNum}-${String(lastNumber + 1).padStart(3, '0')}`;

      // 5. coding_conventionsに従ったentry_point生成
      let entryPoint = 'app/page.tsx'; // デフォルト

      if (pr?.coding_conventions) {
        // Next.js App Router の場合
        if (pr.coding_conventions.includes('App Router')) {
          const featureName = sf.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-');
          entryPoint = `app/(with-sidebar)/${featureName}/page.tsx`;
        }
        // Next.js Pages Router の場合
        else if (pr.coding_conventions.includes('Pages')) {
          const featureName = sf.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-');
          entryPoint = `pages/${featureName}/index.tsx`;
        }
      }

      // 6. データモデル設計案生成（簡易版）
      // TODO: 実際にはLLMで生成
      const designNotes =
        naturalLanguageInput ||
        `${sf.name}の実装設計\n\n` +
          `技術スタック: ${pr?.tech_stack_profile || 'Next.js + TypeScript'}\n` +
          `エントリーポイント: ${entryPoint}\n\n` +
          `主な実装項目:\n` +
          `- UIコンポーネント\n` +
          `- データ取得・更新ロジック\n` +
          `- バリデーション\n`;

      // 7. 実装単位SD草案を生成
      const implUnitDraft = {
        code: newCode,
        name: `${sf.name}実装`,
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
