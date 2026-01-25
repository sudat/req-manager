-- Add project settings columns to projects table
begin;

-- Add github_url column (nullable, optional GitHub repository URL)
alter table public.projects
  add column if not exists github_url text;

comment on column public.projects.github_url is 'GitHubリポジトリURL';

-- Add review_link_threshold column (default 'medium')
alter table public.projects
  add column if not exists review_link_threshold text not null default 'medium';

comment on column public.projects.review_link_threshold is '要確認リンク判定基準: low/medium/high';

-- Add CHECK constraint for review_link_threshold
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_review_link_threshold_check'
      and conrelid = 'public.projects'::regclass
  ) then
    alter table public.projects
      add constraint projects_review_link_threshold_check
      check (review_link_threshold in ('low', 'medium', 'high'));
  end if;
end $$;

-- Add auto_save column (default true)
alter table public.projects
  add column if not exists auto_save boolean not null default true;

comment on column public.projects.auto_save is '自動保存有効フラグ';

commit;
