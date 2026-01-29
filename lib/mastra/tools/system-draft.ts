import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { getOpenAIApiKey } from '@/lib/config/env';
import { normalizeAreaCode } from '@/lib/utils/id-rules';

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
        .select('*, business_task:business_tasks(id, name, business_domain:business_domains(id, project_id))')
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
        .select('id, name')
        .eq('project_id', projectId)
        .limit(1);

      let systemDomainId = existingSDs?.[0]?.id;
      let sdId = existingSDs?.[0]?.id || 'SD-001';

      if (!systemDomainId) {
        throw new Error('システム領域が存在しません。先にSDを作成してください。');
      }

      // 5. LLMでSF/SR/ACを生成
      const openaiApiKey = getOpenAIApiKey();

      const sfDrafts = [];

      const normalizedDomainId = normalizeAreaCode(systemDomainId ?? sdId) || 'SD';

      for (let i = 0; i < brs.length; i++) {
        const br = brs[i];
        const sfCode = `SF-${normalizedDomainId}-${String(i + 1).padStart(4, '0')}`;
        const sfSeq = sfCode.split('-')[2] || String(i + 1).padStart(4, '0');

        // LLMでSR/ACを生成
        const llmPrompt = `
以下の業務要件（BR）から、システム要件（SR）と受入基準（AC）を生成してください。

【業務要件】
- ID: ${br.id}
- 要件: ${br.title || br.requirement}
- 根拠: ${br.rationale || br.goal}

【技術スタック】
${pr?.tech_stack_profile || 'Next.js + TypeScript'}

【出力形式（JSON）】
{
  "sr": {
    "requirement": "システムで実現すべき具体的な機能",
    "rationale": "なぜこのシステム要件が必要か"
  },
  "acs": [
    {
      "given": "前提条件（具体的に）",
      "when": "ユーザーアクション（具体的に）",
      "then": "期待される結果（具体的に）"
    }
  ]
}

【生成ルール】
- SR は具体的なシステム機能として記述（例: 「〇〇画面で△△を入力・保存できる」）
- AC は Given-When-Then 形式で具体的に記述
- AC は正常系・異常系を含めて2-3個生成
- 技術的な実現可能性を考慮する
`;

        const llmResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-5-mini',
            messages: [
              { role: 'system', content: 'あなたはシステム設計の専門家です。業務要件からシステム要件と受入基準を生成します。' },
              { role: 'user', content: llmPrompt },
            ],
            response_format: { type: 'json_object' },
          }),
        });

        let llmContent: any;
        if (!llmResponse.ok) {
          console.error(`[system_draft] OpenAI API error for BR ${br.id}`);
          // フォールバック: 機械的生成
          llmContent = {
            sr: {
              requirement: `${br.title || br.requirement}をシステムで実現できる`,
              rationale: br.rationale || br.goal || '業務要件を実現するため',
            },
            acs: [
              {
                given: '正常な入力がある',
                when: `${br.title || br.requirement}を実行する`,
                then: '正常に処理が完了する',
              },
            ],
          };
        } else {
          const llmResult = await llmResponse.json();
          llmContent = JSON.parse(llmResult.choices[0].message.content);
        }

        // SRを生成
        const srCode = `SR-${normalizedDomainId}-${sfSeq}-${String(1).padStart(4, '0')}`;
        const srs = [
          {
            code: srCode,
            type: 'functional',
            requirement: llmContent.sr.requirement,
            rationale: llmContent.sr.rationale,
            acs: llmContent.acs.map((ac: any, acIndex: number) => ({
              code: `AC-${srCode}-${String(acIndex + 1).padStart(3, '0')}`,
              given: ac.given,
              when: ac.when,
              then: ac.then,
            })),
          },
        ];

        // 実装単位SDを生成
        const implUnits = [
          {
            code: `IU-${sfCode}-001`,
            name: `${br.title || br.requirement}実装`,
            entry_point: pr?.coding_conventions?.includes('App Router')
              ? `app/(with-sidebar)/feature/page.tsx`
              : `pages/feature/index.tsx`,
            design_notes: additionalContext || '',
          },
        ];

        sfDrafts.push({
          code: sfCode,
          name: `${br.title || br.requirement}機能`,
          description: `${br.title || br.requirement}を実現する機能`,
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
