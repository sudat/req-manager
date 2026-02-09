# ARドメイン・デザインドキュメント サンプルデータ投入計画

## Context

ARドメイン（債権管理）のデザインドキュメント18件に対し、構造化サンプルデータ（`inputFields`, `outputFields`, `exceptions`, `nonFunctional`）を投入する。

**背景:**
- 現在の `details` カラムには構造があるものの、`inputFields`/`outputFields`/`exceptions` が空の状態
- 開発・デモ用に現実的なサンプルデータが必要
- スキーマ検証済みのデータを投入することで、データ整合性を担保

**目的:**
- デザインドキュメントの編集画面でサンプルデータを表示
- I/Oタイプ別のデータ構造の理解を促進
- AIによる設計書生成・理解のための学習データとして活用

## 対象ドキュメント一覧（18件）

| ID | 名称 | タイプ | 関連SRF |
|----|------|--------|---------|
| DD-AR-001-01 | 請求書発行画面 | screen | SF-AR-0001 |
| DD-AR-001-02 | 請求書発行API | api | SF-AR-0001 |
| DD-AR-001-03 | 請求書一括発行バッチ | batch | SF-AR-0001 |
| DD-AR-001-04 | メール送信I/F | external_if | SF-AR-0001 |
| DD-AR-002-01 | 商品マスタ税率区分管理画面 | screen | SF-AR-0002 |
| DD-AR-002-02 | 税率別内訳集計API | api | SF-AR-0002 |
| DD-AR-003-01 | 入金データ取込バッチ | batch | SF-AR-0003 |
| DD-AR-003-02 | 銀行マスタ管理画面 | screen | SF-AR-0003 |
| DD-AR-004-01 | 入金消込API | api | SF-AR-0004 |
| DD-AR-004-02 | 入金消込画面 | screen | SF-AR-0004 |
| DD-AR-005-01 | 債権管理一覧画面 | screen | SF-AR-0005 |
| DD-AR-005-02 | 督促状発行バッチ | batch | SF-AR-0005 |
| DD-AR-005-03 | 延滞アラート通知API | api | SF-AR-0005 |
| DD-AR-006-01 | 与信管理画面 | screen | SF-AR-0006 |
| DD-AR-006-02 | 与信枠変更承認API | api | SF-AR-0006 |
| DD-AR-007-01 | 顧客ポータル認証API | api | SF-AR-0007 |
| DD-AR-007-02 | 電子請求書送信I/F | external_if | SF-AR-0007 |
| DD-AR-008-01 | 延滞債権アラートAPI | api | SF-AR-0008 |

**タイプ別分布:**
- API: 7件
- Screen: 6件
- Batch: 3件
- External_if: 2件

## Critical Files for Implementation

### スキーマ定義（データ構造の理解）
- `/usr/local/src/dev/wsl/personal-pj/req-manager/lib/domain/schemas/design-document-structured.ts` - メインスキーマ
- `/usr/local/src/dev/wsl/personal-pj/req-manager/lib/domain/schemas/fields.ts` - fieldSchema定義
- `/usr/local/src/dev/wsl/personal-pj/req-manager/lib/domain/schemas/exceptions.ts` - exceptionSchema定義
- `/usr/local/src/dev/wsl/personal-pj/req-manager/lib/domain/schemas/non-functional.ts` - nonFunctionalSchema定義

### 既存サンプル（コンテキスト参考）
- `/usr/local/src/dev/wsl/personal-pj/req-manager/.tmp/seed-impl-unit-sds-ar-others.sql` - ARドメインの既存サンプル（フィールド名やエラーパターン参考）

## Implementation Approach

### ステップ1: サンプルデータ作成

各デザインドキュメントに対し、I/Oタイプ別のサンプルデータを作成。

**投入データ構造:**
```json
{
  "inputFields": [...],    // 3-5件のフィールド定義
  "outputFields": [...],   // 3-5件のフィールド定義
  "exceptions": [...],     // 2-5件の例外パターン
  "nonFunctional": {...}   // レスポンスタイム、可用性、認証方式等
}
```

**I/Oタイプ別データパターン:**

