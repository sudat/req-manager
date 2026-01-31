begin;

alter table public.business_requirements
  drop column if exists related_system_requirement_ids;

alter table public.system_requirements
  drop column if exists business_requirement_ids;

commit;
