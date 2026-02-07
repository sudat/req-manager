begin;

drop index if exists public.idx_system_functions_deliverables;

alter table if exists public.system_functions
  drop column if exists deliverables;

commit;
