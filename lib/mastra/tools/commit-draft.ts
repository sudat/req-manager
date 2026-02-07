import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { toolSuccess, toolError } from '@/lib/mastra/utils/tool-helpers';
import { createRequirementLinks } from '@/lib/data/requirement-links';

/**
 * ドラフトタイプごとのコンテンツスキーマ定義
 */

// Business Task (BT) コンテンツスキーマ
const btContentSchema = z.object({
  business_area: z.string(),
  project_id: z.string(),
  code: z.string(),
  name: z.string(),
  summary: z.string().optional(),
  businessContext: z.string().optional(),
  processSteps: z.array(z.object({
    when: z.string(),
    who: z.string(),
    action: z.string(),
  })).optional(),
  input: z.array(z.object({
    name: z.string(),
    source: z.string(),
  })).optional(),
  output: z.array(z.object({
    name: z.string(),
    source: z.string(),
  })).optional(),
  concepts: z.array(z.string()).optional(),
  conceptIdsYaml: z.string().optional(),
  person: z.string().optional(),
  sort_order: z.number().optional(),
});

// Business Requirement (BR) コンテンツスキーマ
const brContentSchema = z.object({
  business_task_id: z.string().optional(),
  task_id: z.string().optional(),
  project_id: z.string().optional(),
  code: z.string(),
  requirement: z.string(),
  rationale: z.string().optional(),
  concept_ids: z.array(z.string()).optional(),
}).superRefine((value, ctx) => {
  if (!value.business_task_id && !value.task_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'business_task_id または task_id を指定してください',
      path: ['business_task_id'],
    });
  }
});

// System Function (SF) コンテンツスキーマ
const sfContentSchema = z.object({
  system_domain_id: z.string().optional(),
  project_id: z.string().optional(),
  code: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string().optional(),
  status: z.string().optional(),
  related_task_ids: z.array(z.string()).optional(),
  requirement_ids: z.array(z.string()).optional(),
  system_design: z.array(z.any()).optional(),
  entry_points: z.array(z.any()).optional(),
  code_refs: z.array(z.any()).optional(),
  design_policy: z.string().optional(),
  sort_order: z.number().optional(),
  brIds: z.array(z.string()).optional(),
});

// System Requirement (SR) コンテンツスキーマ
const srContentSchema = z.object({
  task_id: z.string().optional(),
  business_task_id: z.string().optional(),
  system_function_id: z.string().optional(),
  project_id: z.string().optional(),
  code: z.string(),
  title: z.string().optional(),
  summary: z.string().optional(),
  type: z.string().optional(),
  requirement: z.string(),
  rationale: z.string().optional(),
  concept_ids: z.array(z.string()).optional(),
  impacts: z.array(z.string()).optional(),
  srf_ids: z.array(z.string()).optional(),
  system_domain_ids: z.array(z.string()).optional(),
  businessRequirementIds: z.array(z.string()).optional(),
  acs: z.array(z.object({
    code: z.string(),
    title: z.string().optional(),
    given: z.string(),
    when: z.string(),
    then: z.string(),
  })).optional(),
}).superRefine((value, ctx) => {
  if (!value.task_id && !value.business_task_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'task_id または business_task_id を指定してください',
      path: ['task_id'],
    });
  }
});

// Acceptance Criteria (AC) コンテンツスキーマ
const acContentSchema = z.object({
  system_requirement_id: z.string(),
  project_id: z.string().optional(),
  code: z.string(),
  title: z.string().optional(),
  given: z.string(),
  when: z.string(),
  then: z.string(),
});

// Design Document (DD) コンテンツスキーマ
const ddContentSchema = z.object({
  id: z.string().optional(),
  code: z.string().optional(),
  srfId: z.string().optional(),
  srf_id: z.string().optional(),
  project_id: z.string().optional(),
  name: z.string(),
  type: z.string().optional(),
  summary: z.string().optional(),
  entryPoints: z.array(z.object({
    path: z.string(),
    type: z.string().optional().nullable(),
    responsibility: z.string().optional().nullable(),
  })).optional(),
  entry_points: z.array(z.object({
    path: z.string(),
    type: z.string().optional().nullable(),
    responsibility: z.string().optional().nullable(),
  })).optional(),
  designPolicy: z.string().optional(),
  design_policy: z.string().optional(),
  details: z.record(z.string(), z.any()).optional(),
}).superRefine((value, ctx) => {
  if (!value.id && !value.code) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'id または code を指定してください',
      path: ['id'],
    });
  }
  if (!value.srfId && !value.srf_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'srfId または srf_id を指定してください',
      path: ['srfId'],
    });
  }
});

