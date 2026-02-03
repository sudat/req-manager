begin;

-- 1) business_tasks の外部キーを外し、business_id を business_area に変更
alter table public.business_tasks
  drop constraint if exists tasks_business_id_fkey;
alter table public.business_tasks
  drop constraint if exists business_tasks_business_id_fkey;

alter table public.business_tasks
  rename column business_id to business_area;

-- 2) 既存データを area に変換（旧BIZ-xxx → area）
update public.business_tasks bt
set business_area = bd.area
from public.business_domains bd
where bt.business_area = bd.id
  and bt.project_id = bd.project_id;

-- 3) インデックスの差し替え
drop index if exists public.tasks_business_id_idx;
create index if not exists tasks_business_area_idx
  on public.business_tasks(business_area);

-- 4) business_domains のPKを area + project_id に変更し、id列を削除
alter table public.business_domains
  drop constraint if exists businesses_pkey;
alter table public.business_domains
  drop constraint if exists business_domains_pkey;

alter table public.business_domains
  drop column if exists id;

alter table public.business_domains
  add primary key (project_id, area);

-- 5) 新しい外部キー（area + project_id）を追加
alter table public.business_tasks
  add constraint business_tasks_business_area_fkey
  foreign key (project_id, business_area)
  references public.business_domains(project_id, area)
  on delete cascade
  on update cascade;

-- 6) commit_draft RPC を area 対応に更新
CREATE OR REPLACE FUNCTION commit_draft(
  p_draft_id TEXT,
  p_type TEXT,
  p_content JSONB
)
RETURNS TABLE (
  success BOOLEAN,
  id TEXT,
  type TEXT,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result_id TEXT;
  v_project_id TEXT;
BEGIN
  CASE p_type
    WHEN 'bt' THEN
      INSERT INTO business_tasks (
        business_area,
        project_id,
        id,
        name,
        summary,
        business_context,
        process_steps,
        input,
        output,
        concepts,
        concept_ids_yaml,
        person,
        sort_order,
        created_at,
        updated_at
      )
      VALUES (
        COALESCE(p_content->>'business_area', p_content->>'business_domain_id'),
        p_content->>'project_id',
        p_content->>'code',
        p_content->>'name',
        p_content->>'summary',
        p_content->>'businessContext',
        p_content->'processSteps',
        p_content->'input',
        p_content->'output',
        CASE
          WHEN jsonb_typeof(p_content->'concepts') = 'array'
          THEN ARRAY(SELECT jsonb_array_elements_text(p_content->'concepts'))::TEXT[]
          ELSE NULL
        END,
        p_content->>'conceptIdsYaml',
        p_content->>'person',
        COALESCE((p_content->>'sort_order')::INT, 0),
        NOW(),
        NOW()
      )
      RETURNING id INTO v_result_id;

    WHEN 'br' THEN
      INSERT INTO business_requirements (
        business_task_id,
        code,
        requirement,
        rationale,
        concept_ids
      )
      VALUES (
        p_content->>'business_task_id',
        p_content->>'code',
        p_content->>'requirement',
        p_content->>'rationale',
        CASE
          WHEN jsonb_typeof(p_content->'concept_ids') = 'array'
          THEN ARRAY(SELECT jsonb_array_elements_text(p_content->'concept_ids'))::TEXT[]
          ELSE NULL
        END
      )
      RETURNING id INTO v_result_id;

    WHEN 'sf' THEN
      INSERT INTO system_functions (
        system_domain_id,
        code,
        name,
        description,
        concept_ids
      )
      VALUES (
        p_content->>'system_domain_id',
        p_content->>'code',
        p_content->>'name',
        p_content->>'description',
        CASE
          WHEN jsonb_typeof(p_content->'concept_ids') = 'array'
          THEN ARRAY(SELECT jsonb_array_elements_text(p_content->'concept_ids'))::TEXT[]
          ELSE NULL
        END
      )
      RETURNING id INTO v_result_id;

    WHEN 'sr' THEN
      INSERT INTO system_requirements (
        system_function_id,
        code,
        type,
        requirement,
        rationale,
        concept_ids
      )
      VALUES (
        p_content->>'system_function_id',
        p_content->>'code',
        p_content->>'type',
        p_content->>'requirement',
        p_content->>'rationale',
        CASE
          WHEN jsonb_typeof(p_content->'concept_ids') = 'array'
          THEN ARRAY(SELECT jsonb_array_elements_text(p_content->'concept_ids'))::TEXT[]
          ELSE NULL
        END
      )
      RETURNING id INTO v_result_id;

    WHEN 'ac' THEN
      INSERT INTO acceptance_criteria (
        system_requirement_id,
        code,
        given_text,
        when_text,
        then_text
      )
      VALUES (
        p_content->>'system_requirement_id',
        p_content->>'code',
        p_content->>'given',
        p_content->>'when',
        p_content->>'then'
      )
      RETURNING id INTO v_result_id;

    WHEN 'impl_unit' THEN
      INSERT INTO impl_unit_sds (
        system_function_id,
        code,
        name,
        entry_point,
        design_notes
      )
      VALUES (
        p_content->>'system_function_id',
        p_content->>'code',
        p_content->>'name',
        p_content->>'entry_point',
        p_content->>'design_notes'
      )
      RETURNING id INTO v_result_id;

    ELSE
      RAISE EXCEPTION 'Unknown draft type: %', p_type;
  END CASE;

  RETURN QUERY SELECT TRUE, v_result_id, p_type, '登録成功';

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, p_type, SQLERRM;
    RAISE;
END;
$$;

commit;