| タイプ | inputFields例 | outputFields例 | exceptions例 |
|--------|---------------|----------------|--------------|
| API | query, bodyパラメータ | successレスポンス項目 | validation, permission, externalエラー |
| Screen | form入力項目、filters | transition, messages | validation, stateエラー |
| Batch | parameters（chunkSize, parallelism） | summary（processedCount, status） | timeout, conflictエラー |
| External_if | recipient, attachments | messageId, status | validation, externalエラー |

### ステップ2: SQL生成

Supabase MCPの `execute_sql` で実行するUPDATE文を生成。

**SQLパターン:**
```sql
UPDATE design_documents
SET details = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        details,
        '{inputFields}',
        '[...inputFields...]'::jsonb
      ),
      '{outputFields}',
      '[...outputFields...]'::jsonb
    ),
    '{exceptions}',
    '[...exceptions...]'::jsonb
  ),
  '{nonFunctional}',
  '{...nonFunctional...}'::jsonb
),
updated_at = now()
WHERE id = 'DD-AR-XXX-XX';
```

**重要:**
- 既存の `ioType`, `version`, `inputSchema`, `outputSchema`, `sideEffects` は保持
- `jsonb_set()` を使用してネスト更新

### ステップ3: データ投入

`mcp__plugin_supabase_supabase__execute_sql` を使用して18件分のUPDATEを実行。

**プロジェクトID:** `mbzvpmcikjncjrnbusdn`

### ステップ4: 検証

投入後のデータ整合性を確認。

**検証クエリ:**
```sql
-- 各DDのフィールド件数確認
SELECT
  id, name, type,
  jsonb_array_length(details->'inputFields') as input_count,
  jsonb_array_length(details->'outputFields') as output_count,
  jsonb_array_length(details->'exceptions') as exceptions_count
FROM design_documents
WHERE id LIKE 'DD-AR-%'
ORDER BY id;
```

## サンプルデータ例

### APIタイプ例: DD-AR-002-02 税率別内訳集計API

```json
{
  "inputFields": [
    {"name": "lineItems", "type": "array", "required": true, "description": "明細行データ（商品ID、数量、単価を含む）", "constraints": {"min": 1}},
    {"name": "customerId", "type": "string", "required": false, "description": "顧客ID（免税事業者判定用）", "constraints": {"format": "uuid"}},
    {"name": "invoiceDate", "type": "string", "required": true, "description": "請求日（税率判定用）", "constraints": {"format": "date"}}
  ],
  "outputFields": [
    {"name": "subtotal10", "type": "number", "required": true, "description": "10%対象の税抜金額合計"},
    {"name": "tax10", "type": "number", "required": true, "description": "10%消費税額"},
    {"name": "subtotal8", "type": "number", "required": true, "description": "8%対象の税抜金額合計"},
    {"name": "tax8", "type": "number", "required": true, "description": "8%消費税額"},
    {"name": "total", "type": "number", "required": true, "description": "税込金額合計"}
  ],
  "exceptions": [
    {"type": "validation", "condition": "lineItemsが空または商品マスタに存在しない商品IDを含む", "httpStatus": 400, "errorCode": "INVALID_LINE_ITEMS", "message": "明細データが無効です", "userNotification": "inline", "logging": "error", "recovery": "none"},
    {"type": "external", "condition": "商品マスタAPIがタイムアウト", "httpStatus": 503, "errorCode": "PRODUCT_MASTER_TIMEOUT", "message": "商品マスタ参照がタイムアウトしました", "userNotification": "toast", "logging": "error", "recovery": "retry_with_backoff", "retryPolicy": {"maxRetries": 3, "backoffMs": 1000}},
    {"type": "state", "condition": "軽減税率対象商品の税率区分が未設定", "httpStatus": 422, "errorCode": "TAX_RATE_NOT_CONFIGURED", "message": "商品の税率区分が設定されていません", "userNotification": "modal", "logging": "audit", "recovery": "manual_intervention"}
  ],
  "nonFunctional": {
    "responseTimeP95": "300ms",
    "uptime": "99.9%",
    "authMethod": "oauth2",
    "authorizationBoundary": "billing:invoice:read権限が必要"
  }
}
```

