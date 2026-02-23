# 変更要求ステータス遷移（改修指示パッケージ連携）

## 目的

改修指示パッケージ生成（`POST /api/tickets/[id]/instruction-package`）と、
影響調査（`POST /api/tickets/[id]/investigate`）における
`change_requests.status` の遷移ルールを明確化する。

## ステータス定義

- `open`: 変更要求起票直後。影響調査未実施。
- `review`: 影響調査完了後。疑義リンク解消を含むレビュー段階。
- `approved`: 改修指示パッケージ生成済み。改修実行可能。
- `applied`: 改修適用済み。

## API別の遷移ルール

### 1. 影響調査 API

- エンドポイント: `POST /api/tickets/[id]/investigate`
- 正常終了時:
  - `open -> review` に更新する。
- 失敗時:
  - ステータス更新しない。

### 2. 改修指示パッケージ生成 API

- エンドポイント: `POST /api/tickets/[id]/instruction-package`
- 前提:
  - `status=open` は受付不可（`409`）。
  - 影響調査結果が存在すること。
  - 関連疑義リンクが未解消の場合は受付不可（`409`）。
- 正常終了時:
  - `status=review` の場合のみ `review -> approved` に更新する。
  - `status=approved` はそのまま再生成可能（状態は維持）。
  - `status=applied` も再生成自体は許可し、状態は維持する。
- 失敗時:
  - ステータス更新しない。

## UI連携ルール

- チケット詳細画面では、`status=open` の場合のみ「影響調査開始」を表示する。
- 「改修指示パッケージ生成」は、影響調査結果が存在し、かつ `status=open` でない場合に実行可能とする。
- 生成成功後、画面は `router.refresh()` で最新状態を再取得する。

## 実装参照

- `app/api/tickets/[id]/investigate/route.ts`
- `app/api/tickets/[id]/instruction-package/route.ts`
- `app/(with-sidebar)/tickets/[id]/page.tsx`
