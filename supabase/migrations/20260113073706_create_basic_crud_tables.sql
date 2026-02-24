-- Squashed baseline: core CRUD tables
--
-- Note:
-- - This file exists to match the linked Supabase project's migration history (version: 20260113073706).
-- - The current repository aims for *reproducible final schema* from migrations. Where older migrations were
--   missing or drifted, we keep this baseline as the source of truth for core tables.
--
-- Scope:
-- - projects
-- - business_domains, business_tasks, business_requirements
-- - system_domains, system_functions, system_requirements
-- - concepts
-- - RLS + permissive dev policies on the same tables that have RLS enabled in the linked project

begin;

-- Extensions
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ============================================================
-- projects
-- ============================================================
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  github_url text,
  review_link_threshold text not null default 'medium',
  auto_save boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_review_link_threshold_check'
      and conrelid = 'public.projects'::regclass
  ) then
    alter table public.projects
      add constraint projects_review_link_threshold_check
      check (review_link_threshold in ('low', 'medium', 'high'));
  end if;
end $$;

create index if not exists idx_projects_name on public.projects(name);

-- Seed default project used in app state
insert into public.projects (id, name, description, review_link_threshold, auto_save)
values ('00000000-0000-0000-0000-000000000001', 'Default Project', 'Auto-generated default project', 'medium', true)
on conflict (id) do nothing;

-- ============================================================
-- business_domains
-- ============================================================
create table if not exists public.business_domains (
  name text not null,
  area text not null,
  summary text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project_id uuid not null references public.projects(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (project_id, area)
);

create index if not exists idx_business_domains_project on public.business_domains(project_id);
create index if not exists businesses_area_idx on public.business_domains(area);
create index if not exists businesses_name_idx on public.business_domains(name);

-- ============================================================
-- business_tasks
-- ============================================================
create table if not exists public.business_tasks (
  id text not null,
  business_area text not null,
  name text not null,
  summary text not null,
  person text,
  input jsonb,
  output jsonb,
  concepts text[] not null default '{}'::text[],
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project_id uuid not null references public.projects(id) on delete cascade,
  process_steps jsonb,
  concept_ids_yaml text,
  trigger_description text,
  trigger_task_ids text[] default '{}'::text[],
  frequency text default 'daily'::text,
  frequency_description text,
  constraint tasks_pkey primary key (id)
);

-- FK: (project_id, business_area) -> business_domains(project_id, area)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'business_tasks_business_area_fkey'
      and conrelid = 'public.business_tasks'::regclass
  ) then
    alter table public.business_tasks
      add constraint business_tasks_business_area_fkey
      foreign key (project_id, business_area)
      references public.business_domains(project_id, area)
      on update cascade
      on delete cascade;
  end if;
end $$;

create index if not exists tasks_business_area_idx on public.business_tasks(business_area);
create index if not exists tasks_name_idx on public.business_tasks(name);
create index if not exists idx_business_tasks_trigger_task_ids on public.business_tasks using gin (trigger_task_ids);

-- ============================================================
-- business_requirements
-- ============================================================
create table if not exists public.business_requirements (
  id text primary key,
  task_id text not null references public.business_tasks(id) on delete cascade,
  title text not null,
  concept_ids text[] not null default '{}'::text[],
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  impacts text[] default '{}'::text[],
  project_id uuid not null references public.projects(id) on delete cascade,
  goal text,
  constraints text,
  owner text,
  srf_ids text[] default '{}'::text[]
);

create index if not exists idx_business_requirements_project_id on public.business_requirements(project_id);
create index if not exists business_requirements_task_id_idx on public.business_requirements(task_id);

-- ============================================================
-- system_domains
-- ============================================================
create table if not exists public.system_domains (
  id text not null,
  name text not null,
  description text not null default ''::text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project_id uuid not null references public.projects(id) on delete cascade,
  constraint impact_domains_pkey primary key (id)
);

create index if not exists idx_system_domains_project on public.system_domains(project_id);
create index if not exists system_domains_sort_order_idx on public.system_domains(sort_order);

-- ============================================================
-- system_functions
-- ============================================================
create table if not exists public.system_functions (
  id text primary key,
  category text not null,
  summary text not null,
  status text not null,
  related_task_ids text[] not null default '{}'::text[],
  requirement_ids text[] not null default '{}'::text[],
  system_design jsonb not null default '[]'::jsonb,
  code_refs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  system_domain_id text references public.system_domains(id),
  title text not null default ''::text,
  entry_points jsonb not null default '[]'::jsonb,
  project_id uuid not null references public.projects(id) on delete cascade,
  design_policy text not null default ''::text,
  sort_order integer not null default 0
);

create index if not exists idx_system_functions_project_id on public.system_functions(project_id);
create index if not exists system_functions_category_idx on public.system_functions(category);
create index if not exists system_functions_status_idx on public.system_functions(status);
create index if not exists system_functions_system_domain_id_idx on public.system_functions(system_domain_id);

-- ============================================================
-- system_requirements
-- ============================================================
create table if not exists public.system_requirements (
  id text primary key,
  task_id text not null references public.business_tasks(id) on delete cascade,
  title text not null,
  summary text not null,
  concept_ids text[] not null default '{}'::text[],
  impacts text[] not null default '{}'::text[],
  acceptance_criteria text[] not null default '{}'::text[],
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  system_domain_ids text[] default '{}'::text[],
  category text not null default 'function'::text,
  acceptance_criteria_json jsonb not null default '[]'::jsonb,
  project_id uuid not null references public.projects(id) on delete cascade,
  srf_ids text[] default '{}'::text[]
);

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
      check (category in ('function', 'data', 'exception', 'non_functional'));
  end if;