/**
 * commit_draft Tool
 *
 * 草案を正本に登録する（確定操作）
 */
export const commitDraftTool = createTool({
  id: 'commit_draft',
  description: '草案を正本に登録する（確定操作）',
  inputSchema: z.object({
    draftId: z.string(),
    type: z.enum(['bt', 'br', 'sf', 'sr', 'ac', 'dd', 'impl_unit']),
    content: z.any(), // 実行時にtypeに応じてバリデーション
  }),
  execute: async (inputData) => {
    const { draftId, type, content } = inputData;

    try {
      const isPlainObject = (value: unknown): value is Record<string, unknown> =>
        typeof value === 'object' && value !== null && !Array.isArray(value);

      if (!isPlainObject(content)) {
        return toolError(
          'Invalid content payload',
          '草案の内容が不正です。草案データを確認してください。'
        );
      }

      const now = new Date().toISOString();

      const shouldRetryWithoutProjectId = (error: any) => {
        const message = `${error?.message ?? ''} ${error?.details ?? ''}`.toLowerCase();
        return message.includes('project_id') && message.includes('does not exist');
      };

      const normalizeSystemRequirementCategory = (value?: string) => {
        if (
          value === 'function' ||
          value === 'data' ||
          value === 'exception' ||
          value === 'non_functional'
        ) {
          return value;
        }
        if (value === 'functional') return 'function';
        if (value === 'auth') return 'non_functional';
        return 'function';
      };

      const buildAcceptanceDescription = (ac: { given: string; when: string; then: string }) =>
        `Given ${ac.given} When ${ac.when} Then ${ac.then}`;

      const buildAcceptanceTitle = (ac: { title?: string; given: string; when: string; then: string }) => {
        const candidate = (ac.title || ac.then || ac.when || ac.given || '').trim();
        return candidate || buildAcceptanceDescription(ac);
      };

      const buildSystemRequirementTitle = (text: string) => {
        const trimmed = text.trim();
        const firstSentence = trimmed.split(/。|\n/)[0]?.trim();
        const base = firstSentence || trimmed;
        if (base.length <= 40) return base;
        return `${base.slice(0, 40)}...`;
      };

      const toTextArrayOrEmpty = (value?: string[] | null) => {
        if (!value) return [];
        return Array.isArray(value) ? value : [String(value)];
      };

      const insertRow = async (table: string, row: Record<string, any>) => {
        let { data, error } = await supabase
          .from(table)
          .upsert(row, { onConflict: 'id' })
          .select('id')
          .maybeSingle();

        if (error && shouldRetryWithoutProjectId(error) && 'project_id' in row) {
          const { project_id: _projectId, ...rest } = row;
          ({ data, error } = await supabase
            .from(table)
            .upsert(rest, { onConflict: 'id', ignoreDuplicates: true })
            .select('id')
            .maybeSingle());
        }

        if (error) throw error;
        return data ?? { id: row.id };
      };

      const resolveProjectId = async (table: string, id: string) => {
        try {
          const { data } = await supabase
            .from(table)
            .select('project_id')
            .eq('id', id)
            .maybeSingle();
          return data?.project_id ?? undefined;
        } catch {
          return undefined;
        }
      };

      // タイプ別ハンドラー（バリデーション＋行生成＋DB挿入）
      const draftHandlers: Record<string, () => Promise<string | undefined>> = {
        bt: async () => {
          const v = btContentSchema.parse(content);
          const row = {
            business_area: v.business_area,
            project_id: v.project_id,
            id: v.code,
            name: v.name,
            summary: v.summary ?? null,
            business_context: v.businessContext ?? null,
            process_steps: v.processSteps ?? null,
            input: v.input ?? null,
            output: v.output ?? null,
            concepts: toTextArrayOrEmpty(v.concepts),
            concept_ids_yaml: v.conceptIdsYaml ?? null,
            person: v.person ?? null,
            sort_order: v.sort_order ?? 0,
            created_at: now,
            updated_at: now,
          };
          const inserted = await insertRow('business_tasks', row);
          return inserted?.id ?? v.code;
        },
        br: async () => {
          const v = brContentSchema.parse(content);
          const taskId = v.task_id ?? v.business_task_id;
          if (!taskId) {
            throw new Error('business_task_id または task_id が必要です');
          }
          const projectId = v.project_id ?? (await resolveProjectId('business_tasks', taskId));
          if (!projectId) {
            throw new Error('project_id が取得できません');
          }
          const goal = v.rationale
            ? `${v.requirement}\n\n理由: ${v.rationale}`
            : v.requirement;
          const row = {
            id: v.code,
            task_id: taskId,
            title: v.requirement,
            goal,
            constraints: null,
            owner: null,
            concept_ids: toTextArrayOrEmpty(v.concept_ids),
            srf_ids: [],
            system_domain_ids: [],
            impacts: [],
            sort_order: 0,
            project_id: projectId,
            created_at: now,
            updated_at: now,
          };
          const inserted = await insertRow('business_requirements', row);
          return inserted?.id;
        },
        sf: async () => {
          const v = sfContentSchema.parse(content);
          const projectId = v.project_id ?? (v.system_domain_id ? await resolveProjectId('system_domains', v.system_domain_id) : undefined);
          if (!projectId) {
            throw new Error('project_id が取得できません');
          }
	          const row = {
	            id: v.code,
	            system_domain_id: v.system_domain_id ?? null,
	            category: v.category ?? 'screen',
	            title: v.name,
	            summary: v.description,
	            status: v.status ?? 'not_implemented',
	            related_task_ids: toTextArrayOrEmpty(v.related_task_ids),
	            requirement_ids: toTextArrayOrEmpty(v.requirement_ids),
	            system_design: v.system_design ?? [],
	            code_refs: v.code_refs ?? [],
	            entry_points: v.entry_points ?? [],
	            design_policy: v.design_policy ?? '',
	            sort_order: v.sort_order ?? 0,
	            project_id: projectId,
	            created_at: now,
            updated_at: now,
          };
          const inserted = await insertRow('system_functions', row);

          // BR→SF realizes リンクを作成
          if (v.brIds && v.brIds.length > 0 && projectId) {
            const links = v.brIds.map((brId) => ({
              sourceType: 'br' as const,
              sourceId: brId,
              targetType: 'sf' as const,
              targetId: v.code,
              linkType: 'realizes',
              projectId,
            }));
            await createRequirementLinks(links);
            console.log('[commit_draft] Created realizes links:', links.map(l => `${l.sourceId} → ${l.targetId}`));
          }

          return inserted?.id;
        },
        sr: async () => {
          const v = srContentSchema.parse(content);
          const taskId = v.task_id ?? v.business_task_id;
          if (!taskId) {
            throw new Error('task_id が必要です');
          }
          const projectId = v.project_id ?? (await resolveProjectId('business_tasks', taskId));
          if (!projectId) {
            throw new Error('project_id が取得できません');
          }
          const srfIds =
            v.srf_ids ??
            (v.system_function_id ? [v.system_function_id] : []);
          const title = v.title ?? buildSystemRequirementTitle(v.requirement);
          const summary = v.summary ?? v.requirement;
          const row = {
            id: v.code,
            task_id: taskId,
            srf_ids: srfIds,
            title,
            summary,
            concept_ids: toTextArrayOrEmpty(v.concept_ids),
            impacts: toTextArrayOrEmpty(v.impacts),
            system_domain_ids: v.system_domain_ids ?? [],
            category: normalizeSystemRequirementCategory(v.type),
            acceptance_criteria: [],
            acceptance_criteria_json: [],
            sort_order: 0,
            project_id: projectId,
            created_at: now,
            updated_at: now,
          };
          const inserted = await insertRow('system_requirements', row);
          const systemRequirementId = inserted?.id ?? v.code;
          if (v.acs && v.acs.length > 0) {
            for (let i = 0; i < v.acs.length; i += 1) {
              const ac = v.acs[i];
              const acRow = {
                id: ac.code,
                system_requirement_id: systemRequirementId,
                project_id: projectId,
                description: buildAcceptanceTitle(ac),
                given_text: ac.given,
                when_text: ac.when,
                then_text: ac.then,
                sort_order: i,
                created_at: now,
                updated_at: now,
              };
              await insertRow('acceptance_criteria', acRow);
            }
          }

          if (v.businessRequirementIds && v.businessRequirementIds.length > 0) {
            const linkInputs = [];
            const linkKeys = new Set<string>();
            for (const brId of v.businessRequirementIds) {
              const key = `${systemRequirementId}:${brId}`;
              if (linkKeys.has(key)) continue;
              linkKeys.add(key);
              linkInputs.push({
                sourceType: 'sr' as const,
                sourceId: systemRequirementId,
                targetType: 'br' as const,
                targetId: brId,
                linkType: 'derived_from',
                projectId,
              });
            }
            if (linkInputs.length > 0) {
              const { error: linkError } = await createRequirementLinks(linkInputs);
              if (linkError) {
                throw new Error(`requirement_links作成に失敗しました: ${linkError}`);
              }
            }
          }
          return systemRequirementId;
        },
        ac: async () => {
          const v = acContentSchema.parse(content);
          const projectId = v.project_id ?? (await resolveProjectId('system_requirements', v.system_requirement_id));
          if (!projectId) {
            throw new Error('project_id が取得できません');
          }
          const row = {
            system_requirement_id: v.system_requirement_id,
            description: buildAcceptanceTitle(v),
            code: v.code,
            given_text: v.given,
            when_text: v.when,
            then_text: v.then,
            project_id: projectId,
            created_at: now,
            updated_at: now,
          };
          const inserted = await insertRow('acceptance_criteria', row);
          return inserted?.id;
        },
        dd: async () => {
          const v = ddContentSchema.parse(content);
          const ddId = v.id ?? v.code;
          const srfId = v.srfId ?? v.srf_id;
          if (!ddId || !srfId) {
            throw new Error('DDのIDまたはSF IDが不足しています');
          }
          const projectId = v.project_id ?? (await resolveProjectId('system_functions', srfId));
          if (!projectId) {
            throw new Error('project_id が取得できません');
          }
          const entryPoints = v.entryPoints ?? v.entry_points ?? [];
          const row = {
            id: ddId,
            srf_id: srfId,
            name: v.name,
            type: v.type ?? "screen",
            summary: v.summary ?? "",
            entry_points: entryPoints,
            design_policy: v.designPolicy ?? v.design_policy ?? "",
            details: v.details ?? {},
            project_id: projectId,
            created_at: now,
            updated_at: now,
          };
          const inserted = await insertRow('design_documents', row);
          return inserted?.id ?? ddId;
        },
        impl_unit: async () => {
          // backward compatibility: treat impl_unit as dd
          return draftHandlers.dd();
        },
      };

      const handler = draftHandlers[type];
      if (!handler) throw new Error(`Unknown draft type: ${type}`);

      const insertedId = await handler();

      console.log('[commit_draft] Insert succeeded', { type, id: insertedId });

      // タイプ別のメッセージ生成（AIエージェントがIDを認識しやすくする）
      const getSuccessMessage = (t: string, id: string | undefined): string => {
        const displayId = id ?? draftId;
        switch (t) {
          case 'bt':
            return `✅ 業務タスクを登録しました\n\n**ID: ${displayId}**\n名前: ${content.name ?? '未設定'}`;
          case 'br':
            return `✅ 業務要件を登録しました\n\n**ID: ${displayId}**`;
          case 'sf':
            return `✅ システム機能を登録しました\n\n**ID: ${displayId}**\n名前: ${content.name ?? '未設定'}`;
          case 'sr':
            return `✅ システム要件を登録しました\n\n**ID: ${displayId}**`;
          case 'ac':
            return `✅ 受入条件を登録しました\n\n**ID: ${displayId}**`;
          case 'dd':
          case 'impl_unit':
            return `✅ DDを登録しました\n\n**ID: ${displayId}**\n名前: ${content.name ?? '未設定'}`;
          default:
            return `草案を正本に登録しました（${t} ID: ${displayId}）`;
        }
      };

      const message = getSuccessMessage(type, insertedId);
      return toolSuccess(message, {
        id: insertedId ?? draftId,
        type,
      });
    } catch (error: any) {
      console.error('[commit_draft] Error:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
      });
      return toolError(error, '草案の確定に失敗しました');
    }
  },
});
