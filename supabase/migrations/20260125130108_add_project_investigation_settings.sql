begin;

alter table public.projects
  add column if not exists investigation_settings jsonb not null default '{}'::jsonb;

comment on column public.projects.investigation_settings is 'ProjectInvestigationSettings (PRD 6.15)';

commit;
