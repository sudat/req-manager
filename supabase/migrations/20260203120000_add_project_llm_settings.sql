begin;

alter table public.projects
  add column if not exists llm_settings jsonb not null default '{}'::jsonb;

comment on column public.projects.llm_settings is 'ProjectLlmSettings (LLM settings per project)';

commit;
