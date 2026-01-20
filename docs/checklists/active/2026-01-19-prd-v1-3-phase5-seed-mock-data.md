# Phase 5: 既存データ移行・seed整備 チェックリスト

## 作業概要
PRD v1.3で追加した新カラム（`priority` / `acceptance_criteria_json` / `category` / `business_requirement_ids` / `entry_points`）により、
既存データの読み書きはPhase 1/2で互換対応済み。
Phase 5では「開発用seed（`lib/mock/data/*` や `supabase/seed.sql` 等）を使う場合」に破綻しないよう、必要最小限の更新を行う。

- YAGNI: `lib/mock/data` が実際に参照される導線だけ更新する（不要なら「不要」と判断して完了にする）
- KISS: DBのdefaultや既存の互換変換で吸収できるなら、seed側に値を埋め過ぎない
- DRY: もし変換が必要なら、既存の変換ヘルパー（例: `lib/data/structured.ts`）を流用する

前提:
- [x] [Phase 1: DBテーブル修正（Supabase）](2026-01-19-prd-v1-3-phase1-db-schema.md) が完了している
- [x] [Phase 2: データアクセス層修正（lib/data/*）](2026-01-19-prd-v1-3-phase2-data-layer.md) が完了している

- 戻り先: [概要計画（高レベル）](2026-01-19-prd-v1-3-schema-health-score.md)

---

## 0. スコープ確定（seedの「正」を決める）
- [x] 開発で使うseed方式を確定する
  - [x] `lib/mock/data/*` を元に投入するのか（過去運用の踏襲）→ 不採用（PRD v1.3対象で未使用）
  - [x] `supabase/seed.sql` を使うのか（SQL seed）→ 不採用（seed.sql 空）
  - [x] どちらも使わない（Supabaseに既にデータがある/手動投入で十分）→ 採用
- [x] 完了基準を決める（どのテーブルのseedが必要か）
  - [x] PRD v1.3対象（業務要件/システム要件/システム機能）はSupabase既存データで対応しseed不要

## 1. 参照箇所の棚卸し（`lib/mock/data/*` の利用実態）
- [x] `lib/mock/data/*` をimportしている箇所を列挙する（画面/コンポーネント/スクリプト）
  - [x] `app/tickets/page.tsx`
  - [x] `app/tickets/[id]/page.tsx`
  - [x] `app/tickets/[id]/edit/page.tsx`
  - [x] `app/tickets/create/page.tsx`
  - [x] `components/tickets/ticket-scope-form.tsx`
  - [x] `app/ideas/[id]/page.tsx`
- [x] PRD v1.3対象の画面に影響するかを分類する
  - [x] 影響あり: 該当なし（SRF系は `lib/data/*` 参照）
  - [x] 影響なし: 変更要求/概念辞書（tickets/ideas）

## 2. 差分確認（新スキーマとの整合）
- [x] `lib/mock/data/*` にPRD v1.3の新フィールドが必要か判断する
  - [x] 業務要件/システム要件のseedが `lib/mock/data` に存在しない（=更新不要）ことを確認（YAGNI）
  - [x] システム機能（`lib/mock/data/srf/srf.ts`）に `entryPoints` を持たせる必要は無し（未参照・型はoptional）
- [x] 既定値で吸収できる項目を整理する（KISS）
  - [x] `priority/category` はDB default + 互換変換で吸収済み
  - [x] `acceptance_criteria_json` / `business_requirement_ids` / `entry_points` は空許容で問題なし

## 3. （必要な場合のみ）`lib/mock/data/*` の最小更新
- [x] システム機能のテストデータに `entryPoints` を追加する（不要: `lib/mock/data/srf` 未参照）
  - [x] 方針: `codeRefs.paths` を元に `path` を埋め、`type/responsibility` は空/未設定を許容（不要）
- [x] 既存の型チェック/ビルドが通ることを確認する（変更なしのため実行省略）

## 4. （必要な場合のみ）seed手順/ファイルの整備
- [x] `supabase/seed.sql` を使う場合、追加カラムによりINSERTが壊れていないことを確認する（不要: seed.sql 空）
  - [x] 方針: INSERTの列挙を最小にし、defaultで吸収（不要）
- [x] `lib/mock/data` から投入する方式の場合、投入スクリプト/手順の現状を確認し、必要なら更新する（不要: 方式不採用）

---

## 完了基準（Phase 5）
- [x] 使うseed方式（または「seed不要」）が明文化されている
- [x] seedを使う場合、新カラム追加後も投入・参照が破綻しない（seed不使用）
- [x] 不要な更新をしていない（YAGNI）

