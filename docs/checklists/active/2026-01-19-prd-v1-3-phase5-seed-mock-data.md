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
- [ ] 開発で使うseed方式を確定する
  - [ ] `lib/mock/data/*` を元に投入するのか（過去運用の踏襲）
  - [ ] `supabase/seed.sql` を使うのか（SQL seed）
  - [ ] どちらも使わない（Supabaseに既にデータがある/手動投入で十分）
- [ ] 完了基準を決める（どのテーブルのseedが必要か）
  - [ ] 例: 今回のPRD v1.3対象（業務要件/システム要件/システム機能）にseedが必要かどうか

## 1. 参照箇所の棚卸し（`lib/mock/data/*` の利用実態）
- [ ] `lib/mock/data/*` をimportしている箇所を列挙する（画面/コンポーネント/スクリプト）
- [ ] PRD v1.3対象の画面に影響するかを分類する
  - [ ] 影響あり: システム機能（SRF）詳細/編集等で `lib/mock/data/srf` を見ている
  - [ ] 影響なし: チケット等の別機能のみで使っている

## 2. 差分確認（新スキーマとの整合）
- [ ] `lib/mock/data/*` にPRD v1.3の新フィールドが必要か判断する
  - [ ] 業務要件/システム要件のseedが `lib/mock/data` に存在しない（=更新不要）か確認する（YAGNI）
  - [ ] システム機能（`lib/mock/data/srf/srf.ts`）に `entryPoints` を持たせる必要があるか判断する
- [ ] 既定値で吸収できる項目を整理する（KISS）
  - [ ] `priority/category` のdefaultで困らないか
  - [ ] `acceptance_criteria_json` / `business_requirement_ids` / `entry_points` が空でも困らないか

## 3. （必要な場合のみ）`lib/mock/data/*` の最小更新
- [ ] システム機能のテストデータに `entryPoints` を追加する（必要なSRFだけ）
  - [ ] 方針: `codeRefs.paths` を元に `path` を埋め、`type/responsibility` は空/未設定を許容（KISS）
- [ ] 既存の型チェック/ビルドが通ることを確認する

## 4. （必要な場合のみ）seed手順/ファイルの整備
- [ ] `supabase/seed.sql` を使う場合、追加カラムによりINSERTが壊れていないことを確認する
  - [ ] 方針: INSERTの列挙を最小にし、defaultで吸収（KISS）
- [ ] `lib/mock/data` から投入する方式の場合、投入スクリプト/手順の現状を確認し、必要なら更新する（DRY）

---

## 完了基準（Phase 5）
- [ ] 使うseed方式（または「seed不要」）が明文化されている
- [ ] seedを使う場合、新カラム追加後も投入・参照が破綻しない
- [ ] 不要な更新をしていない（YAGNI）

