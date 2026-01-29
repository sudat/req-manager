import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';

/**
 * ドラフトタイプごとのコンテンツスキーマ定義
 */

// Business Task (BT) コンテンツスキーマ
const btContentSchema = z.object({
  business_domain_id: z.string(),
  project_id: z.string(),
  code: z.string(),
  name: z.string(),
  summary: z.string().optional(),
  businessContext: z.string().optional(),
  processSteps: z.array(z.string()).optional(),
  input: z.array(z.string()).optional(),
  output: z.array(z.string()).optional(),
  concepts: z.array(z.string()).optional(),
  conceptIdsYaml: z.string().optional(),
  person: z.string().optional(),
  sort_order: z.number().optional(),
});

// Business Requirement (BR) コンテンツスキーマ
const brContentSchema = z.object({
  business_task_id: z.string(),
  code: z.string(),
  requirement: z.string(),
  rationale: z.string(),
  concept_ids: z.array(z.string()).optional(),
});

// System Function (SF) コンテンツスキーマ
const sfContentSchema = z.object({
  system_domain_id: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string(),
  concept_ids: z.array(z.string()).optional(),
});

// System Requirement (SR) コンテンツスキーマ
const srContentSchema = z.object({
  system_function_id: z.string(),
  code: z.string(),
  type: z.string(),
  requirement: z.string(),
  rationale: z.string(),
  concept_ids: z.array(z.string()).optional(),
});

// Acceptance Criteria (AC) コンテンツスキーマ
const acContentSchema = z.object({
  system_requirement_id: z.string(),
  code: z.string(),
  given: z.string(),
  when: z.string(),
  then: z.string(),
});

