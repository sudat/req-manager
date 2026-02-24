# PRD構想との整合修正（ズレ/不足の一括解消）チェックリスト

## 作業概要

`docs/overview/PRD_overview.md`（構想）と現状実装を突き合わせて見つかった「ズレ/不足」を、UX観点も含めて一括で解消する。
対象は以下（今回の指摘分を全て含む）:

- ベースライン画面の導線不整合（`/baseline/{version}` が 404 / ダミー運用のまま）
- 影響調査がトップダウンのみ（ボトムアップ＝コード依存解析が未実装）
- CRステータスの語彙・遷移が、PRD/PRD_overview/実装でズレている
- マルチプロジェクト分離の漏れ（projectId未適用の一覧/削除/エクスポート等）
- allow_paths の自動決定ルールが実装に接続されていない
- 7章形式エクスポートでのBT名推測など、出力品質の不安要素

設計方針:
- **KISS**: まず「404/混在/誤誘導」といったUX事故を最小変更で塞ぐ。その後に解析機能や自動化を段階導入する。
- **DRY**: projectId 適用漏れを個別修正で終わらせず、共通ガード/共通ヘルパーで再発を潰す。
- **YAGNI**: Cloud Run + Claude Agent SDK のフル非同期基盤は、この段階では必須要件に落ちるまで作らない（ただし移行可能な形で設計する）。

### 修正難易度フィードバック

```
難易度: ★★★
根拠: 20+ files, 500+ lines, 8+ components
リスク: DBマイグレーションの整合性崩れ / project分離漏れの回帰 / 影響調査（依存解析）の性能・精度・セキュリティ設計
```

---

## 更新対象ファイル（チェックリスト）

### 0. チェックリスト運用（このファイル）

ファイル: `docs/checklists/active/2026-02-23-prd-implementation-alignment.md`

#### 実装項目
- [x] チェックリスト作成（本ファイル）
- [x] 実装進捗に合わせて都度チェック更新
- [x] 全完了後に `docs/checklists/archive/` に移動

---

### 1. 事前確認（意思決定 + 現状把握）

#### 1-1. CRステータス整合の方針決定（重要）

現状:
- PRD/PRD_overview: `draft → investigating → reviewed → approved → completed（→ rejected）`
- 実装/DB制約/設計メモ: `open → review → approved → applied`（`docs/design/change-request-status-transition.md`）

#### 実装項目
- [x] 方針A: **DB/型/UI/ドキュメント全てを PRD語彙へ寄せる**（破壊的変更あり、移行が必要）※不採用（方針Bを採用）
- [x] 方針B: **DBは現状語彙を維持し、UI表示語彙とドキュメントを統一**（移行低リスク、表示マッピングで吸収）
- [x] 方針をこのチェックリストに明記し、以降のタスクを確定する（決定: 方針B / 2026-02-23）

#### 受入基準
- [x] 変更要求の一覧/詳細/作成/編集で「状態の意味」が一貫して説明できる
- [x] DB制約・TypeScript型・UI表示・ドキュメントで矛盾がない

#### 1-2. マルチプロジェクト分離の期待値確定

#### 実装項目
- [x] 「現在プロジェクト以外のデータはUI/エクスポート/検索に一切出さない」を規約化（`docs/design/project-selection-policy.md`）
- [x] プロジェクト未選択時のフォールバック規約を明文化（`docs/design/project-selection-policy.md`）
- [x] 例外（グローバル採番など）がある場合、範囲と理由を明記（`docs/design/project-selection-policy.md`）

#### 受入基準
- [x] `current-project-id` を切替えてもデータ混在が発生しない（一覧/検索/詳細/エクスポート）

---

### 2. マルチプロジェクト分離の漏れ修正（UX事故の最優先）

狙い: projectId 未適用の「全件取得/全件削除/他プロジェクト混在」を根絶する。

#### 2-1. projectId適用漏れの棚卸し（機械的）

#### 実装項目
- [x] `list*()` / `get*()` / `create*()` / `update*()` / `delete*()` の呼び出し箇所を全探索し、`projectId` が渡っているか確認
- [x] API Route（`app/api/**`）で cookie から projectId を取得し、必ずデータ層へ渡す
- [x] UI Hook/Component で `useProject()` を経由し、未選択時はガード（エラー表示 or 操作不可）に統一
- [x] 概念新規作成（`/ideas/create`）の `listConcepts()` に projectId を適用
- [x] システム機能編集のデータフェッチで `currentProjectId ?? undefined` を排除（常にprojectIdで絞る）
- [x] 業務タスク手動追加のマスタ取得で `currentProjectId ?? undefined` を排除（常にprojectIdで絞る）
- [x] 疑義リンク一括操作（confirm）で projectId 未選択時に更新処理を実行しないガードを追加

#### 受入基準
- [x] `projectId` 未指定で「全件」を取る挙動が、意図した箇所に限定されている（意図しない全件取得がない）

#### 2-2. 影響範囲セレクタ（CR起票/編集）の混在修正

