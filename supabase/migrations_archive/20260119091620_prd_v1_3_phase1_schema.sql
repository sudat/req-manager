begin;

-- PRD v1.3 Phase 1 (DB schema)
-- 方針: 既存UI/データ層を壊さないため、既存の text[] acceptance_criteria は残しつつ、
--       構造化用の jsonb カラムを追加して段階移行する（KISS）。

-- 1) business_requirements
alter table public.business_requirements
  add column if not exists priority text not null default 'Must',
  add column if not exists acceptance_criteria_json jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'business_requirements_priority_check'
      and conrelid = 'public.business_requirements'::regclass
  ) then
    alter table public.business_requirements
      add constraint business_requirements_priority_check
      check (priority in ('Must', 'Should', 'Could'));
  end if;
end $$;

-- 2) system_requirements
alter table public.system_requirements
  add column if not exists category text not null default 'function',
  add column if not exists business_requirement_ids text[] not null default '{}'::text[],
  add column if not exists acceptance_criteria_json jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'system_requirements_category_check'
      and conrelid = 'public.system_requirements'::regclass
  ) then
    alter table public.system_requirements
      add constraint system_requirements_category_check
      check (category in ('function', 'data', 'exception', 'auth', 'non_functional'));
  end if;
end $$;

-- 3) system_functions
alter table public.system_functions
  add column if not exists entry_points jsonb not null default '[]'::jsonb;

commit;
