# テーブル定義設計書更新計画

## Context

要件管理システムのデータベーススキーマ設計書（`docs/design/database-schema-design.md`）を最新化する。

### 現状の課題
- 既存の設計書はPhase 1〜4の段階で作成され、その後の変更が反映されていない
- Supabaseの実際のテーブル定義と設計書に乖離がある
- Phase 5で追加された `investigation_results`、最新の `key_label_mappings` などが未記載
- `project_id` の追加によるマルチプロジェクト対応が反映されていない
- `acceptance_criteria` が独立テーブル化した変更が反映されていない

### 目的
- Supabaseの実際のテーブル定義と完全に同期された設計書を作成する
- TypeScriptの型定義（`lib/domain/schemas/`）との対応関係も明記する
- JSONBフィールドのスキーマ定義を含める

---

## 実装計画

### 1. 既存設計書のバックアップと構造見直し

#### ファイル
- `docs/design/database-schema-design.md`（上書き更新）

#### 変更内容
以下のセクション構成で再構成する：
1. **目的と基本方針**（既存を維持・更新）
2. **テーブル定義一覧**（全18テーブル）
3. **リレーション図**（ER図のテキスト表現）
4. **JSONBスキーマ詳細**（structured designなど）
5. **TypeScript型対応表**

### 2. テーブル定義の網羅的記述

#### 対象テーブル（18テーブル）

**プロジェクト管理系（2テーブル）**
- `projects` - プロジェクト本体
- `product_requirements` - 製品要件

**業務要件系（3テーブル）**
- `business_domains` - 業務領域マスタ（PK: area + project_idの複合キー）
- `business_tasks` - 業務タスク（input/outputはJSONB化）
- `business_requirements` - 業務要件

**システム要件系（4テーブル）**
- `system_domains` - システム領域マスタ
- `system_functions` - システム機能
- `system_requirements` - システム要件
- `acceptance_criteria` - 受入条件（独立テーブル化）

**設計・連携系（4テーブル）**
- `design_documents` - 設計書（旧impl_unit_sds）
- `requirement_links` - 要件関連付け
- `concepts` - 概念辞書

**変更管理系（5テーブル）**
- `change_requests` - 変更要求
- `change_request_impact_scopes` - 変更影響範囲
- `change_request_acceptance_confirmations` - 変更受入確認
- `investigation_results` - 影響調査結果（Phase 5）
- `key_label_mappings` - キーラベルマッピング

#### 各テーブルの記載内容
```markdown
### テーブル名
- **説明**: テーブルの用途
- **PK**: 主キー
- **FK**: 外部キー制約
- **インデックス**: パフォーマンス用インデックス
- **CHECK制約**: 列挙型チェック
- **カラム定義**:
  | カラム名 | 型 | NOT NULL | DEFAULT | 説明 |
```

### 3. 変更点の反映

#### 主な変更点
1. **project_id追加**: 全テーブルに追加（FK → projects.id）
2. **acceptance_criteria独立**: system_requirementsから分離
3. **input/output JSONB化**: business_tasksでJSONB型に変更
4. **srf_ids配列化**: 複数SRFとの関連をサポート
5. **sort_order追加**: 複数テーブルに表示順追加

### 4. JSONBスキーマのドキュメント化

#### 対象JSONBフィールド
- `business_tasks.input` / `output` - 業務入出力
- `system_functions.system_design` - システム設計項目
- `system_functions.entry_points` - エントリポイント
- `system_requirements.acceptance_criteria_json` - 受入条件（構造化）
- `design_documents.details` - 設計書詳細（StructuredDesignDocumentSpec）
- `projects.investigation_settings` - 調査設定
- `projects.llm_settings` - LLM設定

#### TypeScriptスキーマ対応
- `lib/domain/schemas/design-document-structured.ts` → `design_documents.details`
- `lib/domain/schemas/io-schemas.ts` → 入出力定義
- `lib/domain/schemas/deliverable.ts` → 成果物型

### 5. リレーション図の作成

#### テキストベースのER図
```mermaid
erDiagram
    projects ||--o{ business_domains : "has"
    projects ||--o{ business_tasks : "has"
    projects ||--o{ system_functions : "has"
    ...
```

---

## 検証計画

### 1. Supabase定義との照合
- Supabase MCPで取得したテーブル定義と設計書を照合
- カラム名、型、制約が完全に一致していることを確認

### 2. TypeScript型との整合性確認
- `lib/domain/schemas/` 以下の型定義とJSONBスキーマの対応を確認
- 特に `design_documents.details` の `StructuredDesignDocumentSpec` を確認

### 3. マイグレーションファイルとの整合性
- 最新のマイグレーションファイル（`20260207_key_label_mappings.sql` など）との整合性を確認

---

## 出力ファイル

- `docs/design/database-schema-design.md`（更新）

---

## 参考ファイル

### 既存資料
- `docs/design/database-schema-design.md`（既存設計書）
- `supabase/migrations/*.sql`（マイグレーションファイル）

### TypeScriptスキーマ
- `lib/domain/schemas/design-document-structured.ts`
- `lib/domain/schemas/io-schemas.ts`
- `lib/domain/schemas/deliverable.ts`
- `lib/domain/schemas/fields.ts`
- `lib/domain/schemas/core-logic.ts`
- `lib/domain/schemas/exceptions.ts`
- `lib/domain/schemas/non-functional.ts`
- `lib/domain/schemas/side-effects.ts`

### 関連設計書
- `docs/design/dd-io-schema-writing-guide.md` - 設計書I/Oスキーマ記述ガイド
