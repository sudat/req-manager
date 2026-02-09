# ARドメイン・デザインドキュメント サンプルデータ投入計画

## 概要

ARドメイン（債権管理）のデザインドキュメント18件に対し、構造化サンプルデータ（inputFields, outputFields, exceptions, nonFunctional）を投入する。

## 現状分析

### 対象ドキュメント一覧（18件）

| ID | 名称 | タイプ |
|----|------|--------|
| DD-AR-001-01 | 請求書発行画面 | screen |
| DD-AR-001-02 | 請求書発行API | api |
| DD-AR-001-03 | 請求書一括発行バッチ | batch |
| DD-AR-001-04 | メール送信I/F | external_if |
| DD-AR-002-01 | 商品マスタ税率区分管理画面 | screen |
| DD-AR-002-02 | 税率別内訳集計API | api |
| DD-AR-003-01 | 入金データ取込バッチ | batch |
| DD-AR-003-02 | 銀行マスタ管理画面 | screen |
| DD-AR-004-01 | 入金消込API | api |
| DD-AR-004-02 | 入金消込画面 | screen |
| DD-AR-005-01 | 債権管理一覧画面 | screen |
| DD-AR-005-02 | 督促状発行バッチ | batch |
| DD-AR-005-03 | 延滞アラート通知API | api |
| DD-AR-006-01 | 与信管理画面 | screen |
| DD-AR-006-02 | 与信枠変更承認API | api |
| DD-AR-007-01 | 顧客ポータル認証API | api |
| DD-AR-007-02 | 電子請求書送信I/F | external_if |
| DD-AR-008-01 | 延滞債権アラートAPI | api |

### タイプ別分布
- **api**: 7件
- **screen**: 6件
- **batch**: 3件
- **external_if**: 2件

### 現在のdetails構造
既に構造化データが存在するが、以下が空：
- `inputFields`: 空配列 `[]`
- `outputFields`: 空配列 `[]`
- `exceptions`: 空配列 `[]`
- `nonFunctional`: 空オブジェクト `{}`

### スキーマ定義の確認
- **fieldSchema**: `/usr/local/src/dev/wsl/personal-pj/req-manager/lib/domain/schemas/fields.ts`
- **structuredExceptionSchema**: `/usr/local/src/dev/wsl/personal-pj/req-manager/lib/domain/schemas/exceptions.ts`
- **structuredNonFunctionalSchema**: `/usr/local/src/dev/wsl/personal-pj/req-manager/lib/domain/schemas/non-functional.ts`

## サンプルデータ設計

### I/Oタイプ別データパターン

#### 1. APIタイプ（7件）

**inputFieldsパターン（query + body）:**
```json
{
  "inputFields": [
    {"name": "targetIds", "type": "array", "required": true, "description": "請求対象のID配列", "constraints": {"min": 1}},
    {"name": "issueDate", "type": "string", "required": true, "description": "発行日", "constraints": {"format": "date"}},
    {"name": "dueDate", "type": "string", "required": false, "description": "支払期限", "constraints": {"format": "date"}}
  ]
}
```

**outputFieldsパターン（success）:**
```json
{
  "outputFields": [
    {"name": "jobId", "type": "string", "required": true, "description": "バッチジョブID"},
    {"name": "estimatedSeconds", "type": "number", "required": true, "description": "推定完了時間（秒）", "constraints": {"min": 0}},
    {"name": "invoiceIds", "type": "array", "required": true, "description": "作成された請求書ID"}
  ]
}
```

**exceptionsパターン（3-5件）:**
```json
{
  "exceptions": [
    {
      "type": "validation",
      "condition": "targetIdsが空または無効なIDを含む",
      "httpStatus": 400,
      "errorCode": "INVALID_TARGET_IDS",
      "message": "請求対象IDが無効です",
      "userNotification": "inline",
      "logging": "error",
      "recovery": "none"
    },
    {
      "type": "permission",
      "condition": "請求書発行権限がない",
      "httpStatus": 403,
      "errorCode": "INSUFFICIENT_PERMISSIONS",
      "message": "請求書発行権限がありません",
      "userNotification": "modal",
      "logging": "audit",
      "recovery": "none"
    },
    {
      "type": "external",
      "condition": "メール送信APIがタイムアウト",
      "httpStatus": 503,
      "errorCode": "EMAIL_SERVICE_TIMEOUT",
      "message": "メール送信サービスが一時的に利用できません",
      "userNotification": "toast",
      "logging": "error",
      "recovery": "retry_with_backoff",
      "retryPolicy": {"maxRetries": 3, "backoffMs": 2000}
    }
  ]
}
```

