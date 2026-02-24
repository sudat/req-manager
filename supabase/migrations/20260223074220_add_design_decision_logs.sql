-- Phase 6: design_decision_logs テーブル作成
-- 変更要求に対する設計判断と根拠メモを保持する

begin;

create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.design_decision_logs (
  id uuid primary key default gen_random_uuid(),
  change_request_id uuid not null references public.change_requests(id) on delete cascade,
  created_by text not null default 'human',
  context_target_type text not null default 'change_request',
  context_target_id text not null,
  context_field text,
  decision text not null,
  rationale_type text not null default 'user_input',
  rationale_reference text,
  rationale_explanation text not null,
  status text not null default 'confirmed',
  confirmed_by text,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'design_decision_logs_created_by_check'
      and conrelid = 'public.design_decision_logs'::regclass
  ) then
    alter table public.design_decision_logs
      add constraint design_decision_logs_created_by_check
      check (created_by in ('agent', 'human'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'design_decision_logs_context_target_type_check'
      and conrelid = 'public.design_decision_logs'::regclass
  ) then
    alter table public.design_decision_logs
      add constraint design_decision_logs_context_target_type_check
      check (context_target_type in ('bt', 'br', 'sf', 'sr', 'ac', 'impl_unit', 'change_request'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'design_decision_logs_rationale_type_check'
      and conrelid = 'public.design_decision_logs'::regclass
  ) then
    alter table public.design_decision_logs
      add constraint design_decision_logs_rationale_type_check
      check (rationale_type in ('pr_reference', 'ac_reference', 'convention', 'inference', 'user_input'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'design_decision_logs_status_check'
      and conrelid = 'public.design_decision_logs'::regclass
  ) then
    alter table public.design_decision_logs
      add constraint design_decision_logs_status_check
      check (status in ('proposed', 'confirmed', 'rejected'));
  end if;
end $$;

create index if not exists idx_design_decision_logs_change_request_id
  on public.design_decision_logs(change_request_id, created_at desc);

create index if not exists idx_design_decision_logs_status
  on public.design_decision_logs(status);

drop trigger if exists update_design_decision_logs_updated_at on public.design_decision_logs;
create trigger update_design_decision_logs_updated_at
  before update on public.design_decision_logs
  for each row
  execute procedure public.update_updated_at_column();

commit;
