# 設計決定ログ（5-9）設計メモ

## 1. 目的

変更要求詳細画面で、影響調査や改修方針に対して「なぜその判断にしたか」を記録し、後から追跡できるようにする。

## 2. MVPスコープ

- 対象画面: 変更要求詳細（`/tickets/[id]`）
- 入力項目:
  - 対象種別（`target_type`）
  - 対象ID（`target_id`）
  - 決定内容（`decision`）
  - 根拠メモ（`rationale_explanation`）
- 保存単位: 変更要求ごと（`change_request_id`）
- 生成者: 手動入力は `human` 固定
- 状態: 手動入力は `confirmed` 固定
- 影響調査実行時: `agent` が `proposed` ログを自動投入

## 3. データモデル

テーブル: `public.design_decision_logs`

- `change_request_id`: 変更要求への外部キー
- `context_target_type` / `context_target_id` / `context_field`: 判断コンテキスト
- `decision`: 決定内容
- `rationale_type` / `rationale_reference` / `rationale_explanation`: 根拠情報
- `status`: `proposed | confirmed | rejected`

## 4. UI仕様

- カード名: `設計決定ログ（なぜメモ）`
- 画面上で追加後、同カード内に即時反映
- 対象IDは直接入力に加えて、影響範囲/調査結果からの候補IDをワンクリック選択できる
- `created_by=agent` かつ `status=proposed` の行にはレビュー操作を表示:
  - 承認: `confirmed` に更新
  - 差し戻し: `rejected` に更新（任意でレビュー理由メモを追記）
- ログ一覧には以下を表示:
  - ステータス
  - 作成者種別
  - 作成日時
  - 対象種別・対象ID
  - 決定内容
  - 根拠メモ

## 5. Agent自動ログ仕様（影響調査）

`POST /api/tickets/[id]/investigate` 完了時に、以下を `created_by=agent` かつ `status=proposed` で記録する。

- BR: 変更要求の影響範囲で明示選択されたID
- SF: BR から `realizes` リンクで到達したID
- SR: SF の `requirementIds` から到達したID
- AC: SR に紐づく受入条件ID

各ログには「どのIDをなぜ採用したか」を `decision` / `rationale_explanation` に残す。
レビューで差し戻した場合、理由は `rationale_explanation` の末尾に `[Review Note]` として追記する。

## 6. 設計原則

- `KISS`: まずは変更要求詳細の1画面に限定し、操作を追加のみで提供
- `YAGNI`: Agent自動生成・承認ワークフローは今回実装しない
- `DRY`: 正規化ロジックは `lib/data/design-decision-logs.ts` に集約
