-- Remove obsolete deliverable linkage from system_requirements.
drop index if exists public.idx_system_requirements_related_deliverables;

alter table public.system_requirements
  drop column if exists related_deliverable_ids;