end $$;

create index if not exists idx_system_requirements_project_id on public.system_requirements(project_id);
create index if not exists system_requirements_task_id_idx on public.system_requirements(task_id);

-- ============================================================
-- concepts
-- ============================================================
create table if not exists public.concepts (
  id text primary key,
  name text not null,
  synonyms text[] not null default '{}'::text[],
  areas text[] not null default '{}'::text[],
  definition text not null default ''::text,
  related_docs text[] not null default '{}'::text[],
  requirement_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project_id uuid not null references public.projects(id) on delete cascade,
  sort_order integer not null default 0
);

create index if not exists idx_concepts_project on public.concepts(project_id);
create index if not exists concepts_areas_idx on public.concepts(areas);
create index if not exists concepts_name_idx on public.concepts(name);

-- ============================================================
-- RLS (dev permissive) - match current linked project's enabled tables
-- ============================================================

-- business_domains
alter table public.business_domains enable row level security;

drop policy if exists anon_read_businesses on public.business_domains;
create policy anon_read_businesses on public.business_domains
  for select to public
  using (true);

drop policy if exists anon_write_businesses on public.business_domains;
create policy anon_write_businesses on public.business_domains
  for insert to public
  with check (true);

drop policy if exists anon_update_businesses on public.business_domains;
create policy anon_update_businesses on public.business_domains
  for update to public
  using (true);

drop policy if exists anon_delete_businesses on public.business_domains;
create policy anon_delete_businesses on public.business_domains
  for delete to public
  using (true);

-- business_tasks
alter table public.business_tasks enable row level security;

drop policy if exists anon_read_tasks on public.business_tasks;
create policy anon_read_tasks on public.business_tasks
  for select to public
  using (true);

drop policy if exists anon_write_tasks on public.business_tasks;
create policy anon_write_tasks on public.business_tasks
  for insert to public
  with check (true);

drop policy if exists anon_update_tasks on public.business_tasks;
create policy anon_update_tasks on public.business_tasks
  for update to public
  using (true);

drop policy if exists anon_delete_tasks on public.business_tasks;
create policy anon_delete_tasks on public.business_tasks
  for delete to public
  using (true);

-- business_requirements
alter table public.business_requirements enable row level security;

drop policy if exists anon_read_business_requirements on public.business_requirements;
create policy anon_read_business_requirements on public.business_requirements
  for select to public
  using (true);

drop policy if exists anon_write_business_requirements on public.business_requirements;
create policy anon_write_business_requirements on public.business_requirements
  for insert to public
  with check (true);

drop policy if exists anon_update_business_requirements on public.business_requirements;
create policy anon_update_business_requirements on public.business_requirements
  for update to public
  using (true);

drop policy if exists anon_delete_business_requirements on public.business_requirements;
create policy anon_delete_business_requirements on public.business_requirements
  for delete to public
  using (true);

-- concepts
alter table public.concepts enable row level security;

drop policy if exists anon_read_concepts on public.concepts;
create policy anon_read_concepts on public.concepts
  for select to public
  using (true);

drop policy if exists anon_write_concepts on public.concepts;
create policy anon_write_concepts on public.concepts
  for insert to public
  with check (true);

drop policy if exists anon_update_concepts on public.concepts;
create policy anon_update_concepts on public.concepts
  for update to public
  using (true);

drop policy if exists anon_delete_concepts on public.concepts;
create policy anon_delete_concepts on public.concepts
  for delete to public
  using (true);

-- system_domains
alter table public.system_domains enable row level security;

drop policy if exists anon_read_system_domains on public.system_domains;
create policy anon_read_system_domains on public.system_domains
  for select to public
  using (true);

drop policy if exists anon_write_system_domains on public.system_domains;
create policy anon_write_system_domains on public.system_domains
  for insert to public
  with check (true);

drop policy if exists anon_update_system_domains on public.system_domains;
create policy anon_update_system_domains on public.system_domains
  for update to public
  using (true);

drop policy if exists anon_delete_system_domains on public.system_domains;
create policy anon_delete_system_domains on public.system_domains
  for delete to public
  using (true);

-- system_functions
alter table public.system_functions enable row level security;

drop policy if exists anon_read_system_functions on public.system_functions;
create policy anon_read_system_functions on public.system_functions
  for select to public
  using (true);

drop policy if exists anon_write_system_functions on public.system_functions;
create policy anon_write_system_functions on public.system_functions
  for insert to public
  with check (true);

drop policy if exists anon_update_system_functions on public.system_functions;
create policy anon_update_system_functions on public.system_functions
  for update to public
  using (true);

drop policy if exists anon_delete_system_functions on public.system_functions;
create policy anon_delete_system_functions on public.system_functions
  for delete to public
  using (true);

-- system_requirements
alter table public.system_requirements enable row level security;

drop policy if exists "Allow anon access to system_requirements" on public.system_requirements;
create policy "Allow anon access to system_requirements" on public.system_requirements
  for all to anon
  using (true)
  with check (true);

commit;
