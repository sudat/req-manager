import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { callOpenAI } from '@/lib/mastra/utils/llm-helpers';
import { resolveProjectLlmRuntimeSettings } from '@/lib/mastra/utils/llm-settings';
import { DD_TYPE_LABELS } from '@/lib/domain/enums';
import type { DdType, EntryPoint } from '@/lib/domain';

const DD_TYPES = [
  'screen',
  'api',
  'batch',
  'external_if',
  'model',
  'report',
  'job',
] as const;

const llmOutputSchema = z.object({
  dd_drafts: z.array(z.object({
    type: z.enum(DD_TYPES),
    name: z.string().min(1),
    summary: z.string().min(1),
    design_policy: z.string().optional(),
    details: z.record(z.string(), z.any()).optional(),
    entry_point_slug: z.string().optional(),
  })).min(1),
  uncertainties: z.array(z.string()).optional(),
});

type LlmDdDraft = z.infer<typeof llmOutputSchema>['dd_drafts'][number];

type SrItem = {
  id: string;
  title?: string | null;
  summary?: string | null;
  requirement?: string | null;
  category?: string | null;
};

const slugify = (value: string) => {
  const normalized = value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
  return normalized;
};

const ensureUniqueSlug = (slug: string, used: Set<string>) => {
  let candidate = slug;
  let index = 2;
  while (!candidate || used.has(candidate)) {
    candidate = `${slug || 'dd'}-${index}`;
    index += 1;
  }
  used.add(candidate);
  return candidate;
};

const buildEntryPointPath = (type: DdType, slug: string) => {
  switch (type) {
    case 'screen':
      return `app/(with-sidebar)/${slug}/page.tsx`;
    case 'api':
      return `app/api/${slug}/route.ts`;
    case 'batch':
      return `scripts/batch/${slug}.ts`;
    case 'external_if':
      return `app/api/integrations/${slug}/route.ts`;
    case 'model':
      return `lib/models/${slug}.ts`;
    case 'report':
      return `app/reports/${slug}/page.tsx`;
    case 'job':
      return `scripts/jobs/${slug}.ts`;
    default:
      return `app/${slug}`;
  }
};

const deriveFallbackTypes = (srs: SrItem[], inputText?: string): DdType[] => {
  const sourceText = [
    ...srs.map((sr) => `${sr.title ?? ''} ${sr.summary ?? sr.requirement ?? ''}`),
    inputText ?? '',
  ]
    .join(' ')
    .toLowerCase();

  const has = (keywords: string[]) => keywords.some((kw) => sourceText.includes(kw));

  const types: DdType[] = [];
  if (has(['画面', 'ui', '入力', '一覧', '検索', '照会', '画'])) types.push('screen');
  if (has(['api', 'エンドポイント', '連携', '送信', '受信'])) types.push('api');
  if (has(['バッチ', '集計', '一括', '夜間', '締め'])) types.push('batch');
  if (has(['外部', 'i/f', 'if', 'インターフェース', '連携'])) types.push('external_if');
  if (has(['モデル', 'db', 'テーブル', 'マスタ', 'データ構造'])) types.push('model');
  if (has(['帳票', 'レポート', 'report', 'pdf', '出力'])) types.push('report');
  if (has(['ジョブ', 'job', 'キュー', '非同期', 'バックグラウンド'])) types.push('job');

  const unique = Array.from(new Set(types));
  if (unique.length === 0) return ['screen', 'api'];
  if (unique.length === 1) return [...unique, 'api'];
  return unique.slice(0, 5);
};

const buildFallbackDrafts = (
  sfName: string,
  sfId: string,
  startNumber: number,
  srs: SrItem[],
  inputText?: string,
  projectId?: string
) => {
  const types = deriveFallbackTypes(srs, inputText);
  const usedSlugs = new Set<string>();

  return types.map((type, index) => {
    const seq = String(startNumber + index).padStart(3, '0');
    const id = `DD-${sfId}-${seq}`;
    const label = DD_TYPE_LABELS[type] ?? type;
    const name = `${sfName}${label}`;
    const summary = `${sfName}の${label}設計`;
    const baseSlug = slugify(`${sfId}-${type}`) || slugify(label) || `dd-${seq}`;
    const slug = ensureUniqueSlug(baseSlug, usedSlugs);
    const entryPoints: EntryPoint[] = [
      {
        path: buildEntryPointPath(type, slug),
        type,
        responsibility: summary,
      },
    ];

    return {
      id,
      code: id,
      srfId: sfId,
      name,
      type,
      summary,
      entryPoints,
      designPolicy: inputText ?? '',
      details: {
        related_srs: srs.map((sr) => sr.id),
        note: 'LLM出力が取得できなかったため簡易草案を生成しました。',
      },
      project_id: projectId,
    };
  });
};

