# PRD v1.3 実装（スキーマ拡張・受入条件構造化・ヘルススコア）チェックリスト

## 作業概要
`docs/prd.md`（最終更新: 2026-01-19）の追加・変更点（優先度/受入条件の構造化/エントリポイント/ヘルススコア）を、既存のSupabase + Next.js実装に段階導入で反映する。

---

## 概要計画（高レベル）
※細部は次フェーズで詰める。依存関係の都合で「DB → データ層 → 画面 → 品質監視」の順を推奨。

### 1) DBテーブル修正（Supabase）
- [x] `business_requirements` に `priority` を追加
- [x] 業務要件の受入条件を構造化（Phase 1: `acceptance_criteria_json` 追加で段階移行、legacy `acceptance_criteria(text[])` は残置）
- [x] `system_requirements` に `category` と `business_requirement_ids` を追加
- [x] システム要件の受入条件を構造化（Phase 1: `acceptance_criteria_json` 追加で段階移行、legacy `acceptance_criteria(text[])` は残置）
- [x] `system_functions` に `entry_points`（path/type/responsibility）を追加（Phase 1: `code_refs.paths` から `path` を暫定移行、`type/responsibility` は後続で入力）

### 2) データアクセス層修正（`lib/data/*`）
- [x] `BusinessRequirement`/`SystemRequirement`/`SystemFunction` の型・Row変換・CRUDを新スキーマに追従
- [x] 既存UIが壊れないように暫定互換（旧データの読み取り/表示）方針を決める

### 3) 画面修正（フォーム・詳細表示）
- [ ] 業務要件: `priority` 入力、受入条件（構造化）の表示/編集
- [ ] システム要件: `category` 入力、`business_requirement_ids` 表示/編集、受入条件（構造化）の表示/編集
- [ ] システム機能: `entry_points` の表示/編集（責務/種別/パス）

### 4) バックエンド/ロジック修正（品質監視）
- [ ] 「正本のヘルススコア」算出（構造的つながり + データ品質）
- [ ] ダッシュボード等に警告・スコア表示（まずは一覧/カード表示でOK）

### 5) 既存データ移行・seed整備
- [x] 既存 `acceptance_criteria: text[]` を新形式に変換して移行（Phase 1: `acceptance_criteria_json` へバックフィル）
- [x] `code_refs` 由来のパスを `entry_points` に暫定移行（type/responsibilityは手入力 or 既定値）
- [ ] `lib/mock/data/*` の形式更新（必要なら）

### 6) 動作確認（E2E優先）
- [ ] 主要CRUD導線（業務/タスク/業務要件/システム機能/システム要件）が破綻しない
- [ ] Playwright MCPで基本シナリオを回す（一覧→追加→編集→再読込→確認）

---

## 直近詳細計画
- [x] [Phase 1: DBテーブル修正（Supabase）](2026-01-19-prd-v1-3-phase1-db-schema.md)
- [x] [Phase 2: データアクセス層修正（lib/data/*）](2026-01-19-prd-v1-3-phase2-data-layer.md)
- [ ] [Phase 3: 画面修正（フォーム・詳細表示）](2026-01-19-prd-v1-3-phase3-ui-forms.md)
