-- Add project_id to change_requests for project-level separation
begin;

alter table public.change_requests
  add column if not exists project_id uuid references public.projects(id) on delete cascade;

-- Backfill existing rows to the default project to keep behavior consistent
update public.change_requests
set project_id = '00000000-0000-0000-0000-000000000001'
where project_id is null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'change_requests'
      and column_name = 'project_id'
      and is_nullable = 'YES'
  ) then
    alter table public.change_requests
      alter column project_id set not null;
  end if;
end $$;

create index if not exists idx_change_requests_project_id
  on public.change_requests(project_id);

commit;

