import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { toolSuccess, toolError } from '@/lib/mastra/utils/tool-helpers';

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
  business_task_id: z.string(),
  project_id: z.string().optional(),
  code: z.string(),
  requirement: z.string(),
  rationale: z.string(),
  concept_ids: z.array(z.string()).optional(),
});

// System Function (SF) コンテンツスキーマ
const sfContentSchema = z.object({
  system_domain_id: z.string(),
  project_id: z.string().optional(),
  code: z.string(),
  name: z.string(),
  description: z.string(),
  concept_ids: z.array(z.string()).optional(),
});

// System Requirement (SR) コンテンツスキーマ
const srContentSchema = z.object({
  system_function_id: z.string(),
  project_id: z.string().optional(),
  code: z.string(),
  type: z.string(),
  requirement: z.string(),
  rationale: z.string(),
  concept_ids: z.array(z.string()).optional(),
});

// Acceptance Criteria (AC) コンテンツスキーマ
const acContentSchema = z.object({
  system_requirement_id: z.string(),
  project_id: z.string().optional(),
  code: z.string(),
  given: z.string(),
  when: z.string(),
  then: z.string(),
});

// Implementation Unit (IU) コンテンツスキーマ
const implUnitContentSchema = z.object({
  system_function_id: z.string(),
  project_id: z.string().optional(),
  code: z.string(),
  name: z.string(),
  entry_point: z.string(),
  design_notes: z.string().optional(),
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
    type: z.enum(['bt', 'br', 'sf', 'sr', 'ac', 'impl_unit']),
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
          const projectId = v.project_id ?? (await resolveProjectId('business_tasks', v.business_task_id));
          const row = {
            business_task_id: v.business_task_id,
            code: v.code,
            requirement: v.requirement,
            rationale: v.rationale,
            concept_ids: toTextArrayOrEmpty(v.concept_ids),
            ...(projectId ? { project_id: projectId } : {}),
            created_at: now,
            updated_at: now,
          };
          const inserted = await insertRow('business_requirements', row);
          return inserted?.id;
        },
        sf: async () => {
          const v = sfContentSchema.parse(content);
          const projectId = v.project_id ?? (await resolveProjectId('system_domains', v.system_domain_id));
          const row = {
            system_domain_id: v.system_domain_id,
            code: v.code,
            name: v.name,
            description: v.description,
            concept_ids: toTextArrayOrEmpty(v.concept_ids),
            ...(projectId ? { project_id: projectId } : {}),
            created_at: now,
            updated_at: now,
          };
          const inserted = await insertRow('system_functions', row);
          return inserted?.id;
        },
        sr: async () => {
          const v = srContentSchema.parse(content);
          const projectId = v.project_id ?? (await resolveProjectId('system_functions', v.system_function_id));
          const row = {
            system_function_id: v.system_function_id,
            code: v.code,
            type: v.type,
            requirement: v.requirement,
            rationale: v.rationale,
            concept_ids: toTextArrayOrEmpty(v.concept_ids),
            ...(projectId ? { project_id: projectId } : {}),
            created_at: now,
            updated_at: now,
          };
          const inserted = await insertRow('system_requirements', row);
          return inserted?.id;
        },
        ac: async () => {
          const v = acContentSchema.parse(content);
          const projectId = v.project_id ?? (await resolveProjectId('system_requirements', v.system_requirement_id));
          const row = {
            system_requirement_id: v.system_requirement_id,
            code: v.code,
            given_text: v.given,
            when_text: v.when,
            then_text: v.then,
            ...(projectId ? { project_id: projectId } : {}),
            created_at: now,
            updated_at: now,
          };
          const inserted = await insertRow('acceptance_criteria', row);
          return inserted?.id;
        },
        impl_unit: async () => {
          const v = implUnitContentSchema.parse(content);
          const projectId = v.project_id ?? (await resolveProjectId('system_functions', v.system_function_id));
          const row = {
            system_function_id: v.system_function_id,
            code: v.code,
            name: v.name,
            entry_point: v.entry_point,
            design_notes: v.design_notes ?? null,
            ...(projectId ? { project_id: projectId } : {}),
            created_at: now,
            updated_at: now,
          };
          const inserted = await insertRow('impl_unit_sds', row);
          return inserted?.id;
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
          case 'impl_unit':
            return `✅ 実装単位を登録しました\n\n**ID: ${displayId}**\n名前: ${content.name ?? '未設定'}`;
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
