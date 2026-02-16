import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { callOpenAI } from '@/lib/mastra/utils/llm-helpers';
import { normalizeAreaCode, getNextSfId } from '@/lib/utils/id-rules';
import { resolveProjectLlmRuntimeSettings } from '@/lib/mastra/utils/llm-settings';

/**
 * system_draft Tool
 *
 * BR群からSF/SR/ACを一括生成する
 */
export const systemDraftTool = createTool({
  id: 'system_draft',
  description: `業務要件（BR）群からシステム機能（SF）、システム要件（SR）、受入基準（AC）を一括生成するツールです。

【使用タイミング】
- ユーザーが「SF/SR/ACを生成して」「システム要件を生成して」「SFを作成して」などと言った場合
- ユーザーがBR IDを指定した場合（例: 「BR-AP-0001-0001から生成して」）

【入力パラメータ】
- brIds: BR IDの配列（例: ["BR-AP-0001-0001", "BR-AP-0001-0002"]）
- additionalContext: 追加のコンテキスト情報（オプション）

【出力】
- SF草案（SR配列、AC配列を含む階層構造）
- realizesリンク（BR→SFの関連付け）

【重要】
- ユーザーがBR IDをメッセージに含めている場合は、必ずそれを抽出して使う
- BR IDが不明な場合は、必ずユーザーにBR IDを尋ねる
- 複数のBRを指定して一括生成することも可能`,
  inputSchema: z.object({
    brIds: z.array(z.string()),
    additionalContext: z.string().optional(),
    projectId: z.string().describe('プロジェクトID（UUID形式）。必須。'),
    brDrafts: z.array(z.object({
      id: z.string().optional(),
      code: z.string().optional(),
      title: z.string().optional(),
      requirement: z.string(),
      rationale: z.string().optional(),
      goal: z.string().optional(),
      business_task_id: z.string().optional(),
    })).optional(),
    allowDraft: z.boolean().optional().default(false),
  }),
  outputSchema: z.object({
    sfDrafts: z.array(
      z.object({
        code: z.string(),
        name: z.string(),
        description: z.string(),
        system_domain_id: z.string(),
        project_id: z.string().optional(),
        isCommitted: z.boolean().optional(),
        srs: z.array(
          z.object({
            code: z.string(),
            type: z.string(),
            title: z.string().optional(),
            summary: z.string().optional(),
            requirement: z.string(),
            rationale: z.string(),
            task_id: z.string().optional(),
            project_id: z.string().optional(),
            srf_ids: z.array(z.string()).optional(),
            system_domain_ids: z.array(z.string()).optional(),
            businessRequirementIds: z.array(z.string()).optional(),
            acs: z.array(
              z.object({
                code: z.string(),
                title: z.string().optional(),
                given: z.string(),
                when: z.string(),
                then: z.string(),
              })
            ),
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
    const { brIds, additionalContext, projectId, brDrafts, allowDraft } = inputData;

    try {
      // 1. BR群を取得
      const { data: brs } = await supabase
        .from('business_requirements')
        .select('*, business_task:business_tasks(id, name, business_domain:business_domains(area, project_id))')
        .in('id', brIds);

      const resolvedBrs = (brs && brs.length > 0)
        ? brs
        : (brDrafts && brDrafts.length > 0 ? brDrafts : []);

      if (resolvedBrs.length === 0) {
        throw new Error('業務要件が見つかりません');
      }

      // 2. プロジェクトIDを取得
      const resolvedProjectId =
        (brs && brs.length > 0)
          ? (brs[0] as any).business_task?.business_domain?.project_id
          : projectId;
      if (!resolvedProjectId) {
        throw new Error('プロジェクトIDが取得できません');
      }
      const llmSettings = await resolveProjectLlmRuntimeSettings(resolvedProjectId);
      const llmOptions = {
        provider: (llmSettings.provider === 'zai' ? 'zai' : 'openai') as 'openai' | 'zai',
        model: llmSettings.model,
        temperature: llmSettings.temperature,
        baseUrl: llmSettings.baseUrl,
        verbosity: llmSettings.verbosity,
      };

      // 3. プロダクト要件（tech_stack_profile, coding_conventions）を取得
      const { data: pr } = await supabase
        .from('product_requirements')
        .select('tech_stack_profile, coding_conventions')
        .eq('project_id', resolvedProjectId)
        .single();

      // 4. システム領域を取得または作成（簡易版：1つ目のSDを使用）
      const { data: existingSDs } = await supabase
        .from('system_domains')
        .select('id, name')
        .eq('project_id', resolvedProjectId)
        .limit(1);

      const systemDomainId = existingSDs?.[0]?.id;
      const sdId = existingSDs?.[0]?.id || 'SD-001';

      if (!systemDomainId) {
        throw new Error('システム領域が存在しません。先にSDを作成してください。');
      }

      // 5. LLMでSF/SR/ACを生成
      const sfDrafts = [];

      const normalizedDomainId = normalizeAreaCode(systemDomainId ?? sdId) || 'SD';

      const deriveTaskIdFromBrId = (value?: string) => {
        if (!value) return undefined;
        const parts = value.split('-').filter(Boolean);
        if (parts.length >= 4 && parts[0] === 'BT') {
          return parts.slice(0, 3).join('-');
        }
        return undefined;
      };

      // 既存SF IDを照会 → 次のSFコードを決定
      const { data: existingSfs } = await supabase
        .from('system_functions')
        .select('id')
        .eq('project_id', resolvedProjectId);
      const existingSfIds = (existingSfs || []).map((sf: any) => sf.id as string);
      const sfCode = getNextSfId(normalizedDomainId, existingSfIds);
      const sfSeq = sfCode.split('-')[2] || '0001';

      // SF名・説明の決定（ループ外・15字以内）
      const rawSfNameCandidate = additionalContext?.trim()
        || `${(resolvedBrs[0] as any).title || (resolvedBrs[0] as any).requirement}機能`;
      const brSummariesForName = resolvedBrs
        .map((br: any) => br.title || br.requirement)
        .filter(Boolean)
        .slice(0, 5);
      let sfNameFromLlm: string | null = null;
      const sfDescription =
        resolvedBrs.map((br: any) => br.title || br.requirement).join('・') + 'を実現する機能';

      // 既存SF照会（isCommitted判定用）
      const { data: existingSf } = await supabase
        .from('system_functions')
        .select('id')
        .eq('id', sfCode)
        .eq('project_id', resolvedProjectId)
        .maybeSingle();

      const buildAcTitle = (ac: { title?: string; then: string; when: string; given: string }) => {
        const source = (ac.title || ac.then || ac.when || ac.given || '').trim();
        if (source.length <= 40) return source;
        return `${source.slice(0, 40)}...`;
      };

      const compactSfName = (value: string) => {
        const base = value.trim().replace(/[「」]/g, '');
        if (!base) return '';
        let candidate = base;
        if (candidate.length > 15) {
          candidate = candidate.replace(/(機能|システム|管理|処理|対応|連携)$/g, '');
        }
        if (candidate.length > 15) {
          candidate = candidate.replace(/[・／/\\（）()]/g, '');
        }
        if (candidate.length > 15) {
          candidate = candidate.replace(/[のにをとや・]/g, '');
        }
        if (candidate.length > 15) {
          candidate = candidate.slice(0, 15);
        }
        return candidate || base.slice(0, 15);
      };

      // ループ内：各BR → LLM → SR 1件 を収集
      const allSrs: any[] = [];

      for (let i = 0; i < resolvedBrs.length; i++) {
        const br = resolvedBrs[i] as any;
        const brId = br.id ?? br.code ?? `br-draft-${i + 1}`;
        const taskId =
          br.task_id ??
          br.business_task_id ??
          br.business_task?.id ??
          br.business_task?.task_id ??
          deriveTaskIdFromBrId(brId);

        // LLMでSR/ACを生成
        const llmPrompt = `
以下の業務要件（BR）から、システム要件（SR）と受入基準（AC）を生成してください。
同時に、このBR群全体を要約するSF名も提案してください。

【業務要件】
- ID: ${brId}
- 要件: ${br.title || br.requirement}
- 根拠: ${br.rationale || br.goal}

【SF名の参考（BR一覧・最大5件）】
${brSummariesForName.map((text) => `- ${text}`).join('\n')}

【BRの性質の理解】
このBRがケイパビリティ（〜できること）として記述されている場合：
- SRはその能力をシステムがどう実現するかを具体的に記述する
- 制約はSR summaryの中に短く含める（別要件にしない）
- ACは正常系と異常系を含める

このBRがコンプライアンス/リスク管理として記述されている場合：
- SRは検証・制御・拒否・監査を中心に記述する
- ACは境界値や例外ケース、拒否時の挙動、監査ログの記録を含める

【技術スタック】
${pr?.tech_stack_profile || 'Next.js + TypeScript'}

【出力形式（JSON）】
{
  "sf_name": "SF名（15文字以内の名詞句）",
  "sr": {
    "title": "システム要件の短いタイトル（20〜40文字程度）",
    "summary": "システムで実現すべき具体的な機能（100〜200文字）",
    "rationale": "なぜこのシステム要件が必要か"
  },
  "acs": [
    {
      "title": "受入基準の短いタイトル（20〜40文字程度）",
      "given": "前提条件（具体的に）",
      "when": "ユーザーアクション（具体的に）",
      "then": "期待される結果（具体的に）"
    }
  ]
}

【生成ルール】
- sf_name は15文字以内、名詞句で簡潔にする（省略記号「…」は禁止）
- sf_name は「機能」「システム」など冗長語を付けない
- SR title は短く具体的に（例: 「月次連結パッケージの入力・確定管理」）
- SR summary は具体的なシステム機能として記述（例: 「〇〇画面で△△を入力・保存できる」）
- BRがケイパビリティの場合：SRは「〜機能を提供する」形式を優先
- BRがコンプライアンスの場合：SRは「〜を検証/制御/拒否する」形式を優先
- AC は Given-When-Then 形式で具体的に記述
- AC は正常系・異常系を含めて2-3個生成
- 技術的な実現可能性を考慮する
`;

        const llmResponse = await callOpenAI<{
          sf_name?: string;
          sr: {
            title?: string;
            summary?: string;
            requirement?: string;
            rationale: string;
          };
          acs: Array<{
            title?: string;
            given: string;
            when: string;
            then: string;
          }>;
        }>({
          systemPrompt: 'あなたはシステム設計の専門家です。業務要件からシステム要件と受入基準を生成します。',
          userPrompt: llmPrompt,
          jsonMode: true,
          provider: llmOptions.provider,
          model: llmOptions.model,
          temperature: llmOptions.temperature,
          baseUrl: llmOptions.baseUrl,
          verbosity: llmOptions.verbosity,
          maxTokens: 2000,
          timeoutMs: 180000,
        });

        const llmContent = llmResponse.content;
        const sfNameCandidate = (llmContent.sf_name || '').trim();
        if (!sfNameFromLlm && sfNameCandidate.length > 0) {
          sfNameFromLlm = sfNameCandidate;
        }
        const srSummary = llmContent.sr.summary || llmContent.sr.requirement || '';
        const srTitle =
          llmContent.sr.title ||
          (srSummary.length > 0 ? srSummary.split(/。|\n/)[0]?.slice(0, 40) : 'システム要件');

        // SR コード：各BRが連番になる
        const srCode = `SR-${normalizedDomainId}-${sfSeq}-${String(i + 1).padStart(4, '0')}`;

        allSrs.push({
          code: srCode,
          type: 'function',
          title: srTitle,
          summary: srSummary,
          requirement: srSummary,
          rationale: llmContent.sr.rationale,
          task_id: taskId,
          project_id: resolvedProjectId,
          srf_ids: [sfCode],
          system_domain_ids: systemDomainId ? [systemDomainId] : [],
          businessRequirementIds: [brId],
          acs: llmContent.acs.map((ac: any, acIndex: number) => ({
            code: `AC-${srCode}-${String(acIndex + 1).padStart(3, '0')}`,
            title: buildAcTitle(ac),
            given: ac.given,
            when: ac.when,
            then: ac.then,
          })),
        });
      }

      const fallbackSfName = compactSfName(rawSfNameCandidate);
      const normalizedSfName = compactSfName((sfNameFromLlm || '').trim());
      const sfName = normalizedSfName.length > 0
        ? normalizedSfName
        : (fallbackSfName || `SF-${sfSeq}`);

      sfDrafts.push({
        code: sfCode,
        name: sfName,
        description: sfDescription,
        system_domain_id: systemDomainId,
        project_id: resolvedProjectId,
        isCommitted: Boolean(existingSf?.id),
        srs: allSrs,
      });

      // 6. realizesリンクを生成（全BRが同じ1つのSFに紐付）
      const realizesLinks = resolvedBrs.map((br: any) => ({
        source_id: br.id ?? br.code ?? `br-draft-unknown`,
        target_id: 'sf-draft-0',
        link_type: 'realizes',
      }));

      // 7. 未確定事項を抽出
      const uncertainties: string[] = [];
      if (!pr?.tech_stack_profile) {
        uncertainties.push('技術スタックが未設定です');
      }
      if (!brs || brs.length === 0) {
        if (allowDraft || brDrafts?.length) {
          uncertainties.push('業務要件が未確定のため、内容は草案として扱われます');
        }
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
