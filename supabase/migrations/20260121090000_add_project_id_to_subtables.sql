-- Add project_id to subtables for project-level separation
begin;

-- 1) business_tasks
alter table public.business_tasks
  add column if not exists project_id uuid references public.projects(id) on delete cascade;

update public.business_tasks
set project_id = '00000000-0000-0000-0000-000000000001'
where project_id is null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'business_tasks'
      and column_name = 'project_id'
      and is_nullable = 'YES'
  ) then
    alter table public.business_tasks
      alter column project_id set not null;
  end if;
end $$;

create index if not exists idx_business_tasks_project_id
  on public.business_tasks(project_id);

-- 2) business_requirements
alter table public.business_requirements
  add column if not exists project_id uuid references public.projects(id) on delete cascade;

update public.business_requirements
set project_id = '00000000-0000-0000-0000-000000000001'
where project_id is null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'business_requirements'
      and column_name = 'project_id'
      and is_nullable = 'YES'
  ) then
    alter table public.business_requirements
      alter column project_id set not null;
  end if;
end $$;

create index if not exists idx_business_requirements_project_id
  on public.business_requirements(project_id);

-- 3) system_requirements
alter table public.system_requirements
  add column if not exists project_id uuid references public.projects(id) on delete cascade;

update public.system_requirements
set project_id = '00000000-0000-0000-0000-000000000001'
where project_id is null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'system_requirements'
      and column_name = 'project_id'
      and is_nullable = 'YES'
  ) then
    alter table public.system_requirements
      alter column project_id set not null;
  end if;
end $$;

create index if not exists idx_system_requirements_project_id
  on public.system_requirements(project_id);

-- 4) system_functions
alter table public.system_functions
  add column if not exists project_id uuid references public.projects(id) on delete cascade;

update public.system_functions
set project_id = '00000000-0000-0000-0000-000000000001'
where project_id is null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'system_functions'
      and column_name = 'project_id'
      and is_nullable = 'YES'
  ) then
    alter table public.system_functions
      alter column project_id set not null;
  end if;
end $$;

create index if not exists idx_system_functions_project_id
  on public.system_functions(project_id);

commit;
