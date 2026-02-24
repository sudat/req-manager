create extension if not exists pgcrypto;

create table if not exists public.key_label_mappings (
  id text primary key default gen_random_uuid()::text,
  project_id uuid not null references public.projects(id) on delete cascade,
  context text not null,
  physical_key text not null,
  logical_label text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint key_label_mappings_unique unique (project_id, context, physical_key)
);

create index if not exists idx_key_label_mappings_project_context
  on public.key_label_mappings (project_id, context);

create or replace function public.set_updated_at_key_label_mappings()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_key_label_mappings_updated_at on public.key_label_mappings;
create trigger trg_key_label_mappings_updated_at
before update on public.key_label_mappings
for each row execute function public.set_updated_at_key_label_mappings();
