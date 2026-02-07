begin;

-- 検索精度向上のための拡張とインデックス
create extension if not exists pg_trgm;

-- BT
create index if not exists idx_business_tasks_id_pattern
  on public.business_tasks (id text_pattern_ops);
create index if not exists idx_business_tasks_name_trgm
  on public.business_tasks using gin (name gin_trgm_ops);
create index if not exists idx_business_tasks_summary_trgm
  on public.business_tasks using gin (summary gin_trgm_ops);

-- BR
create index if not exists idx_business_requirements_id_pattern
  on public.business_requirements (id text_pattern_ops);
create index if not exists idx_business_requirements_title_trgm
  on public.business_requirements using gin (title gin_trgm_ops);
create index if not exists idx_business_requirements_goal_trgm
  on public.business_requirements using gin (goal gin_trgm_ops);
create index if not exists idx_business_requirements_task_id_pattern
  on public.business_requirements (task_id text_pattern_ops);

-- SF
create index if not exists idx_system_functions_id_pattern
  on public.system_functions (id text_pattern_ops);
create index if not exists idx_system_functions_title_trgm
  on public.system_functions using gin (title gin_trgm_ops);
create index if not exists idx_system_functions_summary_trgm
  on public.system_functions using gin (summary gin_trgm_ops);

-- SR
create index if not exists idx_system_requirements_id_pattern
  on public.system_requirements (id text_pattern_ops);
create index if not exists idx_system_requirements_title_trgm
  on public.system_requirements using gin (title gin_trgm_ops);
create index if not exists idx_system_requirements_summary_trgm
  on public.system_requirements using gin (summary gin_trgm_ops);

