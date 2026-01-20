# Phase 3: 画面修正（フォーム・詳細表示）チェックリスト

## 作業概要
Phase 2で整備した新カラム（`priority` / `acceptance_criteria_json` / `category` / `business_requirement_ids` / `entry_points`）を、既存のNext.js UIに反映し「表示/編集/保存」できる状態にする。

- KISS: 既存UI（`acceptanceCriteria: string[]`）を即置換せず、段階移行の互換を維持しつつ構造化編集UIを追加する
- DRY: 受入条件・エントリポイントの編集UIは共通化して重複を避ける
- YAGNI: Phase 3ではヘルススコア算出/受入条件lint/高度な証跡管理（添付ファイル等）はやらない（Phase 4以降）

前提:
- [x] [Phase 1: DBテーブル修正（Supabase）](2026-01-19-prd-v1-3-phase1-db-schema.md) が完了している
- [x] [Phase 2: データアクセス層修正（lib/data/*）](2026-01-19-prd-v1-3-phase2-data-layer.md) が完了している

- 戻り先: [概要計画（高レベル）](2026-01-19-prd-v1-3-schema-health-score.md)

---

## 0. UI方針の確定（重要）
- [x] 受入条件の「正の編集対象」を決める
  - [x] 原則: UIは `acceptance_criteria_json` を編集し、データ層で legacy `acceptance_criteria(text[])` へ同期する（KISS）
  - [x] 既存UI互換: 既存の `acceptanceCriteria: string[]` ベース入力も残す/段階的に置換する（KISS）
- [x] 受入条件の入力UXを決める（テーブル/カード/折りたたみ）
  - [x] MVPは description を主入力にし、verification/status/evidence は詳細欄で編集（KISS）
- [x] `business_requirement_ids` の編集スコープを決める
  - [x] 原則: 同一タスク内の業務要件から選択（KISS）
  - [x] 将来: タスク跨ぎリンクは Phase 4+ で検討（YAGNI）
- [x] `entry_points` の編集ルールを決める
  - [x] path は重複禁止、空は不可
  - [x] type/responsibility はMVPでは任意入力（移行直後の欠損を許容し、ヘルススコアで可視化）（KISS）

## 1. UI/フォーム用の型とマッピング
- [x] フォーム状態（`Requirement`）に必要フィールドを追加
  - [x] 業務要件: `priority`（Must / Should / Could）
  - [x] 業務/システム: `acceptanceCriteriaJson`（構造化受入条件）
  - [x] システム要件: `category`（function / data / exception / auth / non_functional）
  - [x] システム要件: `businessRequirementIds`（紐づく業務要件ID配列）
- [x] `lib/data/requirement-mapper.ts` を更新（UI⇔DBの相互変換）
  - [x] fromXxx: DBの `priority/category/businessRequirementIds/acceptanceCriteriaJson` をフォームへ反映
  - [x] toXxxInput: フォームの新フィールドを `BusinessRequirementInput` / `SystemRequirementInput` に反映
  - [x] legacy互換: フォームの `acceptanceCriteria`（string[]）が更新された場合も `acceptanceCriteriaJson` の description を同期（KISS）
- [x] `lib/data/task-sync.ts` の差分検出を拡張
  - [x] 受入条件のメタ情報（status/verification/evidence）が編集された場合に更新されること
  - [x] `priority/category/businessRequirementIds` が編集された場合に更新されること

## 2. タスク編集画面（`/business/[id]/tasks/[taskId]/edit`）
- [x] 業務要件フォーム
  - [x] `priority` 入力（セレクト: Must/Should/Could）
  - [x] 構造化受入条件の編集UI（description + optional fields）
- [x] システム要件フォーム
  - [x] `category` 入力（セレクト: function/data/exception/auth/non_functional）
  - [x] `businessRequirementIds` の選択UI（同一タスクの業務要件から複数選択）
  - [x] 構造化受入条件の編集UI（共通コンポーネントを再利用: DRY）
- [x] 既存の選択ダイアログ（概念/システム機能/システム領域）との整合を取る

## 3. タスク詳細画面（`/business/[id]/tasks/[taskId]`）
- [x] 業務要件カードに `priority` を表示
- [x] 受入条件の表示を構造化に追従（status/verification_method/evidenceの表示方針に沿う）
- [x] システム要件カードに `category` / `businessRequirementIds` を表示
  - [x] `businessRequirementIds` から業務要件へのリンク（存在しないIDは警告表示）

## 4. システム機能詳細/編集（`/system-domains/[id]/[srfId]` / `.../edit`）
- [x] 詳細ページ: `entry_points` の表示（path/type/responsibility）
  - [x] legacy `code_refs` のみのデータにも対応（Phase 2の互換: フォールバック表示）
- [x] 編集ページ: `entry_points` の編集UIを追加
  - [x] 追加/削除/並び替え（最低限: 追加/削除）
  - [x] 保存時は `entry_points` を更新し、必要に応じて `code_refs` と同期する（KISS）
- [x] システム要件のCRUD（追加/編集/削除）機能を追加
  - [x] 編集ページ: システム要件セクションを追加（RequirementListSectionコンポーネントを再利用）
  - [x] システム要件の追加/編集/削除ができる状態
  - [x] 構造化された受入条件の入力（StructuredAcceptanceCriteriaInput）
- [x] システム要件の構造化された受入条件表示
  - [x] 詳細ページ: システム要件カードで受入条件が構造化表示されている（AcceptanceCriteriaDisplay）
  - [x] legacy `acceptance_criteria(text[])` との互換（mergeAcceptanceCriteriaJsonWithLegacy）
- [x] 既存の `code_refs` UIの扱いを決める（残置/廃止/参照専用化）

## 5. `business_requirement_ids` の表示元の統一（互換）
- [x] `useRelatedRequirements` 等、関連表示ロジックの「正」を `system_requirements.business_requirement_ids` に寄せる
  - [x] legacy（`business_requirements.related_system_requirement_ids`）はフォールバックとして扱う（KISS）
  - [x] 既存データが徐々に新カラムへ寄るよう、編集・保存導線で両方向を同期する（KISS）

## 6. 動作確認（Playwright MCP）
- [x] タスク編集: 業務要件（priority/受入条件）→保存→再読込で反映される
- [x] タスク編集: システム要件（category/業務要件リンク/受入条件）→保存→再読込で反映される
- [x] システム機能編集: entry_points 編集→保存→再読込で反映される
- [x] システム機能編集: システム要件の追加/編集/削除→保存→再読込で反映される
- [x] システム機能詳細: システム要件の受入条件が構造化表示されていること
- [x] 既存データ（legacyのみ）が表示崩れしない（空/NULL/欠損の許容）

---

## 完了基準（Phase 3）
- [x] UIで `priority/category/business_requirement_ids/entry_points/acceptance_criteria_json` を編集できる
- [x] システム機能編集ページでシステム要件のCRUD（追加/編集/削除）ができる
- [x] システム機能詳細ページで受入条件が構造化表示されている
- [x] 保存後にDBの新カラムに値が入る（段階移行の土台ができている）
- [x] 既存導線（タスク編集/システム機能編集）が破綻しない

