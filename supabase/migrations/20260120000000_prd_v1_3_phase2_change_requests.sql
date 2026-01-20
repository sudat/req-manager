-- PRD v1.3 Phase 2 (Change Request Schema)
-- 変更要求管理のためのテーブル作成

begin;

-- 既存の共通関数が存在しない場合は作成
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 1) change_requests テーブル
create table if not exists public.change_requests (
  id uuid primary key default gen_random_uuid(),
  ticket_id text unique not null,
  title text not null,
  description text,
  background text,
  expected_benefit text,
  status text not null default 'open',
  priority text not null default 'medium',
  requested_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'change_requests_status_check'
      and conrelid = 'public.change_requests'::regclass
  ) then
    alter table public.change_requests
      add constraint change_requests_status_check
      check (status in ('open', 'review', 'approved', 'applied'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'change_requests_priority_check'
      and conrelid = 'public.change_requests'::regclass
  ) then
    alter table public.change_requests
      add constraint change_requests_priority_check
      check (priority in ('low', 'medium', 'high'));
  end if;
end $$;

create index if not exists idx_change_requests_ticket_id
  on public.change_requests(ticket_id);
create index if not exists idx_change_requests_status
  on public.change_requests(status);
create index if not exists idx_change_requests_created_at
  on public.change_requests(created_at desc);

create trigger update_change_requests_updated_at
  before update on public.change_requests
  for each row
  execute procedure public.update_updated_at_column();

-- 2) change_request_impact_scopes テーブル
create table if not exists public.change_request_impact_scopes (
  id uuid primary key default gen_random_uuid(),
  change_request_id uuid not null references public.change_requests(id) on delete cascade,
  target_type text not null,
  target_id text not null,
  target_title text not null,
  rationale text,
  confirmed boolean not null default false,
  confirmed_by text,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'change_request_impact_scopes_target_type_check'
      and conrelid = 'public.change_request_impact_scopes'::regclass
  ) then
    alter table public.change_request_impact_scopes
      add constraint change_request_impact_scopes_target_type_check
      check (target_type in ('business_requirement', 'system_requirement', 'system_function', 'file'));
  end if;
end $$;

create index if not exists idx_change_request_impact_scopes_change_request_id
  on public.change_request_impact_scopes(change_request_id);
create index if not exists idx_change_request_impact_scopes_target
  on public.change_request_impact_scopes(target_type, target_id);

create trigger update_change_request_impact_scopes_updated_at
  before update on public.change_request_impact_scopes
  for each row
  execute procedure public.update_updated_at_column();

-- 3) change_request_acceptance_confirmations テーブル
create table if not exists public.change_request_acceptance_confirmations (
  id uuid primary key default gen_random_uuid(),
  change_request_id uuid not null references public.change_requests(id) on delete cascade,
  acceptance_criterion_id text not null,
  acceptance_criterion_source_type text not null,
  acceptance_criterion_source_id text not null,
  acceptance_criterion_description text not null,
  acceptance_criterion_verification_method text,
  status text not null default 'unverified',
  verified_by text,
  verified_at timestamptz,
  evidence text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(change_request_id, acceptance_criterion_id)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'change_request_acceptance_confirmations_status_check'
      and conrelid = 'public.change_request_acceptance_confirmations'::regclass
  ) then
    alter table public.change_request_acceptance_confirmations
      add constraint change_request_acceptance_confirmations_status_check
      check (status in ('unverified', 'verified_ok', 'verified_ng'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'change_request_acceptance_confirmations_source_type_check'
      and conrelid = 'public.change_request_acceptance_confirmations'::regclass
  ) then
    alter table public.change_request_acceptance_confirmations
      add constraint change_request_acceptance_confirmations_source_type_check
      check (acceptance_criterion_source_type in ('business_requirement', 'system_requirement'));
  end if;
end $$;

create index if not exists idx_change_request_acceptance_confirmations_change_request_id
  on public.change_request_acceptance_confirmations(change_request_id);
create index if not exists idx_change_request_acceptance_confirmations_source
  on public.change_request_acceptance_confirmations(acceptance_criterion_source_type, acceptance_criterion_source_id);
create index if not exists idx_change_request_acceptance_confirmations_status
  on public.change_request_acceptance_confirmations(status);

create trigger update_change_request_acceptance_confirmations_updated_at
  before update on public.change_request_acceptance_confirmations
  for each row
  execute procedure public.update_updated_at_column();

commit;
