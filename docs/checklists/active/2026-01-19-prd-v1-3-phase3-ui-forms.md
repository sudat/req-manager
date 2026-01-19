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
- [ ] 受入条件の「正の編集対象」を決める
  - [ ] 原則: UIは `acceptance_criteria_json` を編集し、データ層で legacy `acceptance_criteria(text[])` へ同期する（KISS）
  - [ ] 既存UI互換: 既存の `acceptanceCriteria: string[]` ベース入力も残す/段階的に置換する（KISS）
- [ ] 受入条件の入力UXを決める（テーブル/カード/折りたたみ）
  - [ ] MVPは description を主入力にし、verification/status/evidence は詳細欄で編集（KISS）
- [ ] `business_requirement_ids` の編集スコープを決める
  - [ ] 原則: 同一タスク内の業務要件から選択（KISS）
  - [ ] 将来: タスク跨ぎリンクは Phase 4+ で検討（YAGNI）
- [ ] `entry_points` の編集ルールを決める
  - [ ] path は重複禁止、空は不可
  - [ ] type/responsibility はMVPでは任意入力（移行直後の欠損を許容し、ヘルススコアで可視化）（KISS）

## 1. UI/フォーム用の型とマッピング
- [ ] フォーム状態（`Requirement`）に必要フィールドを追加
  - [ ] 業務要件: `priority`（Must / Should / Could）
  - [ ] 業務/システム: `acceptanceCriteriaJson`（構造化受入条件）
  - [ ] システム要件: `category`（function / data / exception / auth / non_functional）
  - [ ] システム要件: `businessRequirementIds`（紐づく業務要件ID配列）
- [ ] `lib/data/requirement-mapper.ts` を更新（UI⇔DBの相互変換）
  - [ ] fromXxx: DBの `priority/category/businessRequirementIds/acceptanceCriteriaJson` をフォームへ反映
  - [ ] toXxxInput: フォームの新フィールドを `BusinessRequirementInput` / `SystemRequirementInput` に反映
  - [ ] legacy互換: フォームの `acceptanceCriteria`（string[]）が更新された場合も `acceptanceCriteriaJson` の description を同期（KISS）
- [ ] `lib/data/task-sync.ts` の差分検出を拡張
  - [ ] 受入条件のメタ情報（status/verification/evidence）が編集された場合に更新されること
  - [ ] `priority/category/businessRequirementIds` が編集された場合に更新されること

## 2. タスク編集画面（`/business/[id]/tasks/[taskId]/edit`）
- [ ] 業務要件フォーム
  - [ ] `priority` 入力（セレクト: Must/Should/Could）
  - [ ] 構造化受入条件の編集UI（description + optional fields）
- [ ] システム要件フォーム
  - [ ] `category` 入力（セレクト: function/data/exception/auth/non_functional）
  - [ ] `businessRequirementIds` の選択UI（同一タスクの業務要件から複数選択）
  - [ ] 構造化受入条件の編集UI（共通コンポーネントを再利用: DRY）
- [ ] 既存の選択ダイアログ（概念/システム機能/システム領域）との整合を取る

## 3. タスク詳細画面（`/business/[id]/tasks/[taskId]`）
- [ ] 業務要件カードに `priority` を表示
- [ ] 受入条件の表示を構造化に追従（status/verification_method/evidenceの表示方針に沿う）
- [ ] システム要件カードに `category` / `businessRequirementIds` を表示
  - [ ] `businessRequirementIds` から業務要件へのリンク（存在しないIDは警告表示）

## 4. システム機能詳細/編集（`/system-domains/[id]/[srfId]` / `.../edit`）
- [ ] 詳細ページ: `entry_points` の表示（path/type/responsibility）
  - [ ] legacy `code_refs` のみのデータにも対応（Phase 2の互換: フォールバック表示）
- [ ] 編集ページ: `entry_points` の編集UIを追加
  - [ ] 追加/削除/並び替え（最低限: 追加/削除）
  - [ ] 保存時は `entry_points` を更新し、必要に応じて `code_refs` と同期する（KISS）
- [ ] 既存の `code_refs` UIの扱いを決める（残置/廃止/参照専用化）

## 5. `business_requirement_ids` の表示元の統一（互換）
- [ ] `useRelatedRequirements` 等、関連表示ロジックの「正」を `system_requirements.business_requirement_ids` に寄せる
  - [ ] legacy（`business_requirements.related_system_requirement_ids`）はフォールバックとして扱う（KISS）
  - [ ] 既存データが徐々に新カラムへ寄るよう、編集・保存導線で両方向を同期する（KISS）

## 6. 動作確認（Playwright MCP）
- [ ] タスク編集: 業務要件（priority/受入条件）→保存→再読込で反映される
- [ ] タスク編集: システム要件（category/業務要件リンク/受入条件）→保存→再読込で反映される
- [ ] システム機能編集: entry_points 編集→保存→再読込で反映される
- [ ] 既存データ（legacyのみ）が表示崩れしない（空/NULL/欠損の許容）

---

## 完了基準（Phase 3）
- [ ] UIで `priority/category/business_requirement_ids/entry_points/acceptance_criteria_json` を編集できる
- [ ] 保存後にDBの新カラムに値が入る（段階移行の土台ができている）
- [ ] 既存導線（タスク編集/システム機能編集）が破綻しない

