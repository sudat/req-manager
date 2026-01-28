import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';

/**
 * system_draft Tool
 *
 * BR群からSF/SR/ACを一括生成する
 */
export const systemDraftTool = createTool({
  id: 'system_draft',
  description: 'BR群からSF/SR/ACを一括生成する',
  inputSchema: z.object({
    brIds: z.array(z.string()),
    additionalContext: z.string().optional(),
  }),
  outputSchema: z.object({
    sfDrafts: z.array(
      z.object({
        code: z.string(),
        name: z.string(),
        description: z.string(),
        system_domain_id: z.string(),
        srs: z.array(
          z.object({
            code: z.string(),
            type: z.string(),
            requirement: z.string(),
            rationale: z.string(),
            acs: z.array(
              z.object({
                code: z.string(),
                given: z.string(),
                when: z.string(),
                then: z.string(),
              })
            ),
          })
        ),
        implUnits: z.array(
          z.object({
            code: z.string(),
            name: z.string(),
            entry_point: z.string(),
            design_notes: z.string().optional(),
          })
        ),
      })
    ),
    realizesLinks: z.array(
      z.object({
        source_id: z.string(),
        target_id: z.string(),
        link_type: z.string(),
      })
    ),
    uncertainties: z.array(z.string()).optional(),
    previewAvailable: z.boolean(),
  }),
  execute: async (inputData) => {
    const { brIds, additionalContext } = inputData;

    try {
      // 1. BR群を取得
      const { data: brs } = await supabase
        .from('business_requirements')
        .select('*, business_task:business_tasks(code, name, business_domain:business_domains(code, project_id))')
        .in('id', brIds);

      if (!brs || brs.length === 0) {
        throw new Error('業務要件が見つかりません');
      }

      // 2. プロジェクトIDを取得
      const projectId = (brs[0] as any).business_task?.business_domain?.project_id;
      if (!projectId) {
        throw new Error('プロジェクトIDが取得できません');
      }

      // 3. プロダクト要件（tech_stack_profile, coding_conventions）を取得
      const { data: pr } = await supabase
        .from('product_requirements')
        .select('tech_stack_profile, coding_conventions')
        .eq('project_id', projectId)
        .single();

      // 4. システム領域を取得または作成（簡易版：1つ目のSDを使用）
      const { data: existingSDs } = await supabase
        .from('system_domains')
        .select('id, code')
        .eq('project_id', projectId)
        .limit(1);

      let systemDomainId = existingSDs?.[0]?.id;
      let sdCode = existingSDs?.[0]?.code || 'SD-001';

      if (!systemDomainId) {
        throw new Error('システム領域が存在しません。先にSDを作成してください。');
      }

      // 5. SF草案を生成（簡易版）
      // TODO: 実際にはLLMでBR群を分析してSFを自動生成
      const sfDrafts = [];

      for (let i = 0; i < brs.length; i++) {
        const br = brs[i];
        const sfCode = `SF-${sdCode.split('-')[1]}-${String(i + 1).padStart(3, '0')}`;

        // SRを生成
        const srs = [
          {
            code: `${sfCode}-001`,
            type: 'functional',
            requirement: `${br.requirement}をシステムで実現できる`,
            rationale: br.rationale || '業務要件を実現するため',
            acs: [
              {
                code: `${sfCode}-001-001`,
                given: '正常な入力がある',
                when: `${br.requirement}を実行する`,
                then: '正常に処理が完了する',
              },
            ],
          },
        ];

        // 実装単位SDを生成
        const implUnits = [
          {
            code: `IU-${sfCode.split('-')[1]}-001`,
            name: `${br.requirement}実装`,
            entry_point: pr?.coding_conventions?.includes('App Router')
              ? `app/(with-sidebar)/feature/page.tsx`
              : `pages/feature/index.tsx`,
            design_notes: additionalContext || '',
          },
        ];

        sfDrafts.push({
          code: sfCode,
          name: `${br.requirement}機能`,
          description: `${br.requirement}を実現する機能`,
          system_domain_id: systemDomainId,
          srs,
          implUnits,
        });
      }

      // 6. realizesリンクを生成
      const realizesLinks = brs.map((br, i) => ({
        source_id: br.id,
        target_id: `sf-draft-${i}`, // 仮ID（確定時に置換）
        link_type: 'realizes',
      }));

      // 7. 未確定事項を抽出
      const uncertainties: string[] = [];
      if (!pr?.tech_stack_profile) {
        uncertainties.push('技術スタックが未設定です');
      }

      return {
        sfDrafts,
        realizesLinks,
        uncertainties,
        previewAvailable: true,
      };
    } catch (error: any) {
      throw new Error(`SF/SR/AC草案生成に失敗: ${error.message}`);
    }
  },
});
