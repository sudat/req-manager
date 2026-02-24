# DB Schema Audit (Design vs Migrations vs Real DB)

Date: 2026-02-23

Target Supabase project:
- Name: req-manager
- Ref: mbzvpmcikjncjrnbusdn

## Why

Checklist item: `docs/checklists/active/2026-02-23-prd-implementation-alignment.md` -> `2-5. DBスキーマとマイグレーションの整合（再現性）`

Goal:
- Eliminate: "Supabase実DBでは動くが、migrationsから再現できない"
- Confirm using real DB state (tables/columns/indexes/RLS/data)

## Real DB Snapshot (high level)

Public tables (20 total, including 1 backup table):
- Core tables (19):
  - projects, product_requirements
  - business_domains, business_tasks, business_requirements
  - system_domains, system_functions, system_requirements, acceptance_criteria
  - design_documents, requirement_links, concepts
  - change_requests, change_request_impact_scopes, change_request_acceptance_confirmations
  - investigation_results, key_label_mappings
  - mcp_audit_logs, design_decision_logs
- Operational backup (1):
  - _backup_business_context_20260214

Notes:
- RLS is enabled only on a subset of tables (business_* / concepts / system_* requirements-related).
- Several tables have "legacy" constraint/index names (e.g. `impact_domains_pkey`, `tasks_pkey`) due to rename history.

## Key Findings

### 1) Schema drift between local `supabase/migrations/**` and real DB migration history

Real DB had `supabase_migrations.schema_migrations` versions that were not present locally.
Also, some local migration filenames/versions did not match the real DB's applied versions.

Impact:
- Supabase CLI push/pull and "reproducible setup" were brittle.

Fix in repo:
- Local migration filenames were aligned to the real DB's applied version list.
- Missing historical versions were added as no-op placeholders.

### 2) RLS / policy definitions existed in real DB but were not captured in migrations

Real DB:
- RLS enabled tables had permissive anon/public policies.
Local migrations:
- Had no RLS enable/policy creation, so a fresh DB could not reproduce behavior.

Fix in repo:
- Added baseline migration `supabase/migrations/20260113073706_create_basic_crud_tables.sql` that creates core tables and reproduces the same RLS+policies.

### 3) Multi-project separation gaps in change request subtables (real DB)

Real DB was missing:
- `change_request_impact_scopes.project_id`
- `change_request_acceptance_confirmations.project_id`

Also missing:
- `investigation_results.project_id` FK to `projects(id)`

Fix in repo:
- Prepared and applied to the real DB (2026-02-23). These filenames now match the real DB's `supabase_migrations.schema_migrations` versions:
  - `supabase/migrations/20260223231602_add_bottom_up_result_to_investigation_results.sql`
  - `supabase/migrations/20260223231621_add_project_id_to_change_request_subtables.sql`

### 4) Bottom-up analysis storage column missing in real DB

Real DB was missing:
- `investigation_results.bottom_up_result`

Fix in repo:
- Prepared migration `supabase/migrations/20260223231602_add_bottom_up_result_to_investigation_results.sql`

### 5) Supabase local config version mismatch

Local `supabase/config.toml` had:
- `db.major_version = 15`

Real DB uses Postgres 17.

Fix in repo:
- Updated `supabase/config.toml` -> `db.major_version = 17`

## Repo Changes (What We Did)

- `supabase/config.toml`: align Postgres major version.
- `supabase/migrations/**`:
  - Align migration versions to real DB history.
  - Add missing migration placeholders.
  - Add baseline migration to make fresh setup reproducible (core tables + RLS policies).
  - Make some historical migrations idempotent (avoid failing when already in the final schema).
- `docs/design/database-schema-design.md`:
  - Reflect the actual additional tables (audit logs / backup table).
  - Clarify current RLS operation (partial enable).

## Remaining Work (to close the loop)

- Confirm real DB schema after applying (columns exist, NOT NULL, indexes, FK, and data has no project_id drift).
- Run `agent-browser` E2E checks (project switching if multiple projects exist; otherwise CRUD + export correctness on the current project).
