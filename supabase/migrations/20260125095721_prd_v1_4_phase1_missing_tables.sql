begin;

-- Ensure UUID generation
create extension if not exists "pgcrypto";

-- projects
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

-- Add missing columns for existing projects table
alter table public.projects
  add column if not exists description text,
  add column if not exists github_url text,
  add column if not exists review_link_threshold text not null default 'medium',
  add column if not exists auto_save boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

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

-- Seed default project used in app state (safe to ignore if already present)
insert into public.projects (id, name, description, github_url, review_link_threshold, auto_save)
values ('00000000-0000-0000-0000-000000000001', 'Default Project', 'Auto-generated default project', null, 'medium', true)
on conflict (id) do nothing;

-- product_requirements (PR)
create table if not exists public.product_requirements (
  id text primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  target_users text not null default '',
  experience_goals text not null default '',
  quality_goals text not null default '',
  design_system text not null default '',
  ux_guidelines text not null default '',
  tech_stack_profile jsonb not null default '{}'::jsonb,
  coding_conventions jsonb,
  forbidden_choices jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.product_requirements
  add column if not exists project_id uuid references public.projects(id) on delete cascade,
  add column if not exists target_users text not null default '',
  add column if not exists experience_goals text not null default '',
  add column if not exists quality_goals text not null default '',
  add column if not exists design_system text not null default '',
  add column if not exists ux_guidelines text not null default '',
  add column if not exists tech_stack_profile jsonb not null default '{}'::jsonb,
  add column if not exists coding_conventions jsonb,
  add column if not exists forbidden_choices jsonb,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists idx_product_requirements_project_id
  on public.product_requirements(project_id);

-- acceptance_criteria (AC)
create table if not exists public.acceptance_criteria (
  id text primary key,
  system_requirement_id text not null references public.system_requirements(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  description text not null,
  given_text text,
  when_text text,
  then_text text,
  verification_method text,
  status text not null default 'unverified',
  verified_by text,
  verified_at timestamptz,
  evidence text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.acceptance_criteria
  add column if not exists system_requirement_id text references public.system_requirements(id) on delete cascade,
  add column if not exists project_id uuid references public.projects(id) on delete cascade,
  add column if not exists description text not null default '',
  add column if not exists given_text text,
  add column if not exists when_text text,
  add column if not exists then_text text,
  add column if not exists verification_method text,
  add column if not exists status text not null default 'unverified',
  add column if not exists verified_by text,
  add column if not exists verified_at timestamptz,
  add column if not exists evidence text,
  add column if not exists sort_order integer not null default 0,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_acceptance_criteria_project_id
  on public.acceptance_criteria(project_id);
create index if not exists idx_acceptance_criteria_system_requirement_id
  on public.acceptance_criteria(system_requirement_id);

-- impl_unit_sds (Implementation Units)
create table if not exists public.impl_unit_sds (
  id text primary key,
  srf_id text not null references public.system_functions(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  type text not null default 'screen',
  summary text not null default '',
  entry_points jsonb not null default '[]'::jsonb,
  design_policy text not null default '',
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.impl_unit_sds
  add column if not exists srf_id text references public.system_functions(id) on delete cascade,
  add column if not exists project_id uuid references public.projects(id) on delete cascade,
  add column if not exists name text not null default '',
  add column if not exists type text not null default 'screen',
  add column if not exists summary text not null default '',
  add column if not exists entry_points jsonb not null default '[]'::jsonb,
  add column if not exists design_policy text not null default '',
  add column if not exists details jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_impl_unit_sds_project_id
  on public.impl_unit_sds(project_id);
create index if not exists idx_impl_unit_sds_srf_id
  on public.impl_unit_sds(srf_id);

-- requirement_links
create table if not exists public.requirement_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  source_type text not null,
  source_id text not null,
  target_type text not null,
  target_id text not null,
  link_type text not null,
  suspect boolean not null default false,
  suspect_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.requirement_links
  add column if not exists project_id uuid references public.projects(id) on delete cascade,
  add column if not exists source_type text,
  add column if not exists source_id text,
  add column if not exists target_type text,
  add column if not exists target_id text,
  add column if not exists link_type text,
  add column if not exists suspect boolean not null default false,
  add column if not exists suspect_reason text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_requirement_links_project_id
  on public.requirement_links(project_id);
create index if not exists idx_requirement_links_source
  on public.requirement_links(source_type, source_id);
create index if not exists idx_requirement_links_target
  on public.requirement_links(target_type, target_id);

commit;