### Screenタイプ例: DD-AR-006-01 与信管理画面

```json
{
  "inputFields": [
    {"name": "customerId", "type": "string", "required": false, "description": "検索対象の顧客ID", "constraints": {"format": "uuid"}},
    {"name": "customerName", "type": "string", "required": false, "description": "顧客名（あいまい検索）", "constraints": {"max": 100}},
    {"name": "filterStatus", "type": "enum", "required": false, "description": "表示フィルタ（与信枠超過のみ等）", "constraints": {"enum": ["all", "over_limit", "warning", "normal"], "default": "all"}},
    {"name": "sortBy", "type": "enum", "required": false, "description": "ソート項目", "constraints": {"enum": ["customer_name", "usage_rate", "remaining_limit"], "default": "usage_rate"}}
  ],
  "outputFields": [
    {"name": "customers", "type": "array", "required": true, "description": "顧客一覧（与信枠、残高、利用率を含む）"},
    {"name": "totalCount", "type": "number", "required": true, "description": "総件数"},
    {"name": "overLimitCount", "type": "number", "required": true, "description": "与信枠超過顧客数"},
    {"name": "transition", "type": "string", "required": false, "description": "詳細画面への遷移パス"},
    {"name": "messages", "type": "array", "required": false, "description": "通知メッセージ"}
  ],
  "exceptions": [
    {"type": "permission", "condition": "与信管理参照権限がない", "errorCode": "INSUFFICIENT_PERMISSIONS", "message": "与信管理の参照権限がありません", "userNotification": "modal", "logging": "audit", "recovery": "none"},
    {"type": "state", "condition": "指定された顧客が存在しない", "errorCode": "CUSTOMER_NOT_FOUND", "message": "指定された顧客が見つかりません", "userNotification": "toast", "logging": "structured", "recovery": "none"}
  ],
  "nonFunctional": {
    "responseTimeP95": "500ms",
    "uptime": "99.9%",
    "authMethod": "oauth2",
    "authorizationBoundary": "billing:credit:read権限が必要"
  }
}
```

### Batchタイプ例: DD-AR-003-01 入金データ取込バッチ

```json
{
  "inputFields": [
    {"name": "targetDate", "type": "string", "required": false, "description": "取込対象日（YYYY-MM-DD、未指定なら前日）", "constraints": {"pattern": "^\\d{4}-\\d{2}-\\d{2}$"}},
    {"name": "sourceBank", "type": "string", "required": false, "description": "取込元銀行コード（未指定なら全銀行）"},
    {"name": "chunkSize", "type": "number", "required": false, "description": "チャンクサイズ（一度に処理する件数）", "constraints": {"min": 100, "max": 10000, "default": 1000}},
    {"name": "dryRun", "type": "boolean", "required": false, "description": "ドライランモード（取込なしで検証のみ）", "constraints": {"default": false}}
  ],
  "outputFields": [
    {"name": "processedCount", "type": "number", "required": true, "description": "処理対象総件数"},
    {"name": "successCount", "type": "number", "required": true, "description": "取込成功件数"},
    {"name": "errorCount", "type": "number", "required": true, "description": "取込失敗件数"},
    {"name": "status", "type": "enum", "required": true, "description": "処理ステータス", "constraints": {"enum": ["completed", "partial", "failed"]}},
    {"name": "executionTimeMs", "type": "number", "required": false, "description": "実行時間（ミリ秒）"},
    {"name": "nextBatch", "type": "string", "required": false, "description": "次回バッチの実行予定"}
  ],
  "exceptions": [
    {"type": "timeout", "condition": "バッチ処理が30分でタイムアウト", "errorCode": "BATCH_TIMEOUT", "message": "バッチ処理がタイムアウトしました", "userNotification": "none", "logging": "error", "recovery": "manual_intervention"},
    {"type": "conflict", "condition": "他のバッチジョブが実行中", "errorCode": "BATCH_ALREADY_RUNNING", "message": "バッチ処理が既に実行中です", "userNotification": "none", "logging": "audit", "recovery": "none"},
    {"type": "external", "condition": "FTPサーバー接続エラー", "errorCode": "FTP_CONNECTION_ERROR", "message": "FTPサーバーに接続できません", "userNotification": "none", "logging": "error", "recovery": "retry_with_backoff", "retryPolicy": {"maxRetries": 5, "backoffMs": 30000}}
  ],
  "nonFunctional": {
    "responseTimeP95": "5s",
    "uptime": "99.5%",
    "authMethod": "api_key",
    "authorizationBoundary": "cronジョブからの実行のみ許可"
  }
}
```

