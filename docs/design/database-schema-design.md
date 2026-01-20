# データベーススキーマ設計書

## 目的

要件管理システムのデータ永続化レイヤーを設計し、業務要件とシステム要件の体系的な管理を実現する。
Supabase（PostgreSQL）をバックエンドとして使用し、フロントエンド（Next.js）からの直接アクセスを前提とする。

## 基本方針

- ID採番はアプリ側で行う（例: `BIZ-001`, `TASK-001`, `BR-TASK-001-001`）
- 段階導入のため、既存のlegacy列（`acceptance_criteria: text[]`）は残しつつ、新列を追加して移行する
- 構造化データはJSONBを使用（`acceptance_criteria_json`など）
- 全テーブルでRLSを有効化（開発時は匿名アクセス許可、本番では認証必須）
- 外部キー制約はcascade deleteを使用

## エンティティ構造

### 1. business_domains（業務一覧）

業務領域の分類管理を行うマスタテーブル。

| カラム | 型 | 制約 | 説明 |
|--------|-----|-------|------|
| id | text | PK | 一意識別子（BIZ-XXX形式） |
| name | text | NOT NULL | 業務名 |
| area | text | NOT NULL | システム領域（AR/AP/GL） |
| summary | text | NOT NULL | 業務概要 |
| business_req_count | integer | NOT NULL DEFAULT 0 | 業務要件数 |
| system_req_count | integer | NOT NULL DEFAULT 0 | システム要件数 |
| created_at | timestamptz | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | timestamptz | NOT NULL DEFAULT now() | 更新日時 |

### 2. business_tasks（業務タスク）

業務プロセスの最小単位を管理するテーブル。

| カラム | 型 | 制約 | 説明 |
|--------|-----|-------|------|
| id | text | PK | 一意識別子（TASK-XXX形式） |
| business_id | text | FK → business_domains(id), CASCADE | 所属業務 |
| name | text | NOT NULL | タスク名（20字以内） |
| summary | text | NOT NULL | 業務概要＋業務フロー（Markdown） |
| person | text | - | 主担当者（ロール名） |
| input | text | - | 業務インプット（カンマ区切り） |
| output | text | - | 業務アウトプット（カンマ区切り） |
| concepts | text[] | NOT NULL DEFAULT '{}' | 関連概念ID配列 |
| business_req_count | integer | NOT NULL DEFAULT 0 | 業務要件数 |
| system_req_count | integer | NOT NULL DEFAULT 0 | システム要件数 |
| sort_order | integer | NOT NULL DEFAULT 0 | 表示順 |
| created_at | timestamptz | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | timestamptz | NOT NULL DEFAULT now() | 更新日時 |

### 3. business_requirements（業務要件）

業務タスクを満たすための具体的な要件を管理するテーブル。

| カラム | 型 | 制約 | 説明 |
|--------|-----|-------|------|
| id | text | PK | 一意識別子（BR-TASK-XXX-XXX形式） |
| task_id | text | FK → business_tasks(id), CASCADE | 所属業務タスク |
| title | text | NOT NULL | 要件名（「〜できること」形式、30字以内） |
| summary | text | NOT NULL | 要件詳細（100〜200字） |
| concept_ids | text[] | NOT NULL DEFAULT '{}' | 関連概念ID配列 |
| srf_id | text | - | 関連システム機能ID |
| system_domain_ids | text[] | NOT NULL DEFAULT '{}' | システム領域ID配列 |
| impacts | text[] | DEFAULT '{}' | 影響するシステム領域ID配列 |
| related_system_requirement_ids | text[] | DEFAULT '{}' | 関連システム要件ID配列 |
| priority | text | NOT NULL DEFAULT 'Must', CHECK IN ('Must','Should','Could') | 優先度 |
| acceptance_criteria | text[] | NOT NULL DEFAULT '{}' | 受入条件（legacy） |
| acceptance_criteria_json | jsonb | NOT NULL DEFAULT '[]' | 受入条件（構造化） |
| sort_order | integer | NOT NULL DEFAULT 0 | 表示順 |
| created_at | timestamptz | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | timestamptz | NOT NULL DEFAULT now() | 更新日時 |

### 4. system_domains（システム領域マスタ）

システム領域の分類を管理するマスタテーブル。

| カラム | 型 | 制約 | 説明 |
|--------|-----|-------|------|
| id | text | PK | 一意識別子（AR/AP/GLなど） |
| name | text | NOT NULL | システム領域名 |
| description | text | NOT NULL DEFAULT '' | 説明 |
| sort_order | integer | NOT NULL DEFAULT 0 | 表示順 |
| created_at | timestamptz | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | timestamptz | NOT NULL DEFAULT now() | 更新日時 |

### 5. system_functions（システム機能）

業務機能を実現するためのシステム機能を管理するテーブル。

