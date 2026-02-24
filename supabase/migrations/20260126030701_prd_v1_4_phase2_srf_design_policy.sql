begin;

alter table public.system_functions
  add column if not exists design_policy text not null default '';

update public.system_requirements
  set category = 'non_functional'
  where category = 'auth';

alter table public.system_requirements
  drop constraint if exists system_requirements_category_check;

alter table public.system_requirements
  add constraint system_requirements_category_check
  check (category in ('function', 'data', 'exception', 'non_functional'));

commit;
