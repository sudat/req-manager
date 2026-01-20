# Phase 2: データベーススキーマ（change_request_acceptance_confirmations テーブル作成）

## 目的

Phase 1でPRDに明記した設計原則「受入条件の定義と確認状態を分離する」を実現するため、変更要求管理のためのデータベーススキーマを作成する。

| 管理対象 | 保持するもの | 管理場所 |
|----------|-------------|----------|
| 受入条件定義 | description + verification_method | ベースライン仕様（業務要件・システム要件） |
| 確認状態 | status + verified_by + verified_at + evidence | **変更要求チケット（新規テーブル）** |

---

## 設計原則

- **KISS**: 3テーブルのみのシンプルな構造
- **DRY**: 既存のマイグレーションパターンを再利用
- **YAGNI**: 今は必要なフィールドのみ定義

---

## テーブル構造

### 1. change_requests テーブル

変更要求の本体を管理するテーブル。

| カラム | 型 | 説明 |
|--------|------|------|
| id | uuid | 主キー |
| ticket_id | text | CR-001形式（一意制約） |
| title | text | タイトル |
| description | text | 説明 |
| background | text | 背景・目的 |
| expected_benefit | text | 期待効果 |
| status | text | open/review/approved/applied |
| priority | text | low/medium/high |
| requested_by | text | 起票者 |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時（自動更新） |

### 2. change_request_impact_scopes テーブル

変更要求の影響範囲を管理するテーブル。

| カラム | 型 | 説明 |
|--------|------|------|
| id | uuid | 主キー |
| change_request_id | uuid | 外部キー（change_requests） |
| target_type | text | business_requirement/system_requirement/system_function/file |
| target_id | text | BR-TASK-003-001 など |
| target_title | text | 対象タイトル |
| rationale | text | 影響根拠 |
| confirmed | boolean | 確認済みフラグ |
| confirmed_by | text | 確認者 |
| confirmed_at | timestamptz | 確認日時 |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

### 3. change_request_acceptance_confirmations テーブル

受入条件の確認状態を管理するテーブル。**設計原則: 変更要求ごとに独立した版管理を行う**

| カラム | 型 | 説明 |
|--------|------|------|
| id | uuid | 主キー |
| change_request_id | uuid | 外部キー（change_requests） |
| acceptance_criterion_id | text | AC-001形式 |
| acceptance_criterion_source_type | text | business_requirement/system_requirement |
| acceptance_criterion_source_id | text | BR/SR-TASK-003-001 |
| acceptance_criterion_description | text | 非正規化（参照元削除時も保持） |
| acceptance_criterion_verification_method | text | 非正規化 |
| status | text | unverified/verified_ok/verified_ng |
| verified_by | text | 確認者 |
| verified_at | timestamptz | 確認日時 |
| evidence | text | 確認根拠（URL、テキスト等） |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

**ユニーク制約**: `(change_request_id, acceptance_criterion_id)` - 同一変更要求内で同じ受入条件IDは1つのみ

---

## Critical Files

| ファイル | 操作 | 説明 |
|---------|------|------|
| `supabase/migrations/20260120000000_prd_v1_3_phase2_change_requests.sql` | 新規作成 | Phase 2のメインマイグレーション |
| `lib/domain/value-objects.ts` | 変更 | 新しい型定義を追加 |
| `lib/data/structured.ts` | 変更 | AcceptanceCriterionJsonから確認状態フィールドを削除 |

---

## マイグレーションSQL

**ファイル**: `supabase/migrations/20260120000000_prd_v1_3_phase2_change_requests.sql`

```sql
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
```

---

## TypeScript型定義の追加

**ファイル**: `lib/domain/value-objects.ts`

```typescript
/**
 * 変更要求（PRD v1.3 Phase 2）
 */
export interface ChangeRequest {
  id: string;                    // UUID
  ticketId: string;              // CR-001
  title: string;
  description: string | null;
  background: string | null;
  expectedBenefit: string | null;
  status: ChangeRequestStatus;
  priority: ChangeRequestPriority;
  requestedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 影響範囲（PRD v1.3 Phase 2）
 */
export interface ImpactScope {
  id: string;
  changeRequestId: string;
  targetType: ImpactScopeTargetType;
  targetId: string;
  targetTitle: string;
  rationale: string | null;
  confirmed: boolean;
  confirmedBy: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 受入条件確認状態（PRD v1.3 Phase 2）
 * 設計原則: 変更要求ごとに独立した版管理を行う
 */
export interface AcceptanceConfirmation {
  id: string;
  changeRequestId: string;
  acceptanceCriterionId: string;
  acceptanceCriterionSourceType: AcceptanceCriterionSourceType;
  acceptanceCriterionSourceId: string;
  acceptanceCriterionDescription: string;
  acceptanceCriterionVerificationMethod: string | null;
  status: AcceptanceConfirmationStatus;
  verifiedBy: string | null;
  verifiedAt: string | null;
  evidence: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ChangeRequestStatus = 'open' | 'review' | 'approved' | 'applied';
export type ChangeRequestPriority = 'low' | 'medium' | 'high';
export type ImpactScopeTargetType = 'business_requirement' | 'system_requirement' | 'system_function' | 'file';
export type AcceptanceCriterionSourceType = 'business_requirement' | 'system_requirement';
export type AcceptanceConfirmationStatus = 'unverified' | 'verified_ok' | 'verified_ng';
```

---

## 既存コードの修正

**ファイル**: `lib/data/structured.ts`

`AcceptanceCriterionJson` から確認状態フィールドを削除:

```typescript
export type AcceptanceCriterionJson = {
  id: string;
  description: string;
  verification_method: string | null;
  // Phase 2で削除: status, verified_by, verified_at, evidence
};
```

---

## 実装の難易度

```
難易度: ★☆☆
根拠: 3 files, 200+ lines, 新規マイグレーション + 型定義追加
```

---

## 検証方法

1. マイグレーション実行
   ```bash
   supabase db push
   ```

2. テーブル作成確認
   ```sql
   \d public.change_requests
   \d public.change_request_impact_scopes
   \d public.change_request_acceptance_confirmations
   ```

3. 制約確認
   ```sql
   -- 制約一覧
   select conname, pg_get_constraintdef(oid)
   from pg_constraint
   where conrelid in ('public.change_requests'::regclass, 'public.change_request_impact_scopes'::regclass, 'public.change_request_acceptance_confirmations'::regclass);
   ```

4. インデックス確認
   ```sql
   select indexname, indexdef
   from pg_indexes
   where tablename in ('change_requests', 'change_request_impact_scopes', 'change_request_acceptance_confirmations');
   ```

5. TypeScriptコンパイル確認
   ```bash
   bun run build
   ```

---

## 次フェーズへの依存

Phase 2完了後、以下のフェーズで実装:
- **Phase 3**: ドメイン層（`AcceptanceCriterionJson` から status/verified_* を削除）
- **Phase 4**: リポジトリ層（確認状態のCRUD）
- **Phase 5**: UI実装（確認状態入力コンポーネント）