### External_ifタイプ例: DD-AR-001-04 メール送信I/F

```json
{
  "inputFields": [
    {"name": "recipient", "type": "string", "required": true, "description": "送信先メールアドレス", "constraints": {"format": "email"}},
    {"name": "subject", "type": "string", "required": true, "description": "メール件名", "constraints": {"max": 100, "min": 1}},
    {"name": "attachments", "type": "array", "required": true, "description": "添付ファイルURL（PDF等）", "constraints": {"min": 1}},
    {"name": "provider", "type": "enum", "required": false, "description": "送信プロバイダ", "constraints": {"enum": ["sendgrid", "ses"], "default": "sendgrid"}},
    {"name": "trackingEnabled", "type": "boolean", "required": false, "description": "開封・クリック追跡有効フラグ", "constraints": {"default": true}}
  ],
  "outputFields": [
    {"name": "messageId", "type": "string", "required": true, "description": "メッセージID（追跡用）"},
    {"name": "status", "type": "enum", "required": true, "description": "送信ステータス", "constraints": {"enum": ["queued", "sent", "failed"]}},
    {"name": "provider", "type": "string", "required": true, "description": "使用プロバイダ"},
    {"name": "estimatedDelivery", "type": "string", "required": false, "description": "推定配信時刻"}
  ],
  "exceptions": [
    {"type": "validation", "condition": "メールアドレスが無効または添付ファイルが空", "httpStatus": 400, "errorCode": "INVALID_EMAIL_OR_ATTACHMENTS", "message": "送信先メールアドレスが無効、または添付ファイルがありません", "userNotification": "inline", "logging": "structured", "recovery": "none"},
    {"type": "external", "condition": "SendGrid APIが5xxエラーを返す", "httpStatus": 502, "errorCode": "SENDGRID_API_ERROR", "message": "メール送信サービスでエラーが発生しました", "userNotification": "toast", "logging": "error", "recovery": "fallback", "retryPolicy": {"maxRetries": 2, "backoffMs": 1000}},
    {"type": "timeout", "condition": "SendGrid APIがタイムアウト（10秒）", "httpStatus": 504, "errorCode": "SENDGRID_TIMEOUT", "message": "メール送信がタイムアウトしました", "userNotification": "toast", "logging": "error", "recovery": "retry_immediate", "retryPolicy": {"maxRetries": 1, "backoffMs": 0}}
  ],
  "nonFunctional": {
    "responseTimeP95": "2s",
    "uptime": "99.5%",
    "authMethod": "api_key",
    "authorizationBoundary": "内部サービスからの呼び出しのみ許可"
  }
}
```

## Verification

投入完了後、以下の検証を実施：

1. **件数確認**: 18件全ての `inputFields`/`outputFields`/`exceptions` にデータが入っているか
2. **型チェック**: 各フィールドがスキーマ定義通りの型を持っているか
3. **I/Oタイプ別パターン**: APIならbody/query、Screenならelements、Batchならschedule/sourceが含まれているか
4. **画面確認**: `http://localhost:3000/system/AR/` から各デザインドキュメントを開き、データが表示されているか

**検証クエリ:**
```sql
-- データ投入状況確認
SELECT
  id, name, type,
  jsonb_array_length(details->'inputFields') as input_count,
  jsonb_array_length(details->'outputFields') as output_count,
  jsonb_array_length(details->'exceptions') as exceptions_count,
  details->'nonFunctional' as non_functional
FROM design_documents
WHERE id LIKE 'DD-AR-%'
ORDER BY id;
```