**nonFunctionalパターン:**
```json
{
  "nonFunctional": {
    "responseTimeP95": "500ms",
    "uptime": "99.9%",
    "authMethod": "oauth2",
    "authorizationBoundary": "billing:invoice:issue権限が必要"
  }
}
```

#### 2. Screenタイプ（6件）

**inputFieldsパターン（elements）:**
```json
{
  "inputFields": [
    {"name": "targetPeriod", "type": "object", "required": true, "description": "請求対象期間（開始日・終了日）"},
    {"name": "customerIds", "type": "array", "required": true, "description": "対象顧客ID", "constraints": {"min": 1}},
    {"name": "invoiceStatus", "type": "enum", "required": false, "description": "フィルタ:請求ステータス", "constraints": {"enum": ["unbilled", "rebilled"]}},
    {"name": "sendEmail", "type": "boolean", "required": false, "description": "メール送信フラグ", "constraints": {"default": true}}
  ]
}
```

**outputFieldsパターン（transition + messages）:**
```json
{
  "outputFields": [
    {"name": "transition", "type": "string", "required": false, "description": "遷移先パス"},
    {"name": "messages", "type": "array", "required": false, "description": "成功/エラーメッセージ"},
    {"name": "previewUrl", "type": "string", "required": false, "description": "プレビューPDF URL"}
  ]
}
```

**exceptionsパターン（2-3件）:**
```json
{
  "exceptions": [
    {
      "type": "validation",
      "condition": "対象期間が不正（開始日 > 終了日）",
      "errorCode": "INVALID_PERIOD",
      "message": "対象期間を正しく設定してください",
      "userNotification": "inline",
      "logging": "structured",
      "recovery": "none"
    },
    {
      "type": "state",
      "condition": "該当する請求対象が存在しない",
      "errorCode": "NO_TARGETS_FOUND",
      "message": "指定された条件で請求対象が見つかりません",
      "userNotification": "toast",
      "logging": "error",
      "recovery": "none"
    }
  ]
}
```

#### 3. Batchタイプ（3件）

**inputFieldsパターン（parameters）:**
```json
{
  "inputFields": [
    {"name": "targetMonth", "type": "string", "required": false, "description": "対象月（YYYY-MM）", "constraints": {"pattern": "^\\d{4}-\\d{2}$"}},
    {"name": "chunkSize", "type": "number", "required": false, "description": "チャンクサイズ", "constraints": {"min": 10, "max": 1000, "default": 100}},
    {"name": "parallelism", "type": "number", "required": false, "description": "並列度", "constraints": {"min": 1, "max": 10, "default": 5}}
  ]
}
```

**outputFieldsパターン（summary）:**
```json
{
  "outputFields": [
    {"name": "processedCount", "type": "number", "required": true, "description": "処理対象総件数"},
    {"name": "successCount", "type": "number", "required": true, "description": "成功件数"},
    {"name": "errorCount", "type": "number", "required": true, "description": "失敗件数"},
    {"name": "status", "type": "enum", "required": true, "description": "処理ステータス", "constraints": {"enum": ["completed", "partial", "failed"]}},
    {"name": "executionTimeMs", "type": "number", "required": false, "description": "実行時間（ミリ秒）"}
  ]
}
```

**exceptionsパターン（2-3件）:**
```json
{
  "exceptions": [
    {
      "type": "timeout",
      "condition": "バッチ処理がタイムアウト（30分超過）",
      "errorCode": "BATCH_TIMEOUT",
      "message": "バッチ処理がタイムアウトしました",
      "userNotification": "none",
      "logging": "error",
      "recovery": "manual_intervention"
    },
    {
      "type": "conflict",
      "condition": "他のバッチジョブが実行中",
      "errorCode": "BATCH_ALREADY_RUNNING",
      "message": "バッチ処理が既に実行中です",
      "userNotification": "none",
      "logging": "audit",
      "recovery": "none"
    }
  ]
}
```

#### 4. External_ifタイプ（2件）

**inputFieldsパターン:**
```json
{
  "inputFields": [
    {"name": "recipient", "type": "string", "required": true, "description": "送信先メールアドレス", "constraints": {"format": "email"}},
    {"name": "subject", "type": "string", "required": true, "description": "メール件名", "constraints": {"max": 100}},
    {"name": "attachments", "type": "array", "required": true, "description": "添付ファイルURL", "constraints": {"min": 1}},
    {"name": "provider", "type": "enum", "required": false, "description": "送信プロバイダ", "constraints": {"enum": ["sendgrid", "ses"], "default": "sendgrid"}}
  ]
}
```