ファイル: `components/tickets/impact-scope-selector.tsx`

#### 実装項目
- [x] `useProject()` から `currentProjectId` を取得し、`listTasks(currentProjectId)` など **必ず projectId を渡す**
- [x] `projectLoading` 中はロード表示を維持し、データ取得を開始しない
- [x] `currentProjectId` 未選択時は、選択UIを無効化 + 明確なエラー表示

#### 受入基準
- [x] 別プロジェクトのBT/BR/SF/SRが一覧に混ざらない

#### 2-3. エクスポートの projectId 適用

ファイル: `app/api/export/business/route.ts`, `app/api/export/system/route.ts`, `app/api/export/requirements/route.ts`

#### 実装項目
- [x] cookie の `current-project-id` を使い、必ず projectId を適用して取得する
- [x] projectId未選択（cookieなし）のフォールバックを「デフォルトプロジェクト」にする（requirements export と統一）

#### 受入基準
- [x] Excel/7章エクスポートが他プロジェクトを含まない

#### 2-4. 削除系（delete）での projectId 適用漏れ修正

例: `app/(with-sidebar)/system/page.tsx` の delete など

#### 実装項目
- [x] delete呼び出しに projectId を渡す（渡せない場合はUI側で操作不可）
- [x] データ層の delete/getById/update は projectId を条件に含める（可能な限り）
- [x] `change_request_impact_scopes` の list/update/delete/confirm に projectId を適用する
- [x] `change_request_acceptance_confirmations` の list/update/delete に projectId を適用する

#### 受入基準
- [x] 他プロジェクトのデータを誤って削除できない

#### 2-5. DBスキーマとマイグレーションの整合（再現性）

狙い: 「Supabase実DBでは動くが、migrationsから再現できない」を無くす。

#### 実装項目
- [x] 実DBのスキーマ（table/column/index/RLS）を確認し、設計書/実装と突き合わせる
- [x] `docs/design/database-schema-design.md` を更新し、実DBの追加テーブル（監査ログ/バックアップ）とRLS運用を反映
- [x] `supabase/migrations/**` を実DBの `supabase_migrations.schema_migrations` 履歴に合わせて整理（不足migration追加・version揃え）
- [x] 新規セットアップ用に baseline schema（core tables + RLS/policies）を migrations に追加
- [x] `supabase/config.toml` の `db.major_version` を実DB（Postgres 17）に合わせる
- [x] 変更管理系テーブルの project分離: 追加 migration を用意（CR subtables `project_id` / `investigation_results.project_id` FK / `bottom_up_result`）
- [x] インデックス/外部キー/NOT NULL を設計書どおりに揃える（実DB適用 + 確認含む）

#### 受入基準
- [x] 新規セットアップ（migrations適用）で同じ挙動が再現できる
- [x] RLS/制約の観点でプロジェクト分離が破綻しない

---

### 3. ベースライン機能の整合（404解消 + 最小MVP）

現状:
- `app/(with-sidebar)/baseline/page.tsx` がダミーデータ + 行クリックが `/baseline/{version}` に遷移
- `/baseline/{version}` が未実装で 404

#### 3-1. 404導線の解消（最優先）

#### 実装項目
- [x] 方針A: `/baseline/[version]` を実装して詳細表示（MVP）
- [x] 方針B: 行クリック遷移を廃止し、現状は一覧のみ（詳細/差分は無効化）にする ※不採用（方針Aを採用）
- [x] 方針を決め、UIに「未提供機能」の表示を入れて迷子を無くす（決定: 方針A / 2026-02-23）

#### 受入基準
- [x] どの操作をしても 404 にならない

#### 3-2. ベースラインのデータソースを決める（KISS）

#### 実装項目
- [x] Baselineの最小要件を定義（例: version, summary, date, change_request_ids, is_latest）
- [x] DBに持つ（推奨）/ ファイルに持つ / ハードコード継続 のいずれかを決める（決定: ハードコード（MVP）/ projectIdごとに分離）
- [x] ダッシュボードの「現在ベースライン」表示も同じソースから取る

#### 受入基準
- [x] ベースライン表示が「どのプロジェクトのものか」明確で、切替で混ざらない

---

### 4. 影響調査のボトムアップ実装（コード依存解析）

狙い: PRD_overview の「トップダウン + ボトムアップ」で影響漏れを減らす。

#### 4-1. 実行モデルの決定（YAGNI）

候補:
- A) Next.js API Route内で同期解析（小規模Repo向け、最短）
- B) ジョブ化（Cloud Run/Task）前提で非同期（設計は `docs/design/ai-impact-analysis.md` 参照）

#### 実装項目
- [x] MVPはAで実装し、Bへ移行できるI/F（入力/出力/保存先）に揃える
- [x] `projects.github_url` を解析対象のリポジトリとして使用する（public repo前提から開始）
- [x] 認証/秘密情報（PAT等）の扱い方針を決める（MVPは「publicのみ」でも可）

#### 受入基準
- [x] 「どのリポジトリを解析したのか」がログ/画面で追える

