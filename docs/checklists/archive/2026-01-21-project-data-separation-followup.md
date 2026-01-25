# プロジェクト単位データ管理機能 残作業チェックリスト

## 作業概要
プロジェクト単位の完全分離を仕上げるため、未対応の作成系/検索系/詳細取得系と、未追加テーブルのproject_id対応を実施する。

---

## 更新対象ファイルチェックリスト

### 1. 追加テーブルのproject_id対応（DB）
**ファイル**: `supabase/migrations/xxxx_add_project_id_to_subtables.sql`

#### 実装項目
- [x] `business_tasks` に `project_id` を追加し、`projects(id)` 参照 + `ON DELETE CASCADE` を設定
- [x] `business_requirements` に `project_id` を追加し、`projects(id)` 参照 + `ON DELETE CASCADE` を設定
- [x] `system_requirements` に `project_id` を追加し、`projects(id)` 参照 + `ON DELETE CASCADE` を設定
- [x] `system_functions` に `project_id` を追加し、`projects(id)` 参照 + `ON DELETE CASCADE` を設定
- [x] 既存データの `project_id` を `00000000-0000-0000-0000-000000000001` にバックフィル
- [x] 4テーブルすべてで `project_id` を `NOT NULL` に変更
- [x] 4テーブルすべてで `project_id` のインデックスを追加

#### 確認項目
- [x] 4テーブルの `project_id` が全件埋まっている
- [x] 外部キー制約が正しく作成されている

---

### 2. 作成系でproject_id自動設定（データ層）
**ファイル**: `lib/data/businesses.ts`

#### 実装項目
- [x] `createBusiness` に `projectId` 引数を追加（またはContext経由で注入）
- [x] INSERT時に `project_id` を必ず付与する

#### 確認項目
- [x] 新規作成時に `project_id` が `NULL` にならない

---

**ファイル**: `lib/data/system-domains.ts`

#### 実装項目
- [x] `createSystemDomain` に `projectId` 引数を追加（またはContext経由で注入）
- [x] INSERT時に `project_id` を必ず付与する

#### 確認項目
- [x] 新規作成時に `project_id` が `NULL` にならない

---

**ファイル**: `lib/data/concepts.ts`

#### 実装項目
- [x] `createConcept` に `projectId` 引数を追加（またはContext経由で注入）
- [x] INSERT時に `project_id` を必ず付与する

#### 確認項目
- [x] 新規作成時に `project_id` が `NULL` にならない

---

**ファイル**: `lib/data/change-requests.ts`

#### 実装項目
- [x] `createChangeRequest` に `projectId` 引数を追加（またはContext経由で注入）
- [x] INSERT時に `project_id` を必ず付与する

#### 確認項目
- [x] 新規作成時に `project_id` が `NULL` にならない

---

### 3. 作成系の呼び出し側にproject_id反映（UI/Action層）
**ファイル**: `app/**`（作成フォーム/アクション周辺）

#### 実装項目
- [x] 既存の作成フローを洗い出し、`useProject()` から `currentProjectId` を取得
- [x] 作成時に `projectId` をデータ層へ渡す（未取得ならエラー/ガード）

#### 確認項目
- [x] すべての新規作成が現在のプロジェクトに紐付く

---

### 4. 検索機能でproject_idを考慮
**ファイル**: `app/business/page.tsx`

#### 実装項目
- [x] 検索用のデータ取得が `currentProjectId` を考慮するよう修正
- [x] フロントエンド側のフィルタだけに依存しない取得ロジックに変更

#### 確認項目
- [x] 検索結果が他プロジェクトのデータを含まない

---

**ファイル**: `app/**`（他の検索UI/検索処理があるページ）

#### 実装項目
- [x] 既存検索機能を洗い出し、`project_id` フィルタを追加

#### 確認項目
- [x] すべての検索結果が現在のプロジェクト内に限定される

---

### 5. 詳細取得（getById系）でproject_idを考慮
**ファイル**: `lib/data/**`（getById系）

#### 実装項目
- [x] `getBusinessById` / `getSystemDomainById` / `getConceptById` / `getChangeRequestById` の取得条件に `project_id` を追加
- [x] 返却結果が `currentProjectId` と一致しない場合は `null` 扱いにする

#### 確認項目
- [x] 他プロジェクトのIDを直接指定しても表示されない

---

### 6. 追加テーブルのデータ層対応
**ファイル**: `lib/data/**`（business_tasks / business_requirements / system_requirements / system_functions 関連）

#### 実装項目
- [x] 4テーブルのCRUD/取得系で `project_id` を扱うよう統一
- [x] list系は `projectId` フィルタを追加
- [x] create系は `project_id` を必ず付与
- [x] getById系は `project_id` を考慮

#### 確認項目
- [x] 4テーブルのデータがプロジェクト単位で分離される

---

## 統合テスト項目

### DB検証（Supabase MCP）
- [x] `projects` と 4テーブルの `project_id` が整合している
- [x] 新規作成データの `project_id` が現在プロジェクトと一致する

### UI/UX検証（Playwright MCP）
- [x] 既存プロジェクトで新規作成が成功し、一覧に反映される
- [x] 別プロジェクトへ切替後、作成/検索/詳細で他プロジェクトのデータが混ざらない
- [x] 他プロジェクトのIDを直接指定しても表示されない（404）
- [x] ページリロード後も `currentProjectId` が維持される

---

## 発見された問題（解決済み）

### ID採番ロジック（グローバル採番）
**方針**: グローバル採番（全プロジェクトで通し番号）

**確認済み**:
- ✅ プロジェクト間でIDが重複しない
- ✅ 採番が連続している（最大値+1方式）
- ✅ `listBusinesses()` が全プロジェクトのIDを取得して採番している

**テスト結果**:
| プロジェクト | 作成されたID |
|------------|------------|
| テストプロジェクトA | BIZ-004 |
| テストプロジェクトB | BIZ-005 |
| 新会計システムプロジェクト | BIZ-006 |

---

## 完了基準
- [x] 上記すべてのチェック項目が完了している（※ID採番問題あり）
- [x] アプリケーションがエラーなく起動する
- [x] Playwright MCPで主要フローが問題なく動作する
- [x] コードレビューが完了している（該当する場合）

---

## 結果サマリー

✅ **プロジェクト単位データ分離が完了**
- 新規作成、検索、詳細取得すべてで `project_id` が考慮されている
- プロジェクト間でデータが正しく分離されている
- ページリロード後も `currentProjectId` が維持される

✅ **ID採番ロジック（グローバル採番）が正しく機能**
- 全プロジェクトで通し番号（BIZ-001, BIZ-002...）
- プロジェクト間でIDが重複しない
- 採番が連続している（最大値+1方式）