**outputFieldsパターン:**
```json
{
  "outputFields": [
    {"name": "messageId", "type": "string", "required": true, "description": "メッセージID"},
    {"name": "status", "type": "enum", "required": true, "description": "送信ステータス", "constraints": {"enum": ["queued", "sent", "failed"]}},
    {"name": "provider", "type": "string", "required": true, "description": "使用プロバイダ"}
  ]
}
```

**exceptionsパターン（3-4件）:**
```json
{
  "exceptions": [
    {
      "type": "validation",
      "condition": "メールアドレスが無効",
      "httpStatus": 400,
      "errorCode": "INVALID_EMAIL",
      "message": "送信先メールアドレスが無効です",
      "userNotification": "inline",
      "logging": "structured",
      "recovery": "none"
    },
    {
      "type": "external",
      "condition": "SendGrid APIが5xxエラーを返す",
      "httpStatus": 502,
      "errorCode": "SENDGRID_API_ERROR",
      "message": "メール送信サービスでエラーが発生しました",
      "userNotification": "toast",
      "logging": "error",
      "recovery": "fallback",
      "retryPolicy": {"maxRetries": 2, "backoffMs": 1000}
    }
  ]
}
```

## 投入方法

### Supabase MCPを使用したUPDATE文

**手順:**
1. 各デザインドキュメントのIDを指定
2. `details`カラムをJSONBで更新
3. 既存の`ioType`, `version`, `inputSchema`, `outputSchema`, `sideEffects`は保持
4. `inputFields`, `outputFields`, `exceptions`, `nonFunctional`のみ追加/更新

**SQLテンプレート:**
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

### 一括投入スクリプト

18件分のUPDATE文を1つのSQLファイルにまとめて実行。

## 検証方法

### 1. データ整合性確認

```sql
-- 各DDのinputFields件数
SELECT 
  id, 
  name, 
  type,
  jsonb_array_length(details->'inputFields') as input_fields_count,
  jsonb_array_length(details->'outputFields') as output_fields_count,
  jsonb_array_length(details->'exceptions') as exceptions_count,
  details->'nonFunctional' as non_functional
FROM design_documents
WHERE id LIKE 'DD-AR-%'
ORDER BY id;
```

### 2. スキーマ検証

各フィールドが定義通りか確認：
- `fieldSchema`: name, type, required, constraintsの型チェック
- `structuredExceptionSchema`: type, condition, errorCode, message, recoveryの型チェック
- `structuredNonFunctionalSchema`: responseTimeP95, uptime, authMethodの型チェック

### 3. I/Oタイプ別パターン確認

```sql
-- APIタイプ: body/queryフィールドがあるか
SELECT id, name
FROM design_documents
WHERE type = 'api' 
  AND id LIKE 'DD-AR-%'
  AND (
    details->'inputSchema'->'body' IS NOT NULL 
    OR details->'inputSchema'->'query' IS NOT NULL
  );

-- Screenタイプ: elementsフィールドがあるか
SELECT id, name
FROM design_documents
WHERE type = 'screen' 
  AND id LIKE 'DD-AR-%'
  AND details->'inputSchema'->'elements' IS NOT NULL;

-- Batchタイプ: schedule/sourceがあるか
SELECT id, name
FROM design_documents
WHERE type = 'batch' 
  AND id LIKE 'DD-AR-%'
  AND (
    details->'inputSchema'->>'schedule' IS NOT NULL 
    OR details->'inputSchema'->>'source' IS NOT NULL
  );
```

## 実装手順

1. **サンプルデータ作成**: 18件分のJSONデータを作成（I/Oタイプ別パターン適用）
2. **SQL生成**: UPDATE文18件を含むSQLファイルを作成
3. **投入実行**: Supabase MCPの`execute_sql`で実行
4. **検証**: 上記検証クエリでデータ整合性を確認

## Critical Files for Implementation

### Critical Files for Implementation
- `/usr/local/src/dev/wsl/personal-pj/req-manager/lib/domain/schemas/fields.ts` - fieldSchema定義（inputFields/outputFieldsの型チェック）
- `/usr/local/src/dev/wsl/personal-pj/req-manager/lib/domain/schemas/exceptions.ts` - structuredExceptionSchema定義（exceptionsの型チェック）
- `/usr/local/src/dev/wsl/personal-pj/req-manager/lib/domain/schemas/non-functional.ts` - structuredNonFunctionalSchema定義（nonFunctionalの型チェック）
- `/usr/local/src/dev/wsl/personal-pj/req-manager/lib/domain/schemas/design-document-structured.ts` - メインスキーマ（全体構造の理解）
- `/usr/local/src/dev/wsl/personal-pj/req-manager/.tmp/seed-impl-unit-sds.sql` - 既存サンプルデータのパターン参考

