# モックCRUD設計（Supabase）

## 目的
モック段階の永続化をSupabaseに寄せ、業務一覧・システム機能一覧・概念辞書のCRUDを一貫して動作させる。

## 前提
- フロントエンドは `@supabase/supabase-js` の公開キーで直接アクセスする
- 開発用途のため、RLSは「匿名アクセス可」のポリシーを設定（本番では必ず見直す）
- ID採番はアプリ側で行う（例: `BIZ-001`, `SRF-001`, `C001`）

## PRD v1.3 対応メモ
- 参照: `docs/prd.md` の 1.8 / 2.7.1 / 2.8.1
- 段階導入のため、既存の legacy 列（`acceptance_criteria: text[]`, `code_refs`）は残しつつ、新列を追加して移行する（KISS）。

## 環境変数
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## テーブル設計

### business_domains
| カラム | 型 | 備考 |
| --- | --- | --- |
| id | text | PK（例: BIZ-001） |
| name | text | 業務名 |
| area | text | AR / AP / GL |
| summary | text | 業務概要 |
| business_req_count | integer | 業務要件数 |
| system_req_count | integer | システム要件数 |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

### system_functions
| カラム | 型 | 備考 |
| --- | --- | --- |
| id | text | PK（例: SRF-001） |
| system_domain_id | text | FK（system_domains.id） |
| design_doc_no | text | 設計書No |
| category | text | screen / internal / interface（PRD v1.3では screen / batch / api / job / interface へ拡張予定） |
| title | text | 機能名 |
| summary | text | 機能概要 |
| status | text | not_implemented / implementing / testing / implemented |
| related_task_ids | text[] | 関連タスクID |
| requirement_ids | text[] | 関連要件ID |
| system_design | jsonb | システム設計項目配列 |
| code_refs | jsonb | 実装参照配列（legacy: paths配列） |
| entry_points | jsonb | エントリポイント配列（構造化: path/type/responsibility） |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

### system_requirements
| カラム | 型 | 備考 |
| --- | --- | --- |
| id | text | PK（例: SR-TASK-001-001） |
| task_id | text | FK（business_tasks.id） |
| srf_id | text | FK（system_functions.id） |
| category | text | 観点種別（function / data / exception / auth / non_functional） |
| title | text | システム要件タイトル |
| summary | text | システム要件概要 |
| concept_ids | text[] | 関連概念ID配列 |
| impacts | text[] | 影響するシステム領域ID配列 |
| system_domain_ids | text[] | システム領域ID配列（補助） |
| acceptance_criteria | text[] | 受入条件（legacy） |
| acceptance_criteria_json | jsonb | 受入条件（構造化: jsonb配列） |
| business_requirement_ids | text[] | 紐づく業務要件ID配列（Phase 1では空配列で初期化） |
| sort_order | integer | 表示順 |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

### business_tasks
| カラム | 型 | 備考 |
| --- | --- | --- |
| id | text | PK（例: TASK-001） |
| business_id | text | FK（business_domains.id） |
| name | text | 業務タスク名 |
| summary | text | 業務概要 |
| person | text | 担当者 |
| input | text | インプット |
| output | text | アウトプット |
| concepts | text[] | 関連概念ID配列 |
| business_req_count | integer | 業務要件数 |
| system_req_count | integer | システム要件数 |
| sort_order | integer | 表示順 |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

### business_requirements
| カラム | 型 | 備考 |
| --- | --- | --- |
| id | text | PK（例: BR-TASK-001-001） |
| task_id | text | FK（business_tasks.id） |
| title | text | 業務要件タイトル |
| summary | text | 業務要件概要 |
| concept_ids | text[] | 関連概念ID配列 |
| srf_id | text | 関連システム機能ID |
| system_domain_ids | text[] | システム領域ID配列 |
| impacts | text[] | 影響するシステム領域ID配列 |
| related_system_requirement_ids | text[] | 関連システム要件ID配列 |
| priority | text | 優先度（Must / Should / Could） |
| acceptance_criteria | text[] | 受入条件（legacy） |
| acceptance_criteria_json | jsonb | 受入条件（構造化: jsonb配列） |
| sort_order | integer | 表示順 |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

### system_domains
| カラム | 型 | 備考 |
| --- | --- | --- |
| id | text | PK（例: AR） |
| name | text | システム領域名 |
| description | text | 説明 |
| sort_order | integer | 表示順 |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

### concepts
| カラム | 型 | 備考 |
| --- | --- | --- |
| id | text | PK（例: C001） |
| name | text | 概念名 |
| synonyms | text[] | 同義語 |
| areas | text[] | AR / AP / GL |
| definition | text | 定義 |
| related_docs | text[] | 必読ドキュメント |
| requirement_count | integer | 使用要件数 |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

## 推奨インデックス
- business_domains: (area), (name)
- system_functions: (category), (status)
- system_functions: (system_domain_id)
- system_requirements: (task_id), (srf_id), (category)
- business_tasks: (business_id), (sort_order)
- business_requirements: (task_id), (srf_id)
- system_domains: (sort_order)
- concepts: (areas), (name)

## RLS（開発用）
- 全テーブルで `anon` の SELECT/INSERT/UPDATE/DELETE を許可
- 本番運用では必ず見直す

## Supabase MCP 実行手順（概要）
1. `apply_migration` でDDLを適用
2. `execute_sql` でseed投入

