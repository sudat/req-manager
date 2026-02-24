-- MCP監査ログテーブル追加

begin;

create table if not exists public.mcp_audit_logs (
  id uuid primary key default gen_random_uuid(),
  request_id text not null,
  project_id uuid not null,
  tool_name text not null,
  transport text not null,
  guard_mode text not null,
  auth_result text not null,
  rate_limit_result text not null,
  status_code integer not null,
  duration_ms integer not null,
  blocked boolean not null default false,
  arg_keys text[] not null default '{}',
  error_code text,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'mcp_audit_logs_transport_check'
      and conrelid = 'public.mcp_audit_logs'::regclass
  ) then
    alter table public.mcp_audit_logs
      add constraint mcp_audit_logs_transport_check
      check (transport in ('jsonrpc', 'simple'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'mcp_audit_logs_guard_mode_check'
      and conrelid = 'public.mcp_audit_logs'::regclass
  ) then
    alter table public.mcp_audit_logs
      add constraint mcp_audit_logs_guard_mode_check
      check (guard_mode in ('off', 'observe', 'enforce'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'mcp_audit_logs_auth_result_check'
      and conrelid = 'public.mcp_audit_logs'::regclass
  ) then
    alter table public.mcp_audit_logs
      add constraint mcp_audit_logs_auth_result_check
      check (auth_result in ('pass', 'fail', 'skipped'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'mcp_audit_logs_rate_limit_result_check'
      and conrelid = 'public.mcp_audit_logs'::regclass
  ) then
    alter table public.mcp_audit_logs
      add constraint mcp_audit_logs_rate_limit_result_check
      check (rate_limit_result in ('pass', 'fail', 'skipped'));
  end if;
end $$;

create index if not exists idx_mcp_audit_logs_project_created
  on public.mcp_audit_logs(project_id, created_at desc);

create index if not exists idx_mcp_audit_logs_request_id
  on public.mcp_audit_logs(request_id);

create index if not exists idx_mcp_audit_logs_tool_name
  on public.mcp_audit_logs(tool_name);

commit;
