begin;

alter table public.business_requirements
  add column if not exists goal text,
  add column if not exists constraints text,
  add column if not exists owner text;

update public.business_requirements
set goal = summary
where goal is null
  and summary is not null;

commit;
