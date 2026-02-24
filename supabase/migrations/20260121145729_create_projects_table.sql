-- projects table (multi-project)
--
-- Kept for parity with the linked Supabase project's schema_migrations history.

begin;

create extension if not exists pgcrypto;

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

insert into public.projects (id, name, description, review_link_threshold, auto_save)
values ('00000000-0000-0000-0000-000000000001', 'Default Project', 'Auto-generated default project', 'medium', true)
on conflict (id) do nothing;

commit;
