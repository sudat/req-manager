begin;

alter table public.business_requirements
  add column if not exists goal text,
  add column if not exists constraints text,
  add column if not exists owner text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'business_requirements'
      and column_name = 'summary'
  ) then
    update public.business_requirements
    set goal = summary
    where goal is null
      and summary is not null;
  end if;
end $$;

commit;
