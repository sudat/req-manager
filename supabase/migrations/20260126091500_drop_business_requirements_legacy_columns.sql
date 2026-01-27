begin;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'business_requirements_priority_check'
      and conrelid = 'public.business_requirements'::regclass
  ) then
    alter table public.business_requirements
      drop constraint business_requirements_priority_check;
  end if;
end $$;

alter table public.business_requirements
  drop column if exists summary,
  drop column if exists priority,
  drop column if exists acceptance_criteria_json,
  drop column if exists acceptance_criteria;

commit;