// Implementation Unit (IU) コンテンツスキーマ
const implUnitContentSchema = z.object({
  system_function_id: z.string(),
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
        return {
          success: false,
          error: 'Invalid content payload',
          message: '草案の内容が不正です。草案データを確認してください。',
        };
      }

      const now = new Date().toISOString();

      const shouldRetryWithoutProjectId = (error: any) => {
        const message = `${error?.message ?? ''} ${error?.details ?? ''}`.toLowerCase();
        return message.includes('project_id') && message.includes('does not exist');
      };

      const toNewlineText = (value?: string[] | null) => {
        if (!value) return null;
        if (Array.isArray(value)) return value.join('\n');
        return String(value);
      };

      const toTextArray = (value?: string[] | null) => {
        if (!value) return null;
        return Array.isArray(value) ? value : [String(value)];
      };

      const toTextArrayOrEmpty = (value?: string[] | null) => {
        if (!value) return [];
        return Array.isArray(value) ? value : [String(value)];
      };

      const insertRow = async (table: string, row: Record<string, any>) => {
        let { data, error } = await supabase
          .from(table)
          .upsert(row, { onConflict: 'id', ignoreDuplicates: true })
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

      // タイプに応じてバリデーションを実行
      let validatedContent: any;

      switch (type) {
        case 'bt':
          validatedContent = btContentSchema.parse(content);
          break;
        case 'br':
          validatedContent = brContentSchema.parse(content);
          break;
        case 'sf':
          validatedContent = sfContentSchema.parse(content);
          break;
        case 'sr':
          validatedContent = srContentSchema.parse(content);
          break;
        case 'ac':
          validatedContent = acContentSchema.parse(content);
          break;
        case 'impl_unit':
          validatedContent = implUnitContentSchema.parse(content);
          break;
        default:
          throw new Error(`Unknown draft type: ${type}`);
      }

      let insertedId: string | undefined;

      switch (type) {
        case 'bt': {
          const row = {
            business_id: validatedContent.business_domain_id,
            project_id: validatedContent.project_id,
            id: validatedContent.code,
            name: validatedContent.name,
            summary: validatedContent.summary ?? null,
            business_context: validatedContent.businessContext ?? null,
            process_steps: toNewlineText(validatedContent.processSteps),
            input: toNewlineText(validatedContent.input),
            output: toNewlineText(validatedContent.output),
            concepts: toTextArrayOrEmpty(validatedContent.concepts),
            concept_ids_yaml: validatedContent.conceptIdsYaml ?? null,
            person: validatedContent.person ?? null,
            sort_order: validatedContent.sort_order ?? 0,
            created_at: now,
            updated_at: now,
          };
          const inserted = await insertRow('business_tasks', row);
          insertedId = inserted?.id ?? validatedContent.code;
          break;
        }
        case 'br': {
          const projectId =
            validatedContent.project_id ??
            (await resolveProjectId('business_tasks', validatedContent.business_task_id));
          const row = {
            business_task_id: validatedContent.business_task_id,
            code: validatedContent.code,
            requirement: validatedContent.requirement,
            rationale: validatedContent.rationale,
            concept_ids: toTextArrayOrEmpty(validatedContent.concept_ids),
            ...(projectId ? { project_id: projectId } : {}),
            created_at: now,
            updated_at: now,
          };
          const inserted = await insertRow('business_requirements', row);
          insertedId = inserted?.id;
          break;
        }
        case 'sf': {
          const projectId =
            validatedContent.project_id ??
            (await resolveProjectId('system_domains', validatedContent.system_domain_id));
          const row = {
            system_domain_id: validatedContent.system_domain_id,
            code: validatedContent.code,
            name: validatedContent.name,
            description: validatedContent.description,
            concept_ids: toTextArrayOrEmpty(validatedContent.concept_ids),
            ...(projectId ? { project_id: projectId } : {}),
            created_at: now,
            updated_at: now,
          };
          const inserted = await insertRow('system_functions', row);
          insertedId = inserted?.id;
          break;
        }
        case 'sr': {
          const projectId =
            validatedContent.project_id ??
            (await resolveProjectId('system_functions', validatedContent.system_function_id));
          const row = {
            system_function_id: validatedContent.system_function_id,
            code: validatedContent.code,
            type: validatedContent.type,
            requirement: validatedContent.requirement,
            rationale: validatedContent.rationale,
            concept_ids: toTextArrayOrEmpty(validatedContent.concept_ids),
            ...(projectId ? { project_id: projectId } : {}),
            created_at: now,
            updated_at: now,
          };
          const inserted = await insertRow('system_requirements', row);
          insertedId = inserted?.id;
          break;
        }
        case 'ac': {
          const projectId =
            validatedContent.project_id ??
            (await resolveProjectId('system_requirements', validatedContent.system_requirement_id));
          const row = {
            system_requirement_id: validatedContent.system_requirement_id,
            code: validatedContent.code,
            given: validatedContent.given,
            when: validatedContent.when,
            then: validatedContent.then,
            ...(projectId ? { project_id: projectId } : {}),
            created_at: now,
            updated_at: now,
          };
          const inserted = await insertRow('acceptance_criteria', row);
          insertedId = inserted?.id;
          break;
        }
        case 'impl_unit': {
          const projectId =
            validatedContent.project_id ??
            (await resolveProjectId('system_functions', validatedContent.system_function_id));
          const row = {
            system_function_id: validatedContent.system_function_id,
            code: validatedContent.code,
            name: validatedContent.name,
            entry_point: validatedContent.entry_point,
            design_notes: validatedContent.design_notes ?? null,
            ...(projectId ? { project_id: projectId } : {}),
            created_at: now,
            updated_at: now,
          };
          const inserted = await insertRow('impl_unit_sds', row);
          insertedId = inserted?.id;
          break;
        }
        default:
          throw new Error(`Unknown draft type: ${type}`);
      }

      console.log('[commit_draft] Insert succeeded', { type, id: insertedId });
      return {
        success: true,
        id: insertedId ?? draftId,
        type,
        message: `草案を正本に登録しました（${type} ID: ${insertedId ?? draftId}）`,
      };
    } catch (error: any) {
      console.error('[commit_draft] Error:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
      });
      return {
        success: false,
        error: error.message,
        message: '草案の確定に失敗しました',
      };
    }
  },
});
