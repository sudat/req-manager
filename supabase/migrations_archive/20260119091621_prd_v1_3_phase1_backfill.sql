begin;

-- PRD v1.3 Phase 1 (minimal backfill)
-- 既存データの読み取りが壊れないことを優先しつつ、新カラムを最低限埋める。

-- 1) business_requirements.priority: 既定値で一括設定
update public.business_requirements
set priority = 'Must'
where priority is null;

-- 2) business_requirements.acceptance_criteria(text[]) -> acceptance_criteria_json(jsonb)
--    - description に旧文字列
--    - id は暫定で AC-001, AC-002... を採番
--    - verification_method/status は既定値、他は NULL
update public.business_requirements br
set acceptance_criteria_json = src.acceptance_criteria_json
from (
  select
    br2.id,
    jsonb_agg(
      jsonb_build_object(
        'id', format('AC-%s', lpad(u.ordinality::text, 3, '0')),
        'description', u.criteria,
        'verification_method', '目視確認',
        'status', 'unverified',
        'verified_by', null,
        'verified_at', null,
        'evidence', null
      )
      order by u.ordinality
    ) as acceptance_criteria_json
  from public.business_requirements br2
  cross join lateral unnest(br2.acceptance_criteria) with ordinality as u(criteria, ordinality)
  group by br2.id
) src
where br.id = src.id
  and br.acceptance_criteria_json = '[]'::jsonb;

-- 3) system_requirements.category: 既定値で一括設定
update public.system_requirements
set category = 'function'
where category is null;

-- 4) system_requirements.business_requirement_ids: 空配列で初期化
update public.system_requirements
set business_requirement_ids = '{}'::text[]
where business_requirement_ids is null;

-- 5) system_requirements.acceptance_criteria(text[]) -> acceptance_criteria_json(jsonb)
update public.system_requirements sr
set acceptance_criteria_json = src.acceptance_criteria_json
from (
  select
    sr2.id,
    jsonb_agg(
      jsonb_build_object(
        'id', format('AC-%s', lpad(u.ordinality::text, 3, '0')),
        'description', u.criteria,
        'verification_method', '目視確認',
        'status', 'unverified',
        'verified_by', null,
        'verified_at', null,
        'evidence', null
      )
      order by u.ordinality
    ) as acceptance_criteria_json
  from public.system_requirements sr2
  cross join lateral unnest(sr2.acceptance_criteria) with ordinality as u(criteria, ordinality)
  group by sr2.id
) src
where sr.id = src.id
  and sr.acceptance_criteria_json = '[]'::jsonb;

-- 6) system_functions.code_refs.paths -> entry_points[].path（暫定移行）
--    type/responsibility は空文字（後で手入力/既定値に置換）
update public.system_functions sf
set entry_points = src.entry_points
from (
  select
    sf2.id,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'path', p.path,
          'type', '',
          'responsibility', ''
        )
        order by p.path
      ) filter (where p.path is not null),
      '[]'::jsonb
    ) as entry_points
  from public.system_functions sf2
  left join lateral (
    select distinct paths.path
    from jsonb_array_elements(sf2.code_refs) as cr
    cross join lateral jsonb_array_elements_text(coalesce(cr->'paths', '[]'::jsonb)) as paths(path)
  ) as p on true
  group by sf2.id
) src
where sf.id = src.id
  and sf.entry_points = '[]'::jsonb
  and src.entry_points <> '[]'::jsonb;

commit;
