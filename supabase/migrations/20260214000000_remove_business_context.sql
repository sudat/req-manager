begin;

-- ============================================================
-- バックアップ: business_context カラムのデータを保存
-- ============================================================
create table if not exists _backup_business_context_20260214 as
select id, business_context, created_at, updated_at
from public.business_tasks
where business_context is not null;

comment on table _backup_business_context_20260214 is 'business_tasks.business_contextカラム削除前のバックアップ（2026-02-14）';

-- ============================================================
-- 1) business_tasks から business_context カラムを削除
-- ============================================================
alter table public.business_tasks
  drop column if exists business_context;

-- ============================================================
-- 2) commit_draft RPC 関数を更新（business_context除去）
-- ============================================================
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

    WHEN 'dd' THEN
      INSERT INTO design_documents (
        system_function_id,
        code,
        name,
        io_type,
        summary,
        details
      )
      VALUES (
        p_content->>'system_function_id',
        p_content->>'code',
        p_content->>'name',
        p_content->>'ioType',
        p_content->>'summary',
        p_content->'details'
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