補足（KISS）:
- 段階導入用のmigrationは `supabase/migrations/` に置く
- WSL環境などでMCP/CLIのDB操作が難しい場合、`DATABASE_URL` を設定して `bun scripts/db/apply-phase1-migrations.ts` でPhase 1のDDL＋バックフィルを適用できる

## DDLサンプル
```sql
create table if not exists public.business_domains (
  id text primary key,
  name text not null,
  area text not null,
  summary text not null,
  business_req_count integer not null default 0,
  system_req_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_tasks (
  id text primary key,
  business_id text not null references public.business_domains(id) on delete cascade,
  name text not null,
  summary text not null,
  person text,
  input text,
  output text,
  concepts text[] not null default '{}',
  business_req_count integer not null default 0,
  system_req_count integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.system_domains (
  id text primary key,
  name text not null,
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.system_functions (
  id text primary key,
  system_domain_id text references public.system_domains(id),
  design_doc_no text,
  category text not null,
  title text not null default '',
  summary text not null,
  status text not null,
  related_task_ids text[] not null default '{}',
  requirement_ids text[] not null default '{}',
  system_design jsonb not null default '[]',
  code_refs jsonb not null default '[]',
  entry_points jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_requirements (
  id text primary key,
  task_id text not null references public.business_tasks(id) on delete cascade,
  title text not null,
  summary text not null,
  concept_ids text[] not null default '{}',
  srf_id text,
  system_domain_ids text[] not null default '{}',
  impacts text[] default '{}',
  related_system_requirement_ids text[] default '{}',
  priority text not null default 'Must' check (priority in ('Must', 'Should', 'Could')),
  acceptance_criteria text[] not null default '{}',
  acceptance_criteria_json jsonb not null default '[]',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.system_requirements (
  id text primary key,
  task_id text not null references public.business_tasks(id) on delete cascade,
  srf_id text references public.system_functions(id),
  category text not null default 'function' check (category in ('function', 'data', 'exception', 'auth', 'non_functional')),
  title text not null,
  summary text not null,
  concept_ids text[] not null default '{}',
  impacts text[] not null default '{}',
  system_domain_ids text[] default '{}',
  acceptance_criteria text[] not null default '{}',
  acceptance_criteria_json jsonb not null default '[]',
  business_requirement_ids text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.concepts (
  id text primary key,
  name text not null,
  synonyms text[] not null default '{}',
  areas text[] not null default '{}',
  definition text not null default '',
  related_docs text[] not null default '{}',
  requirement_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## RLSサンプル
```sql
alter table public.business_domains enable row level security;
alter table public.system_functions enable row level security;
alter table public.system_requirements enable row level security;
alter table public.business_tasks enable row level security;
alter table public.system_domains enable row level security;
alter table public.business_requirements enable row level security;
alter table public.concepts enable row level security;

create policy "anon_read_business_domains" on public.business_domains for select using (true);
create policy "anon_write_business_domains" on public.business_domains for insert with check (true);
create policy "anon_update_business_domains" on public.business_domains for update using (true);
create policy "anon_delete_business_domains" on public.business_domains for delete using (true);

create policy "anon_read_system_functions" on public.system_functions for select using (true);
create policy "anon_write_system_functions" on public.system_functions for insert with check (true);
create policy "anon_update_system_functions" on public.system_functions for update using (true);
create policy "anon_delete_system_functions" on public.system_functions for delete using (true);

create policy "anon_read_system_requirements" on public.system_requirements for select using (true);
create policy "anon_write_system_requirements" on public.system_requirements for insert with check (true);
create policy "anon_update_system_requirements" on public.system_requirements for update using (true);
create policy "anon_delete_system_requirements" on public.system_requirements for delete using (true);

create policy "anon_read_business_tasks" on public.business_tasks for select using (true);
create policy "anon_write_business_tasks" on public.business_tasks for insert with check (true);
create policy "anon_update_business_tasks" on public.business_tasks for update using (true);
create policy "anon_delete_business_tasks" on public.business_tasks for delete using (true);

create policy "anon_read_system_domains" on public.system_domains for select using (true);
create policy "anon_write_system_domains" on public.system_domains for insert with check (true);
create policy "anon_update_system_domains" on public.system_domains for update using (true);
create policy "anon_delete_system_domains" on public.system_domains for delete using (true);

create policy "anon_read_business_requirements" on public.business_requirements for select using (true);
create policy "anon_write_business_requirements" on public.business_requirements for insert with check (true);
create policy "anon_update_business_requirements" on public.business_requirements for update using (true);
create policy "anon_delete_business_requirements" on public.business_requirements for delete using (true);

create policy "anon_read_concepts" on public.concepts for select using (true);
create policy "anon_write_concepts" on public.concepts for insert with check (true);
create policy "anon_update_concepts" on public.concepts for update using (true);
create policy "anon_delete_concepts" on public.concepts for delete using (true);
```

## 画面導線（URLメモ）
- `/business` → `/business/[id]/tasks` → `/business/[id]/tasks/[taskId]`
- `/system-domains` → `/system-domains/[id]` → `/system-domains/[id]/functions/[srfId]`

## Seed方針
- `lib/mock/data` の内容をそのまま投入
- Supabase MCPで `execute_sql` を使ってINSERTする
- システム領域マスタ（system_domains）は初期3件（AR/AP/GL）を投入
- 初期投入後はSupabaseを正とし、フロントのCRUDはSupabaseのみを参照
