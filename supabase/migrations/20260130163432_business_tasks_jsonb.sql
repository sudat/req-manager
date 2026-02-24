begin;

-- business_tasks: process_steps/input/output を jsonb 化（既存テキストは JSON 文字列として保持）
alter table public.business_tasks
  alter column process_steps type jsonb
    using (case when process_steps is null then null else to_jsonb(process_steps) end),
  alter column input type jsonb
    using (case when input is null then null else to_jsonb(input) end),
  alter column output type jsonb
    using (case when output is null then null else to_jsonb(output) end);

-- commit_draft RPC Function
-- 草案を正本に登録するためのトランザクション処理関数
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
  -- タイプに応じて正本テーブルに登録
  CASE p_type
    WHEN 'bt' THEN
      -- Business Task
      INSERT INTO business_tasks (
        business_id,
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
        p_content->>'business_domain_id',
        p_content->>'project_id',
        p_content->>'code',
        p_content->>'name',
        p_content->>'summary',
        p_content->>'businessContext',
        -- jsonb (processSteps)
        p_content->'processSteps',
        -- jsonb (input)
        p_content->'input',
        -- jsonb (output)
        p_content->'output',
        -- array (concepts)
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
      -- Business Requirement
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
        -- array (concept_ids)
        CASE
          WHEN jsonb_typeof(p_content->'concept_ids') = 'array'
          THEN ARRAY(SELECT jsonb_array_elements_text(p_content->'concept_ids'))::TEXT[]
          ELSE NULL
        END
      )
      RETURNING id INTO v_result_id;

    WHEN 'sf' THEN
      -- System Function
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
        -- array (concept_ids)
        CASE
          WHEN jsonb_typeof(p_content->'concept_ids') = 'array'
          THEN ARRAY(SELECT jsonb_array_elements_text(p_content->'concept_ids'))::TEXT[]
          ELSE NULL
        END
      )
      RETURNING id INTO v_result_id;

    WHEN 'sr' THEN
      -- System Requirement
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
        -- array (concept_ids)
        CASE
          WHEN jsonb_typeof(p_content->'concept_ids') = 'array'
          THEN ARRAY(SELECT jsonb_array_elements_text(p_content->'concept_ids'))::TEXT[]
          ELSE NULL
        END
      )
      RETURNING id INTO v_result_id;

    WHEN 'ac' THEN
      -- Acceptance Criteria
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
      -- Implementation Unit SD
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

  -- 成功レスポンスを返す
  RETURN QUERY SELECT TRUE, v_result_id, p_type, '登録成功';

EXCEPTION
  WHEN OTHERS THEN
    -- エラーレスポンスを返す
    RETURN QUERY SELECT FALSE, NULL::TEXT, p_type, SQLERRM;
    RAISE;
END;
$$;

commit;
