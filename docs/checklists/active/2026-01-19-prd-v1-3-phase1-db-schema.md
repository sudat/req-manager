# Phase 1: DBテーブル修正（Supabase）チェックリスト

## 作業概要
以降の型・UI変更の土台を固める（KISS: まず「保存できる器」を作る）。
PRD参照: `docs/prd.md` の 1.8 / 2.7.1 / 2.8.1。

- 戻り先: [概要計画（高レベル）](2026-01-19-prd-v1-3-schema-health-score.md)

---

## 1. スキーマ差分の確定（DDL方針）
- [x] `business_requirements.priority` の型/既定値/許容値（Must / Should / Could）を決める
- [x] `business_requirements.acceptance_criteria_json` のDB表現を決める（推奨: `jsonb not null default '[]'` で「配列」を保持）
- [x] 既存 `acceptance_criteria (text[])` からの移行手順を決める（列追加→バックフィル→（後続で）列切替/リネーム）
- [x] `system_requirements.category` の型/既定値（例: function）を決める
- [x] `system_requirements.business_requirement_ids (text[])` の追加方針を決める（not null default '{}'）
- [x] `system_requirements.acceptance_criteria_json` のDB表現を決める（推奨: `jsonb not null default '[]'`）
- [x] `system_functions.entry_points` の追加方針を決める（推奨: `jsonb not null default '[]'`）
- [x] 既存 `system_functions.code_refs` をどう扱うか決める（置換/併存/移行して廃止）

## 2. SupabaseへDDL適用
- [x] 変更SQLを用意（ロールバック含めるなら別紙で）
- [x] Supabaseに適用（MCP or SQL Editor）
- [x] `select * from ... limit 1` で列追加/型を確認

## 3. 既存データのバックフィル（最小）
- [x] 既存の業務要件に `priority` を一括設定（既定値でよい）
- [x] 既存の `acceptance_criteria(text[])` を新 `acceptance_criteria_json(jsonb)` に変換
  - [x] `description` に旧文字列を入れる
  - [x] `id` は連番で暫定採番（例: `AC-001`）
  - [x] `verification_method/status/verified_* /evidence` は既定値/NULL
- [x] 既存のシステム要件に `category` を一括設定（既定値でよい）
- [x] 既存のシステム要件に `business_requirement_ids` を空配列で初期化
- [x] 既存の `acceptance_criteria(text[])` を新 `acceptance_criteria_json(jsonb)` に変換（システム要件側）
- [x] 既存の `system_functions.code_refs.paths` を `entry_points[].path` に暫定移行（type/responsibilityは空 or 既定値）

## 4. ドキュメント整備（最低限）
- [x] `docs/mock-crud-design.md` に `system_requirements` と新カラム群を追記
- [x] スキーマ変更の意図（PRD参照箇所: 1.8 / 2.7.1 / 2.8.1）をメモとして残す

---

## 完了基準（Phase 1）
- [x] Supabase上で新カラムが確認できる
- [x] 既存データが最低限バックフィルされ、読み取りで例外が出ない
- [x] 次フェーズ（`lib/data`更新）に着手できる状態になっている