/**
 * dd_draft Tool
 *
 * DD（Design Document）の草案を生成する
 */
export const ddDraftTool = createTool({
  id: 'dd_draft',
  description: `システム機能（SF）からDD（Design Document）の草案を生成するツールです。

【使用タイミング】
- ユーザーが「DDを生成して」「実装単位SDを作成して」「設計書を作って」などと言った場合
- ユーザーがSF IDを指定した場合（例: 「SF-AP-0002からDDを作成して」）

【入力パラメータ】
- sfId: SF ID（例: "SF-AP-0002"）
- naturalLanguageInput: 追加の設計上の要望（オプション）

【出力】
- DD草案（複数件）
- SF配下のSRを考慮した設計内容
- entry_pointは命名規則に従って自動生成

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
    ddDrafts: z.array(z.object({
      id: z.string(),
      code: z.string().optional(),
      srfId: z.string(),
      name: z.string(),
      type: z.enum(DD_TYPES),
      summary: z.string(),
      entryPoints: z.array(z.object({
        path: z.string(),
        type: z.string().nullable().optional(),
        responsibility: z.string().nullable().optional(),
      })),
      designPolicy: z.string().optional(),
      details: z.record(z.string(), z.any()).optional(),
      project_id: z.string().optional(),
    })),
    uncertainties: z.array(z.string()).optional(),
    previewAvailable: z.boolean(),
  }),
  execute: async (inputData) => {
    const { sfId, naturalLanguageInput, projectId, sfName, allowDraft } = inputData;

    try {
      // 1. SF情報を取得
      const { data: sf } = await supabase
        .from('system_functions')
        .select('id, title, summary, system_domain:system_domains(project_id)')
        .eq('id', sfId)
        .maybeSingle();

      const resolvedSf = sf ? (sf as any) : null;
      if (!resolvedSf && !projectId) {
        throw new Error('システム機能が見つかりません');
      }

      const sfData = resolvedSf ?? {
        id: sfId,
        title: sfName ?? sfId,
        summary: '',
        system_domain: { project_id: projectId },
      };

      const sfNameValue = sfData.title;
      const sfIdValue = sfData.id;
      const sfSummaryValue = sfData.summary ?? '';

      // 2. プロジェクト設定を取得
      const resolvedProjectId = sfData.system_domain?.project_id ?? projectId;
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

      const { data: pr } = await supabase
        .from('product_requirements')
        .select('tech_stack_profile, coding_conventions')
        .eq('project_id', resolvedProjectId)
        .single();

      // 3. SR一覧を取得（SFに紐づくSR）
      const { data: srs } = await supabase
        .from('system_requirements')
        .select('id, title, summary, requirement, category')
        .contains('srf_ids', [sfIdValue]);

      const srList: SrItem[] = (srs ?? []) as SrItem[];
      const srLines = srList.length > 0
        ? srList.map((sr) => {
          const title = sr.title || sr.summary || sr.requirement || '';
          const category = sr.category || 'function';
          return `- ${sr.id}: ${title} (${category})`;
        }).join('\n')
        : '- (関連SRなし)';

      // 4. 既存DDの最大番号を取得
      const { data: existingDocs } = await supabase
        .from('design_documents')
        .select('id')
        .eq('srf_id', sfIdValue);

      const existingNumbers = (existingDocs ?? [])
        .map((doc: { id?: string }) => {
          if (!doc?.id) return null;
          const match = doc.id.match(/(\d{3})$/);
          return match ? parseInt(match[1], 10) : null;
        })
        .filter((value): value is number => typeof value === 'number' && !Number.isNaN(value));

      const startNumber = existingNumbers.length > 0
        ? Math.max(...existingNumbers) + 1
        : 1;

      // 5. LLMでDD草案を生成
      const llmPrompt = `
以下のシステム機能（SF）と関連SRをもとに、DD（Design Document）の草案を複数作成してください。

【システム機能】
- ID: ${sfIdValue}
- 名称: ${sfNameValue}
- 概要: ${sfSummaryValue || '未設定'}

【関連SR一覧】
${srLines}

【追加要望】
${naturalLanguageInput || 'なし'}

【技術スタック】
${pr?.tech_stack_profile || 'Next.js + TypeScript'}

【DD種別の定義】
- screen: 画面/UI。ユーザー操作や入力・一覧・詳細などのUI設計
- api: アプリ内API。画面や他機能から呼び出す同期/非同期API設計
- batch: 定期バッチ。夜間/締め処理などスケジュール実行される一括処理
- job: 非同期ジョブ。イベント/キュー起動で実行するバックグラウンド処理
- external_if: 外部I/F。外部システム連携（送受信、マッピング、認証など）
- model: データモデル。テーブル/集計ビュー/ドメインモデルの設計
- report: レポート/帳票。PDF/CSVなどの出力設計

【出力形式（JSON）】
{
  "dd_drafts": [
    {
      "type": "screen | api | batch | job | external_if | model | report",
      "name": "DD名（短く具体的に）",
      "summary": "DDの概要（1-2文）",
      "design_policy": "設計方針（必要なら）",
      "details": {
        "related_srs": ["SR-..."],
        "scope": "対象範囲",
        "inputs": ["入力"],
        "outputs": ["出力"],
        "data_flow": "データフロー",
        "constraints": ["制約"],
        "notes": "補足"
      },
      "entry_point_slug": "entry-point用の英数字slug（任意）"
    }
  ],
  "uncertainties": ["不確定事項"]
}

【生成ルール】
- SRを十分に考慮し、details.related_srs に関連するSR IDを必ず入れる
- 1つのSFに対して2〜6件のDDを作る（画面/API/バッチ/外部I/F等を組み合わせる）
- 各DDは1つの種別のみ
- できるだけ重複しない粒度で分割する
- 入力が不足する場合はuncertaintiesに記載する
`;

      const llmResponse = await callOpenAI<{ dd_drafts: LlmDdDraft[]; uncertainties?: string[] }>({
        systemPrompt: 'あなたはシステム設計の専門家です。SF/SRから複数のDD草案を生成します。',
        userPrompt: llmPrompt,
        jsonMode: true,
        provider: llmOptions.provider,
        model: llmOptions.model,
        temperature: llmOptions.temperature,
        baseUrl: llmOptions.baseUrl,
        verbosity: llmOptions.verbosity,
        maxTokens: 2400,
        timeoutMs: 180000,
      });

      const parsed = llmOutputSchema.safeParse(llmResponse.content);
      const usedSlugs = new Set<string>();

      const ddDrafts = parsed.success
        ? parsed.data.dd_drafts.map((draft, index) => {
          const seq = String(startNumber + index).padStart(3, '0');
          const id = `DD-${sfIdValue}-${seq}`;
          const slugHint = draft.entry_point_slug ?? draft.name;
          const baseSlug = slugify(slugHint) || slugify(`${sfIdValue}-${draft.type}`) || `dd-${seq}`;
          const slug = ensureUniqueSlug(baseSlug, usedSlugs);
          const entryPoints: EntryPoint[] = [
            {
              path: buildEntryPointPath(draft.type, slug),
              type: draft.type,
              responsibility: draft.summary ?? null,
            },
          ];
          const details = draft.details ?? {};
          if (!Array.isArray((details as any).related_srs) && srList.length > 0) {
            (details as any).related_srs = srList.map((sr) => sr.id);
          }

          return {
            id,
            code: id,
            srfId: sfIdValue,
            name: draft.name,
            type: draft.type,
            summary: draft.summary,
            entryPoints,
            designPolicy: draft.design_policy ?? '',
            details,
            project_id: resolvedProjectId,
          };
        })
        : buildFallbackDrafts(sfNameValue, sfIdValue, startNumber, srList, naturalLanguageInput, resolvedProjectId);

      const uncertainties: string[] = [];
      if (!pr?.tech_stack_profile) {
        uncertainties.push('技術スタックが未設定です');
      }
      if (!pr?.coding_conventions) {
        uncertainties.push('コーディング規約が未設定です');
      }
      if (srList.length === 0) {
        uncertainties.push('関連SRが未登録のため、DD草案は推定で作成しています');
      }
      if (!resolvedSf && (allowDraft || projectId)) {
        uncertainties.push('システム機能が未確定のため、内容は草案として扱われます');
      }
      if (parsed.success && parsed.data.uncertainties?.length) {
        uncertainties.push(...parsed.data.uncertainties);
      }

      return {
        ddDrafts,
        uncertainties,
        previewAvailable: true,
      };
    } catch (error: any) {
      throw new Error(`DD草案生成に失敗: ${error.message}`);
    }
  },
});
