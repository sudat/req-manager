-- acceptance_criteria（正本）をJSONに集約し、
-- system_requirements.acceptance_criteria_json と比較する差分検証SQL
-- 目的: fallback除去後に「旧JSONカラムにしかデータがない」SRを検出する

with canonical as (
  select
    sr.id as system_requirement_id,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', ac.id,
          'description', coalesce(ac.description, ''),
          'verification_method', ac.verification_method,
          'givenText', coalesce(ac.given_text, ''),
          'whenText', coalesce(ac.when_text, ''),
          'thenText', coalesce(ac.then_text, '')
        )
        order by ac.sort_order, ac.id
      ) filter (where ac.id is not null),
      '[]'::jsonb
    ) as canonical_json
  from public.system_requirements sr
  left join public.acceptance_criteria ac
    on ac.system_requirement_id = sr.id
  group by sr.id
),
comparison as (
  select
    sr.id,
    sr.title,
    sr.project_id,
    canonical.canonical_json,
    coalesce(sr.acceptance_criteria_json, '[]'::jsonb) as legacy_json,
    jsonb_array_length(canonical.canonical_json) as canonical_count,
    jsonb_array_length(coalesce(sr.acceptance_criteria_json, '[]'::jsonb)) as legacy_count
  from public.system_requirements sr
  join canonical on canonical.system_requirement_id = sr.id
)
select
  id,
  title,
  project_id,
  canonical_count,
  legacy_count,
  legacy_json,
  canonical_json
from comparison
where legacy_json <> canonical_json
order by project_id, id;

-- 件数だけ見たい場合:
-- select count(*) from comparison where legacy_json <> canonical_json;

-- 「旧JSONだけにデータがある（正本が空）」を優先確認:
-- select * from comparison
-- where canonical_count = 0 and legacy_count > 0
-- order by project_id, id;