| カラム | 型 | 制約 | 説明 |
|--------|-----|-------|------|
| id | text | PK | 一意識別子（SRF-XXX形式） |
| system_domain_id | text | FK → system_domains(id) | 所属システム領域 |
| design_doc_no | text | - | 設計書No |
| category | text | NOT NULL | 機能種別（screen/batch/api/job/interface） |
| title | text | NOT NULL DEFAULT '' | 機能名（30字以内） |
| summary | text | NOT NULL | 機能概要（200字程度） |
| status | text | NOT NULL | 実装状態（not_implemented/implementing/testing/implemented） |
| related_task_ids | text[] | NOT NULL DEFAULT '{}' | 関連業務タスクID |
| requirement_ids | text[] | NOT NULL DEFAULT '{}' | 関連要件ID |
| system_design | jsonb | NOT NULL DEFAULT '[]' | 設計項目配列 |
| code_refs | jsonb | NOT NULL DEFAULT '[]' | 実装参照配列（legacy） |
| entry_points | jsonb | NOT NULL DEFAULT '[]' | エントリポイント配列 |
| created_at | timestamptz | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | timestamptz | NOT NULL DEFAULT now() | 更新日時 |

### 6. system_requirements（システム要件）

システム機能を満たすための技術要件を管理するテーブル。

| カラム | 型 | 制約 | 説明 |
|--------|-----|-------|------|
| id | text | PK | 一意識別子（SR-TASK-XXX-XXX形式） |
| task_id | text | FK → business_tasks(id), CASCADE | 関連業務タスク |
| srf_id | text | FK → system_functions(id) | 所属システム機能 |
| category | text | NOT NULL DEFAULT 'function', CHECK IN ('function','data','exception','auth','non_functional') | 観点種別 |
| title | text | NOT NULL | 要件名（「〜できること」形式、30字以内） |
| summary | text | NOT NULL | 要件詳細（100〜200字） |
| concept_ids | text[] | NOT NULL DEFAULT '{}' | 関連概念ID配列 |
| impacts | text[] | NOT NULL DEFAULT '{}' | 影響するシステム領域ID配列 |
| system_domain_ids | text[] | DEFAULT '{}' | システム領域ID配列 |
| acceptance_criteria | text[] | NOT NULL DEFAULT '{}' | 受入条件（legacy） |
| acceptance_criteria_json | jsonb | NOT NULL DEFAULT '[]' | 受入条件（構造化） |
| business_requirement_ids | text[] | NOT NULL DEFAULT '{}' | 紐づく業務要件ID配列 |
| sort_order | integer | NOT NULL DEFAULT 0 | 表示順 |
| created_at | timestamptz | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | timestamptz | NOT NULL DEFAULT now() | 更新日時 |

### 7. concepts（概念辞書）

業務/システムで使用される用語・概念を管理する辞書テーブル。

| カラム | 型 | 制約 | 説明 |
|--------|-----|-------|------|
| id | text | PK | 一意識別子（C-XXX形式） |
| name | text | NOT NULL | 概念名（正式名称） |
| synonyms | text[] | NOT NULL DEFAULT '{}' | 同義語・別名配列 |
| areas | text[] | NOT NULL DEFAULT '{}' | 影響するシステム領域（AR/AP/GL） |
| definition | text | NOT NULL DEFAULT '' | 定義（Markdown） |
| related_docs | text[] | NOT NULL DEFAULT '{}' | 必読ドキュメントパス |
| requirement_count | integer | NOT NULL DEFAULT 0 | 使用要件数 |
| created_at | timestamptz | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | timestamptz | NOT NULL DEFAULT now() | 更新日時 |

## 構造化データのJSONBスキーマ

### acceptance_criteria_json（受入条件）

```json
[
  {
    "id": "AC-001",
    "description": "請求書に登録番号が表示されること",
    "verification_method": "目視確認"
  }
]
```

### entry_points（エントリポイント）

```json
[
  {
    "path": "/app/billing/invoice/page.tsx",
    "type": "screen",
    "responsibility": "発行指示、一覧表示"
  }
]
```

### system_design（システム設計項目）

```json
[
  {
    "category": "architecture",
    "title": "アーキテクチャ設計",
    "content": "マイクロサービスアーキテクチャ採用..."
  }
]
```

## インデックス戦略

### パフォーマンスインデックス
- business_domains: (area), (name)
- system_functions: (category), (status), (system_domain_id)
- system_requirements: (task_id), (srf_id), (category)
- business_tasks: (business_id), (sort_order)
- business_requirements: (task_id), (srf_id)
- system_domains: (sort_order)
- concepts: (areas), (name)

### 外部キーインデックス
- business_tasks.business_id → business_domains.id
- business_requirements.task_id → business_tasks.id
- system_functions.system_domain_id → system_domains.id
- system_requirements.task_id → business_tasks.id
- system_requirements.srf_id → system_functions.id

## データ整合性制約

### CHECK制約
- business_requirements.priority: ('Must','Should','Could')
- system_requirements.category: ('function','data','exception','auth','non_functional')

### NOT NULL制約
- 必須フィールドは全てNOT NULL
- 配列フィールドはDEFAULT '{}'または'[]'で初期化

## RLS（Row Level Security）ポリシー

### 開発環境
- 全テーブルで匿名アクセス許可（SELECT/INSERT/UPDATE/DELETE）

### 本番環境（将来拡張）
- プロジェクトメンバー限定アクセス
- 変更要求チケット単位での版管理