import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';

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
    bdId: z.string().optional().describe('業務領域ID（例: "550e8400-e29b-41d4-a716-446655440000"）'),
    bdName: z.string().optional().describe('業務領域名（例: "GL", "一般会計"）- bdIdがない場合に使用'),
    projectId: z.string().describe('プロジェクトID（bdNameから検索する場合に必要）'),
    generateBR: z.boolean().optional().default(false).describe('同時にBR草案も生成するか'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    btDraft: z.object({
      code: z.string(),
      name: z.string(),
      description: z.string(),
      business_domain_id: z.string(),
      concept_ids: z.array(z.string()).optional(),
    }).optional(),
    brDrafts: z.array(z.any()).optional(),
    conceptCandidates: z.array(z.string()).optional(),
    uncertainties: z.array(z.string()).optional(),
    previewAvailable: z.boolean(),
  }),
  execute: async (inputData) => {
    const { naturalLanguageInput, bdId, bdName, projectId, generateBR } = inputData;

    try {
      let resolvedBdId = bdId;

      // bdIdがない場合はbdNameから検索
      if (!resolvedBdId && bdName && projectId) {
        const { data: bds } = await supabase
          .from('business_domains')
          .select('id, code, name')
          .eq('project_id', projectId)
          .or(`code.ilike.${bdName}%,name.ilike.%${bdName}%`)
          .limit(10);

        if (!bds || bds.length === 0) {
          throw new Error(`業務領域「${bdName}」が見つかりません`);
        }

        if (bds.length > 1) {
          const matches = bds.map(bd => `${bd.code}: ${bd.name}`).join(', ');
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
        .select('code, name, project_id')
        .eq('id', resolvedBdId)
        .single();

      if (!bd) {
        throw new Error('業務領域が見つかりません');
      }

      // 2. 既存BTを取得（コード採番のため）
      const { data: existingBTs } = await supabase
        .from('business_tasks')
        .select('code')
        .eq('business_domain_id', resolvedBdId)
        .order('code', { ascending: false })
        .limit(1);

      // 3. 新しいコード採番
      const lastCode = existingBTs?.[0]?.code || `${bd.code}-000`;
      const lastNumber = parseInt(lastCode.split('-').pop() || '0', 10);
      const newCode = `${bd.code}-${String(lastNumber + 1).padStart(3, '0')}`;

      // 4. 自然言語から名前と説明を抽出（簡易版）
      // TODO: 実際にはLLMを使って整形する
      const lines = naturalLanguageInput.trim().split('\n');
      const name = lines[0].substring(0, 100); // 最初の行を名前に
      const description = naturalLanguageInput;

      // 5. BT草案を生成
      const btDraft = {
        code: newCode,
        name,
        description,
        business_domain_id: resolvedBdId,
        concept_ids: [],
      };

      // 6. BR草案も生成する場合（オプション）
      const brDrafts: any[] = [];
      if (generateBR) {
        // TODO: BRの自動生成ロジック
        brDrafts.push({
          code: `${newCode}-001`,
          requirement: `${name}を実行できる`,
          rationale: '業務を効率的に実行するため',
          business_task_id: null, // 確定後に設定
        });
      }

      // 7. 概念候補を抽出（簡易版）
      // TODO: 実際にはLLMで概念抽出
      const conceptCandidates: string[] = [];

      // 8. 未確定事項を抽出
      const uncertainties: string[] = [];
      if (!name || name.length < 3) {
        uncertainties.push('業務タスク名が不明確です');
      }

      return {
        success: true,
        message: `業務タスク「${name}」の草案を生成しました（コード: ${newCode}）`,
        btDraft,
        brDrafts: generateBR ? brDrafts : undefined,
        conceptCandidates,
        uncertainties,
        previewAvailable: true,
      };
    } catch (error: any) {
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
