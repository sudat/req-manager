# Phase 2: データアクセス層修正（`lib/data/*`）チェックリスト

## 作業概要
Phase 1で追加した新カラム（`priority` / `acceptance_criteria_json` / `category` / `business_requirement_ids` / `entry_points`）に合わせて、`lib/data/*` の型・Row変換・CRUDを更新する。

- KISS: 既存UI（`Requirement` が `acceptanceCriteria: string[]` を扱う）を壊さないため、まずは段階移行の互換レイヤーを入れる
- DRY: 受入条件/エントリポイントの変換ロジックは共通化して重複を避ける
- YAGNI: Phase 2ではUIの構造化編集やヘルススコア算出はやらない（Phase 3/4）

前提:
- [x] [Phase 1: DBテーブル修正（Supabase）](2026-01-19-prd-v1-3-phase1-db-schema.md) が完了している

- 戻り先: [概要計画（高レベル）](2026-01-19-prd-v1-3-schema-health-score.md)

---

## 0. 互換・移行方針の確定（重要）
- [x] 受入条件の正と互換方針を決める（`acceptance_criteria_json` ⇔ legacy `acceptance_criteria(text[])`）
  - [x] 読み取り: `acceptance_criteria_json` を優先し、空/NULLなら legacy から暫定生成
  - [x] 書き込み: 当面は両方に書く／片方のみ・自動生成する等のルールを決める
- [x] `system_functions.entry_points` と legacy `system_functions.code_refs` の正と互換方針を決める
  - [x] 読み取り優先順位（entry_points優先 / code_refs優先）とフォールバックを決める
  - [x] 書き込み時に「片方更新→もう片方をどう同期するか」を決める
- [x] 新しい型（受入条件/エントリポイント）の置き場所を決める（`lib/domain` vs `lib/data`）
- [x] 互換実装のスコープを明記する（Phase 2は「既存UIが壊れない」まで）

## 1. 型定義（データ構造）
- [x] `AcceptanceCriterion` 型（PRD 2.7.1準拠: id/description/verification_method/status/verified_by/verified_at/evidence）を定義
- [x] `BusinessRequirementPriority` 型（`Must` / `Should` / `Could`）を定義
- [x] `SystemRequirementCategory` 型（`function` / `data` / `exception` / `auth` / `non_functional`）を定義
- [x] `EntryPoint` 型（path/type/responsibility）を定義
- [x] 変換関数を用意（DRY）
  - [x] legacy `string[]` → `AcceptanceCriterion[]`（暫定採番・既定値付与）
  - [x] `AcceptanceCriterion[]` → legacy `string[]`（descriptionの抽出）
  - [x] `code_refs.paths` → `EntryPoint[]`（type/responsibilityは空 or 既定値）

## 2. `lib/data/business-requirements.ts`
- [x] `BusinessRequirement` に `priority` を追加
- [x] `BusinessRequirement` に構造化受入条件フィールドを追加（例: `acceptanceCriteriaJson`）
- [x] Row型へ `priority` / `acceptance_criteria_json` を追加
- [x] `toBusinessRequirement` を更新（互換含む）
  - [x] jsonbがあれば jsonb を採用
  - [x] jsonbが空/NULLなら legacy から暫定生成して返す
- [x] create/updateのpayloadを更新（互換含む）
  - [x] UI互換のため、legacy `acceptance_criteria` も引き続き更新する方針なら両方に書く
  - [x] `priority` 未指定時の既定値を揃える
- [x] 既存呼び出し側が型エラーなく動くことを確認（主に `lib/data/task-sync.ts`）
  - [x] `bun run build`（TypeScript）で確認

## 3. `lib/data/system-requirements.ts`
- [x] `SystemRequirement` に `category` を追加
- [x] `SystemRequirement` に `businessRequirementIds` を追加
- [x] `SystemRequirement` に構造化受入条件フィールドを追加（例: `acceptanceCriteriaJson`）
- [x] Row型へ `category` / `business_requirement_ids` / `acceptance_criteria_json` を追加
- [x] `toSystemRequirement` を更新（互換含む）
- [x] create/updateのpayloadを更新（互換含む）
  - [x] 既定値（`category=function`, `business_requirement_ids=[]`）を一貫させる
  - [x] legacy `acceptance_criteria` も更新する方針なら両方に書く

## 4. `lib/data/system-functions.ts`
- [x] `SystemFunction`（domain or data）に `entryPoints` フィールドを追加
- [x] Row型へ `entry_points` を追加
- [x] `toSystemFunction` を更新（互換含む）
  - [x] entry_points が空/NULLの場合の扱いを決める（code_refsから暫定生成する等）
- [x] create/updateのpayloadを更新（互換含む）
  - [x] 既存UIが `code_refs` を更新する場合、`entry_points` をどう同期するか方針に沿って実装

## 5. 依存箇所の追従
- [x] `lib/data/requirement-mapper.ts` のInput生成で、追加必須カラムに対する既定値を与える（必要な場合）
  - [x] Phase 2は data layer 側で既定値/互換更新するため、mapperの変更は不要
- [x] `lib/data/task-sync.ts` の差分検出が意図せず変わらないことを確認（Phase 2では既存UI互換が最優先）
  - [x] 差分なし同期で `updated_at` が変わらないことを確認（業務要件/システム要件）
- [x] `lib/data/index.ts` のexportを更新（新型やヘルパーを公開する場合）

## 6. 動作確認（最小）
- [x] `bun run lint` が通る
- [x] 主要CRUD（業務要件/システム要件/システム機能）の一覧→編集→保存が破綻しない
  - [x] `bun` 実行で create/list/update/delete を確認
- [x] 保存後にDB側の新カラムが更新されている（`select ... limit 1` で確認）
  - [x] `business_requirements.priority` / `acceptance_criteria_json` の更新を確認
  - [x] `system_requirements.category` / `business_requirement_ids` / `acceptance_criteria_json` の更新を確認
  - [x] `system_functions.entry_points` の更新を確認

---

## 完了基準（Phase 2）
- [x] `lib/data/*` が新スキーマに追従し、既存UIを壊さずに読み書きできる
- [x] 受入条件/エントリポイントの構造化カラムへ継続的に書き込める（段階移行の土台ができた）
- [x] 次フェーズ（画面修正: Phase 3）に着手できる状態になっている
