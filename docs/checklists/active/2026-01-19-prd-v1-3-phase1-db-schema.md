# Phase 1: DBテーブル修正（Supabase）チェックリスト

## 作業概要
以降の型・UI変更の土台を固める（KISS: まず「保存できる器」を作る）。
PRD参照: `docs/prd.md` の 1.8 / 2.7.1 / 2.8.1。

- 戻り先: [概要計画（高レベル）](2026-01-19-prd-v1-3-schema-health-score.md)

---

## 1. スキーマ差分の確定（DDL方針）
- [ ] `business_requirements.priority` の型/既定値/許容値（Must / Should / Could）を決める
- [ ] `business_requirements.acceptance_criteria` のDB表現を決める（推奨: `jsonb not null default '[]'` で「配列」を保持）
- [ ] 既存 `acceptance_criteria (text[])` からの移行手順を決める（列追加→バックフィル→列切替/リネーム）
- [ ] `system_requirements.category` の型/既定値（例: function）を決める
- [ ] `system_requirements.business_requirement_ids (text[])` の追加方針を決める（not null default '{}'）
- [ ] `system_requirements.acceptance_criteria` のDB表現を決める（推奨: `jsonb not null default '[]'`）
- [ ] `system_functions.entry_points` の追加方針を決める（推奨: `jsonb not null default '[]'`）
- [ ] 既存 `system_functions.code_refs` をどう扱うか決める（置換/併存/移行して廃止）

## 2. SupabaseへDDL適用
- [ ] 変更SQLを用意（ロールバック含めるなら別紙で）
- [ ] Supabaseに適用（MCP or SQL Editor）
- [ ] `select * from ... limit 1` で列追加/型を確認

## 3. 既存データのバックフィル（最小）
- [ ] 既存の業務要件に `priority` を一括設定（既定値でよい）
- [ ] 既存の `acceptance_criteria(text[])` を新 `acceptance_criteria(jsonb)` に変換
  - [ ] `description` に旧文字列を入れる
  - [ ] `id` は連番で暫定採番（例: `AC-001`）
  - [ ] `verification_method/status/verified_* /evidence` は既定値/NULL
- [ ] 既存のシステム要件に `category` を一括設定（既定値でよい）
- [ ] 既存のシステム要件に `business_requirement_ids` を空配列で初期化
- [ ] 既存の `acceptance_criteria(text[])` を新 `acceptance_criteria(jsonb)` に変換（システム要件側）
- [ ] 既存の `system_functions.code_refs.paths` を `entry_points[].path` に暫定移行（type/responsibilityは空 or 既定値）

## 4. ドキュメント整備（最低限）
- [ ] `docs/mock-crud-design.md` に `system_requirements` と新カラム群を追記
- [ ] スキーマ変更の意図（PRD参照箇所: 1.8 / 2.7.1 / 2.8.1）をメモとして残す

---

## 完了基準（Phase 1）
- [ ] Supabase上で新カラムが確認できる
- [ ] 既存データが最低限バックフィルされ、読み取りで例外が出ない
- [ ] 次フェーズ（`lib/data`更新）に着手できる状態になっている

