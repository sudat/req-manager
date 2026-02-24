-- Add project_id to change request subtables for project-level separation
-- Also align investigation_results.project_id with the schema design (FK to projects)
begin;

-- 1) change_request_impact_scopes
alter table public.change_request_impact_scopes
  add column if not exists project_id uuid references public.projects(id) on delete cascade;

-- Backfill from parent change_requests.project_id
update public.change_request_impact_scopes s
set project_id = cr.project_id
from public.change_requests cr
where s.change_request_id = cr.id
  and s.project_id is null;

-- Defensive fallback (should be unnecessary once all CRs have project_id)
update public.change_request_impact_scopes
set project_id = '00000000-0000-0000-0000-000000000001'
where project_id is null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'change_request_impact_scopes'
      and column_name = 'project_id'
      and is_nullable = 'YES'
  ) then
    alter table public.change_request_impact_scopes
      alter column project_id set not null;
  end if;
end $$;

create index if not exists idx_change_request_impact_scopes_project_id
  on public.change_request_impact_scopes(project_id);

-- 2) change_request_acceptance_confirmations
alter table public.change_request_acceptance_confirmations
  add column if not exists project_id uuid references public.projects(id) on delete cascade;

-- Backfill from parent change_requests.project_id
update public.change_request_acceptance_confirmations c
set project_id = cr.project_id
from public.change_requests cr
where c.change_request_id = cr.id
  and c.project_id is null;

-- Defensive fallback
update public.change_request_acceptance_confirmations
set project_id = '00000000-0000-0000-0000-000000000001'
where project_id is null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'change_request_acceptance_confirmations'
      and column_name = 'project_id'
      and is_nullable = 'YES'
  ) then
    alter table public.change_request_acceptance_confirmations
      alter column project_id set not null;
  end if;
end $$;

create index if not exists idx_change_request_acceptance_confirmations_project_id
  on public.change_request_acceptance_confirmations(project_id);

-- 3) investigation_results.project_id FK (it was present but missing FK in the initial migration)
update public.investigation_results ir
set project_id = '00000000-0000-0000-0000-000000000001'
where not exists (
  select 1 from public.projects p where p.id = ir.project_id
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'investigation_results_project_id_fkey'
      and conrelid = 'public.investigation_results'::regclass
  ) then
    alter table public.investigation_results
      add constraint investigation_results_project_id_fkey
      foreign key (project_id)
      references public.projects(id) on delete cascade;
  end if;
end $$;

commit;