#### 4-2. 依存解析の実装（KISS）

#### 実装項目
- [x] entry_points（DDの `entryPoints[].path`）を起点に import 依存を辿ってファイル集合を作る
- [x] include/exclude/maxDepth など、`projects.investigation_settings`（`lib/data/project-settings.ts`）を適用する
- [x] depth/直接or間接/確信度の最小定義を決め、結果に持たせる
- [x] 「共通処理（shared modules）」パターンを設定で扱えるようにする（`shared_module_patterns`）

#### 受入基準
- [x] 同じ入力（entry_points/settings）で同じ出力（安定）になる
- [x] 大きいリポジトリでもタイムアウト/過負荷にならないガードがある（最大ファイル数など）

#### 4-3. allow_paths 自動決定ルールの接続

ファイル: `lib/data/project-settings.ts`, `lib/data/modification-packages.ts`

#### 実装項目
- [x] 依存解析結果（影響ファイル + 確信度 + depth）から allow_paths を決める
- [x] `confidence_threshold/max_depth/max_total_files/max_directories` を適用する
- [x] shared module の自動包含/通知/確認要求の挙動を実装する
- [x] allow_paths が空になるケースの復旧導線（エラー/要再調査/手動指定）を用意する

#### 受入基準
- [x] パッケージ生成が project設定に従って allow_paths を出力する

#### 4-4. 画面/操作フローの改善（UX）

#### 実装項目
- [x] 影響調査の結果に「トップダウン（要件）」と「ボトムアップ（ファイル）」を分けて表示する
- [x] allow_paths候補のうち、閾値外やshared module過多は「要確認」として明示する（MVP: truncated/shared件数を表示 + residual_risksに記録）
- [x] 疑義リンク未解消や、allow_pathsが危険な場合は改修指示パッケージ生成をブロックする（現状踏襲 + 強化）

#### 受入基準
- [x] ユーザーが「何が影響対象で、なぜそうなったか」を画面だけで理解できる

---

### 5. CRステータス整合（語彙/遷移/UX）

※ 1-1 の決定に従う。ここは決定後にタスクを確定させる。

#### 実装項目
- [x] DB制約/型/文言/画面を統一する
- [x] 影響調査開始〜完了〜レビュー〜承認〜完了の導線を、状態遷移と矛盾なく表現する
- [x] `docs/overview/PRD_overview.md` と `docs/PRD.md` の記述を現実に合わせて更新する（または実装を寄せる）

#### 受入基準
- [x] 変更要求の状態が、一覧/詳細/ボタン活性条件で矛盾しない

---

### 6. エクスポート品質の改善（7章形式 + Excel）

#### 6-1. 7章形式エクスポートのBT名推測を廃止

ファイル: `lib/export/requirements-export.ts`

#### 実装項目
- [x] `business_tasks` を取得して、BTの name/summary を正しく使う（推測しない）
- [x] projectId を適用し、他プロジェクト混在を防ぐ

#### 受入基準
- [x] `business/{area}/{btId}.md` が正しいBT名/概要で出力される

#### 6-2. エクスポートのプロジェクト切替耐性

#### 実装項目
- [x] cookie/currentProjectId が切り替わった状態で export しても混在しない
- [x] project未選択時の挙動（エラー or default）を全エクスポートで統一する（default projectへフォールバック）

#### 受入基準
- [x] どのエクスポートも「現在プロジェクトの正本のみ」を出力する

---

### 7. テスト・検証（回帰防止）

#### 実装項目
- [x] unit: projectId漏れの回帰を検出するテストを追加（特に export / impact-scope-selector）
- [x] unit: export route が cookie の projectId をデータ層へ渡すことを検証（business/system/requirements）
- [x] unit: impact-scope-selector が projectId をデータ層へ渡すことを検証
- [x] unit: requirements-export のBT名出力が正しくなるテストを追加
- [x] unit: allow_paths 決定ロジック（閾値/共有モジュール/安全制限）のテストを追加
- [x] e2e: プロジェクト切替 → 一覧/検索/詳細/エクスポートで混在しないことを確認（agent-browser / Playwright）

#### 受入基準
- [x] `bunx tsc --noEmit` が通る
- [x] `bun test`（存在する範囲）が通る
- [x] 主要フローでUX事故（404/混在/誤削除）がない

---

## 統合テスト（最終）

- [x] プロジェクトAで作成した要件/CRが、プロジェクトBで表示されない
- [x] CR起票時の影響範囲セレクタで、他プロジェクトの候補が出ない
- [x] 影響調査で、トップダウンとボトムアップの結果が表示される
- [x] 改修指示パッケージの allow_paths が project設定に従って出る
- [x] ベースライン画面のどの操作でも 404 にならない
- [x] 7章エクスポートのBT名/概要が正しい

---

## 完了基準

- [x] 指摘したズレ/不足がすべて解消されている（チェックが全て [x]）
- [x] ドキュメント（PRD/overview/design）と実装が相互に矛盾しない
- [x] マルチプロジェクトでのUX事故が再発しない（テストで担保）
