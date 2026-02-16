# DD呼び出し元（callers）サンプルデータ登録計画

## Context

ユーザーが `DesignDocumentCard.tsx` に呼び出し元（callers）機能を実装しました。各 DD に対して「誰がこのDDを呼び出すか」を定義できるようになっています。

既存の DD データには `callers` が設定されていないため、AP/AR/GL の全ての DD にサンプルデータを登録します。

## 呼び出し元の型定義

```typescript
export type DdCallerDraft = {
  callerType: DdCallerType;      // "user" | "system"
  callerSfId?: string;            // callerType="system"の場合のみ
  callerDdId?: string;            // callerType="system"の場合のみ
  callType?: DdDependencyCallType; // "calls_sync" | "calls_async"
};
```

## 保存場所

`design_documents` テーブルの `details` JSONB カラム内に `callers` フィールドとして保存されます。

## 呼び出し元パターン

| DDタイプ | 呼び出し元パターン | 設定値 |
|---------|------------------|--------|
| **screen** | ユーザーが直接起動 | `callerType: "user"` |
| **api** | 画面からの同期呼び出し | `callerType: "system"`, `callType: "calls_sync"` + `callerDdId`（呼び出し元画面DD） |
| **batch** | スケジューラー/別プロセスからの非同期起動 | `callerType: "system"`, `callType: "calls_async"` |
| **job** | イベントからの非同期起動 | `callerType: "system"`, `callType: "calls_async"` |
| **external_if** | API/バッチからの同期呼び出し | `callerType: "system"`, `callType: "calls_sync"` |
| **model** | 呼び出し元なし（データ構造定義） | `callers: []` |

## サンプルデータ登録対象

### AP領域（買掛金管理）

| DD ID | DD名 | タイプ | 呼び出し元設定 |
|-------|------|--------|--------------|
| DD-SF-AP-0001-001 | 支払依頼画面 | screen | `[{ callerType: "user" }]` |
| DD-SF-AP-0001-002 | 支払依頼API | api | `[{ callerType: "system", callerDdId: "DD-SF-AP-0001-001", callType: "calls_sync" }]` |
| DD-SF-AP-0002-001 | 支払承認画面 | screen | `[{ callerType: "user" }]` |
| DD-SF-AP-0003-001 | 支払実行バッチ | batch | `[{ callerType: "system", callType: "calls_async" }]` |
| DD-SF-AP-0003-002 | 銀行口座マスタ管理画面 | screen | `[{ callerType: "user" }]` |
| DD-SF-AP-0004-001 | 手形発行API | api | `[{ callerType: "system", callerDdId: "DD-SF-AP-0001-001", callType: "calls_sync" }]` |
| DD-SF-AP-0004-002 | 手形支払処理API | api | `[{ callerType: "system", callType: "calls_async" }]` |
| DD-SF-AP-0005-001 | 仕入請求書取込バッチ | batch | `[{ callerType: "system", callType: "calls_async" }]` |
| DD-SF-AP-0005-002 | 仕入先マスタ管理画面 | screen | `[{ callerType: "user" }]` |
| DD-SF-AP-0006-001 | 買掛残高一覧画面 | screen | `[{ callerType: "user" }]` |
| DD-SF-AP-0007-001 | 仕入先ポータル認証画面 | screen | `[{ callerType: "user" }]` |
| DD-SF-AP-0007-002 | 仕入先ポータルダッシュボード | screen | `[{ callerType: "user" }]` |
| DD-SF-AP-0007-003 | 仕入先ポータルAPI | api | `[{ callerType: "system", callerDdId: "DD-SF-AP-0007-002", callType: "calls_sync" }]` |
| DD-SF-AP-0008-001 | 支払予定表作成画面 | screen | `[{ callerType: "user" }]` |
| DD-SF-AP-0008-002 | 支払予定表作成API | api | `[{ callerType: "system", callerDdId: "DD-SF-AP-0008-001", callType: "calls_sync" }]` |
| DD-SF-AP-0008-003 | 支払予定バッチ | batch | `[{ callerType: "system", callType: "calls_async" }]` |

### AR領域（売掛金管理）