-- 検索用RPC
create or replace function public.search_requirements_v2(
  p_project_id uuid,
  p_query text,
  p_types text[] default null,
  p_limit int default 10
)
returns table(result jsonb, score real)
language sql
stable
as $$
with params as (
  select
    p_project_id as project_id,
    trim(coalesce(p_query, '')) as q,
    coalesce(p_types, array['bt','br','sf','sr']) as types,
    greatest(1, least(coalesce(p_limit, 10), 50)) as lim
),
bt as (
  select
    jsonb_build_object(
      'resultType','bt',
      'id', bt.id,
      'name', bt.name,
      'description', coalesce(bt.summary, ''),
      'business_area', bt.business_area
    ) as result,
    greatest(
      case when bt.id ilike params.q || '%' then 1.0 else 0 end,
      similarity(bt.id, params.q) * 0.9,
      similarity(bt.name, params.q) * 0.8,
      similarity(coalesce(bt.summary, ''), params.q) * 0.6,
      case when bt.name ilike '%' || params.q || '%' then 0.7 else 0 end,
      case when bt.summary ilike '%' || params.q || '%' then 0.5 else 0 end
    )::real as score
  from public.business_tasks bt
  cross join params
  where bt.project_id = params.project_id
    and 'bt' = any(params.types)
    and params.q <> ''
    and (
      bt.id ilike params.q || '%'
      or bt.name ilike '%' || params.q || '%'
      or bt.summary ilike '%' || params.q || '%'
      or similarity(bt.id, params.q) > 0.2
      or similarity(bt.name, params.q) > 0.2
      or similarity(coalesce(bt.summary, ''), params.q) > 0.2
    )
),
br as (
  select
    jsonb_build_object(
      'resultType','br',
      'id', br.id,
      'code', br.id,
      'requirement', coalesce(br.title, ''),
      'rationale', coalesce(br.goal, ''),
      'business_task_id', br.task_id,
      'task_id', br.task_id
    ) as result,
    greatest(
      case when br.id ilike params.q || '%' then 1.0 else 0 end,
      similarity(br.id, params.q) * 0.9,
      similarity(coalesce(br.title, ''), params.q) * 0.8,
      similarity(coalesce(br.goal, ''), params.q) * 0.6,
      similarity(coalesce(br.task_id, ''), params.q) * 0.7,
      case when br.title ilike '%' || params.q || '%' then 0.7 else 0 end,
      case when br.goal ilike '%' || params.q || '%' then 0.5 else 0 end,
      case when br.task_id ilike params.q || '%' then 0.8 else 0 end
    )::real as score
  from public.business_requirements br
  cross join params
  where br.project_id = params.project_id
    and 'br' = any(params.types)
    and params.q <> ''
    and (
      br.id ilike params.q || '%'
      or br.title ilike '%' || params.q || '%'
      or br.goal ilike '%' || params.q || '%'
      or br.task_id ilike params.q || '%'
      or similarity(br.id, params.q) > 0.2
      or similarity(coalesce(br.title, ''), params.q) > 0.2
      or similarity(coalesce(br.goal, ''), params.q) > 0.2
      or similarity(coalesce(br.task_id, ''), params.q) > 0.2
    )
),
sf as (
  select
    jsonb_build_object(
      'resultType','sf',
      'id', sf.id,
      'code', sf.id,
      'name', coalesce(sf.title, ''),
      'description', coalesce(sf.summary, ''),
      'system_domain_id', sf.system_domain_id
    ) as result,
    greatest(
      case when sf.id ilike params.q || '%' then 1.0 else 0 end,
      similarity(sf.id, params.q) * 0.9,
      similarity(coalesce(sf.title, ''), params.q) * 0.8,
      similarity(coalesce(sf.summary, ''), params.q) * 0.6,
      case when sf.title ilike '%' || params.q || '%' then 0.7 else 0 end,
      case when sf.summary ilike '%' || params.q || '%' then 0.5 else 0 end
    )::real as score
  from public.system_functions sf
  cross join params
  where sf.project_id = params.project_id
    and 'sf' = any(params.types)
    and params.q <> ''
    and (
      sf.id ilike params.q || '%'
      or sf.title ilike '%' || params.q || '%'
      or sf.summary ilike '%' || params.q || '%'
      or similarity(sf.id, params.q) > 0.2
      or similarity(coalesce(sf.title, ''), params.q) > 0.2
      or similarity(coalesce(sf.summary, ''), params.q) > 0.2
    )
),
sr as (
  select
    jsonb_build_object(
      'resultType','sr',
      'id', sr.id,
      'code', sr.id,
      'type', coalesce(sr.category, 'function'),
      'title', coalesce(sr.title, ''),
      'summary', coalesce(sr.summary, ''),
      'requirement', coalesce(sr.summary, ''),
      'rationale', '',
      'srf_ids', coalesce(sr.srf_ids, '{}'::text[]),
      'system_function_id', case when array_length(sr.srf_ids, 1) >= 1 then sr.srf_ids[1] else null end
    ) as result,
    greatest(
      case when sr.id ilike params.q || '%' then 1.0 else 0 end,
      similarity(sr.id, params.q) * 0.9,
      similarity(coalesce(sr.title, ''), params.q) * 0.8,
      similarity(coalesce(sr.summary, ''), params.q) * 0.6,
      case when sr.title ilike '%' || params.q || '%' then 0.7 else 0 end,
      case when sr.summary ilike '%' || params.q || '%' then 0.5 else 0 end
    )::real as score
  from public.system_requirements sr
  cross join params
  where sr.project_id = params.project_id
    and 'sr' = any(params.types)
    and params.q <> ''
    and (
      sr.id ilike params.q || '%'
      or sr.title ilike '%' || params.q || '%'
      or sr.summary ilike '%' || params.q || '%'
      or similarity(sr.id, params.q) > 0.2
      or similarity(coalesce(sr.title, ''), params.q) > 0.2
      or similarity(coalesce(sr.summary, ''), params.q) > 0.2
    )
),
combined as (
  select * from bt
  union all
  select * from br
  union all
  select * from sf
  union all
  select * from sr
)
select result, score
from combined
order by score desc, (result->>'id') asc
limit (select lim from params);
$$;

commit;