| DD ID | DD名 | タイプ | 呼び出し元設定 |
|-------|------|--------|--------------|
| DD-SF-AR-0001-001 | 請求書発行画面 | screen | `[{ callerType: "user" }]` |
| DD-SF-AR-0001-002 | 請求書発行API | api | `[{ callerType: "system", callerDdId: "DD-SF-AR-0001-001", callType: "calls_sync" }]` |
| DD-SF-AR-0001-003 | 請求書一括発行バッチ | batch | `[{ callerType: "system", callType: "calls_async" }]` |
| DD-SF-AR-0001-004 | メール送信I/F | external_if | `[{ callerType: "system", callerDdId: "DD-SF-AR-0001-002", callType: "calls_sync" }]` |
| DD-SF-AR-0001-020 | 売上/請求仕訳連携ロジック | job | `[{ callerType: "system", callType: "calls_async" }]` |
| DD-SF-AR-0002-001 | 商品マスタ税率区分管理画面 | screen | `[{ callerType: "user" }]` |
| DD-SF-AR-0002-002 | 税率別内訳集計API | api | `[{ callerType: "system", callerDdId: "DD-SF-AR-0001-001", callType: "calls_sync" }]` |
| DD-SF-AR-0003-001 | 入金データ取込バッチ | batch | `[{ callerType: "system", callType: "calls_async" }]` |
| DD-SF-AR-0003-002 | 銀行マスタ管理画面 | screen | `[{ callerType: "user" }]` |
| DD-SF-AR-0004-001 | 入金消込API | api | `[{ callerType: "system", callerDdId: "DD-SF-AR-0004-002", callType: "calls_sync" }]` |
| DD-SF-AR-0004-002 | 入金消込画面 | screen | `[{ callerType: "user" }]` |
| DD-SF-AR-0005-001 | 債権管理一覧画面 | screen | `[{ callerType: "user" }]` |
| DD-SF-AR-0005-002 | 督促状発行バッチ | batch | `[{ callerType: "system", callType: "calls_async" }]` |
| DD-SF-AR-0005-003 | 延滞アラート通知API | api | `[{ callerType: "system", callerDdId: "DD-SF-AR-0005-002", callType: "calls_async" }]` |
| DD-SF-AR-0006-001 | 与信管理画面 | screen | `[{ callerType: "user" }]` |
| DD-SF-AR-0006-002 | 与信枠変更承認API | api | `[{ callerType: "system", callerDdId: "DD-SF-AR-0006-001", callType: "calls_sync" }]` |
| DD-SF-AR-0007-001 | 顧客ポータル認証API | api | `[{ callerType: "system", callType: "calls_sync" }]` |
| DD-SF-AR-0007-002 | 電子請求書送信I/F | external_if | `[{ callerType: "system", callerDdId: "DD-SF-AR-0001-003", callType: "calls_sync" }]` |
| DD-SF-AR-0008-001 | 延滞債権アラートAPI | api | `[{ callerType: "system", callerDdId: "DD-SF-AR-0005-002", callType: "calls_async" }]` |
| DD-SF-AR-0009-001 | 売掛金自動計上バッチ | batch | `[{ callerType: "system", callType: "calls_async" }]` |

### GL領域（総勘定元帳）

| DD ID | DD名 | タイプ | 呼び出し元設定 |
|-------|------|--------|--------------|
| DD-SF-GL-0002-002 | 仕訳転記エラー通知API | api | `[{ callerType: "system", callerDdId: "DD-SF-AR-0001-020", callType: "calls_async" }]` |

### model系DD

全ての model タイプ DD に `callers: []` を設定（呼び出し元なし）。

## 実装手順

1. **Supabase MCP `execute_sql` を使用**
2. **各DDに対して `details` JSONB を更新**
3. **`callers` フィールドを `details` のトップレベルに追加**

## SQLパターン

```sql
-- 画面系（ユーザー起動）
UPDATE design_documents
SET details = jsonb_set(
  COALESCE(details, '{}'::jsonb),
  '{callers}',
  '[{"callerType": "user"}]'::jsonb
)
WHERE id = 'DD-XXX';

-- API系（画面からの同期呼び出し）
UPDATE design_documents
SET details = jsonb_set(
  COALESCE(details, '{}'::jsonb),
  '{callers}',
  '[{"callerType": "system", "callerDdId": "DD-SF-XXX-001", "callType": "calls_sync"}]'::jsonb
)
WHERE id = 'DD-XXX';

-- バッチ系（非同期起動）
UPDATE design_documents
SET details = jsonb_set(
  COALESCE(details, '{}'::jsonb),
  '{callers}',
  '[{"callerType": "system", "callType": "calls_async"}]'::jsonb
)
WHERE id = 'DD-XXX';

-- model系（呼び出し元なし）
UPDATE design_documents
SET details = jsonb_set(
  COALESCE(details, '{}'::jsonb),
  '{callers}',
  '[]'::jsonb
)
WHERE type = 'model';
```

## 検証

1. 更新後、`/system/AR/SF-AR-0001/edit/design-documents` にアクセス
2. 各DDカードの「呼び出し元」セクションでデータが表示されることを確認
3. UIで呼び出し元の追加・編集・削除ができることを確認

## 注意点

- `details` JSONB が `NULL` の場合を考慮し、`COALESCE(details, '{}'::jsonb)` を使用
- `callerDdId` は実際に存在する DD ID を指定する必要がある
- `callers` は配列形式で、複数の呼び出し元を設定可能
