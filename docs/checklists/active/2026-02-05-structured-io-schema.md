# SR/DD 構造化入出力スキーマ導入 チェックリスト

## 作業概要

control_plane.md「3章 方針A」に厳密に準拠し、**DD（成果物）レベル**での入出力定義をテキスト自由記述から構造化スキーマに移行する。これにより「人間の意図と実装の乖離」を防ぎ、型・制約・必須/任意などの具体性を保証する。

**対象**: DD（成果物）の `functionDesignContent`（input/output）
**非対象**: SR（システム要件）は現状のまま（別途検討が必要）

---

## 目標スキーマ構造（理想）

### 現状（テキスト自由記述）
```yaml
# 現在のDD（成果物）- function観点
input: "customer_id（必須、文字列、C开头6桁）、amount（必須、数値、0-999999）"
output: "invoice_id（文字列）、status（issued/error）"
sideEffects: "invoicesテーブルにINSERT"
```

### 理想（control_plane.md「方針A」に準拠した構造化）
```yaml
# 目標のDD（成果物）- function観点 - APIの場合
ioType: "api"
structuredInput:
  method: "POST"
  path: "/api/invoices"
  query: []
  body:
    - name: "customer_id"
      type: "string"
      required: true
      description: "顧客ID"
      constraints:
        pattern: "^C[0-9]{6}$"
    - name: "amount"
      type: "number"
      required: true
      description: "請求金額"
      constraints:
        min: 0
        max: 999999

structuredOutput:
  success:
    status: 201
    fields:
      - name: "invoice_id"
        type: "string"
        required: true
      - name: "status"
        type: "enum"
        required: true
        constraints:
          enum: ["issued"]
  error:
    - status: 422
      fields:
        - name: "error_code"
          type: "enum"
          required: true
          constraints:
            enum: ["VALIDATION_ERROR", "CUSTOMER_NOT_FOUND"]
        - name: "field"
          type: "string"
          required: false

# 副作用（状態変化）- control_plane.md「状態変化」対応
structuredSideEffects:
  dbOperations:
    - table: "invoices"
      operation: "insert"
      affectedColumns: ["id", "customer_id", "amount", "status", "created_at"]
    - table: "invoice_items"
      operation: "insert"
  events:
    - eventType: "InvoiceIssued"
      payload:
        - name: "invoice_id"
          type: "string"
      destination: "topic"
  logs:
    - level: "info"
      message: "請求書発行完了"
      structuredData:
        - name: "invoice_id"
          type: "string"
        - name: "customer_id"
          type: "string"
        - name: "amount"
          type: "number"
```

### Zodスキーマ構造（実装イメージ）
```typescript
// 基本フィールド定義
const fieldSchema = z.object({
  name: z.string(),
  type: z.enum(["string", "number", "boolean", "enum", "object", "array"]),
  required: z.boolean().default(true),
  description: z.string().optional(),
  constraints: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    enum: z.array(z.string()).optional(),
    default: z.unknown().optional(),
  }).optional(),
});

// API入力
const apiInputSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  path: z.string(),
  query: z.array(fieldSchema).optional(),
  body: z.array(fieldSchema).optional(),
});

// API出力
const apiOutputSchema = z.object({
  success: z.object({
    status: z.number(),
    fields: z.array(fieldSchema),
  }),
  error: z.array(z.object({
    status: z.number(),
    fields: z.array(fieldSchema),
  })).optional(),
});

// 統合機能観点
const structuredFunctionDesignSchema = z.object({
  ioType: z.enum(["api", "screen", "batch", "job"]),
  structuredInput: z.union([apiInputSchema, screenInputSchema, batchInputSchema, jobInputSchema]),
  structuredOutput: z.union([apiOutputSchema, screenOutputSchema, batchOutputSchema, jobOutputSchema]),
  // 既存フィールドとの互換性
  input: z.string().optional(), // @deprecated
  output: z.string().optional(), // @deprecated
  process: z.string(),
  sideEffects: z.string().optional(),
});
```

---

## 1. スキーマ設計フェーズ

### 1.1 基本フィールド定義
**ファイル**: `lib/domain/schemas/fields.ts`（新規作成）

#### 実装項目
- [ ] `fieldSchema` の定義（name, type, required, description, constraints）
- [ ] `fieldTypeEnum` の定義（string, number, boolean, enum, object, array）
- [ ] `constraintsSchema` の定義（min, max, pattern, enum, default）
- [ ] `fieldArraySchema` の定義（フィールド配列の共通型）

#### 実装例（Zod）
```typescript
export const fieldSchema = z.object({
  name: z.string().min(1, "フィールド名は必須"),
  type: z.enum(["string", "number", "boolean", "enum", "object", "array"]),
  required: z.boolean().default(true),
  description: z.string().optional(),
  constraints: z.object({
    // 数値/文字列共通
    min: z.number().optional(),           // 数値下限 or 文字列最小長
    max: z.number().optional(),           // 数値上限 or 文字列最大長
    
    // 文字列固有（control_plane.md「許容範囲」対応）
    pattern: z.string().optional(),       // 正規表現（例: ^C[0-9]{6}$）
    format: z.enum([                      // 標準フォーマット
      "email", "uuid", "url", "uri", 
      "date", "datetime", "time",
      "ipv4", "ipv6", "hostname"
    ]).optional(),
    
    // 列挙型（権限、状態値など）
    enum: z.array(z.string()).optional(), // 例: ["admin", "editor", "viewer"]
    
    // デフォルト値
    default: z.unknown().optional(),      // デフォルト値
    
    // 追加制約（control_plane.md 5.1節対応）
    unique: z.boolean().optional(),       // DBユニーク制約
    errorMessage: z.string().optional(),  // カスタムエラーメッセージ
  }).optional(),
});

export type Field = z.infer<typeof fieldSchema>;
```

#### control_plane.md対応表

| 方針Aの要求 | constraintsプロパティ | 例 |
|-----------|---------------------|-----|
| **文字数制限** | `min`, `max` | 文字列長1〜100: `min: 1, max: 100` |
| **数値範囲** | `min`, `max` | `0 ≤ amount ≤ 999,999`: `min: 0, max: 999999` |
| **フォーマット（正規表現）** | `pattern` | `customer_id`: `pattern: "^C[0-9]{6}$"` |
| **権限/列挙値** | `enum` | `role`: `enum: ["admin", "editor"]` |
| **標準フォーマット** | `format` | `email`: `format: "email"` |
| **ユニーク制約** | `unique` | `customer_code`: `unique: true` |
| **デフォルト値** | `default` | `status`: `default: "draft"` |

#### 確認項目
- [ ] Zodスキーマが型安全に定義されている
- [ ] constraintsのバリデーションが正しく動作する
- [ ] 各型（string/number/boolean/enum/object/array）で制約が適切に動作する
- [ ] control_plane.mdの「許容範囲」要求が網羅されている（文字数、数値範囲、正規表現、権限、ユニーク制約）

---

### 1.2 タイプ別入出力スキーマ定義
**ファイル**: `lib/domain/schemas/io-schemas.ts`（新規作成）

#### 実装項目
- [ ] `apiInputSchema` の定義（method, path, query[], body[]）
- [ ] `apiOutputSchema` の定義（success: {status, fields}, error: {status, fields}[]）
- [ ] `screenInputSchema` の定義（trigger, elements[]）
- [ ] `screenOutputSchema` の定義（transition, messages[]）
- [ ] `batchInputSchema` の定義（schedule, source, parameters[]）
- [ ] `batchOutputSchema` の定義（summary: {processedCount, successCount, errorCount, status}, nextBatch?）
- [ ] `jobInputSchema` の定義（event, payload[]）
- [ ] `jobOutputSchema` の定義（result, nextEvent）

#### 実装例（APIタイプ）
```typescript
// API入力スキーマ
export const apiInputSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  path: z.string().min(1, "パスは必須"),
  query: z.array(fieldSchema).optional(),
  body: z.array(fieldSchema).optional(),
});
export type ApiInput = z.infer<typeof apiInputSchema>;

// API出力スキーマ
export const apiOutputSchema = z.object({
  success: z.object({
    status: z.number().min(100).max(599),
    fields: z.array(fieldSchema),
  }),
  error: z.array(z.object({
    status: z.number().min(100).max(599),
    fields: z.array(fieldSchema),
    description: z.string().optional(),
  })).optional(),
});
export type ApiOutput = z.infer<typeof apiOutputSchema>;

// バッチ出力スキーマ（副作用と分離）
export const batchOutputSchema = z.object({
  summary: z.object({
    processedCount: z.number().min(0),  // 処理件数
    successCount: z.number().min(0),    // 成功件数
    errorCount: z.number().min(0),      // 失敗件数
    status: z.enum(["completed", "partial", "failed"]),
    executionTimeMs: z.number().optional(),  // 実行時間
  }),
  nextBatch: z.string().optional(),     // 次のバッチ（連鎖する場合）
});
export type BatchOutput = z.infer<typeof batchOutputSchema>;

// 使用例
const exampleApiInput: ApiInput = {
  method: "POST",
  path: "/api/invoices",
  body: [
    { name: "customer_id", type: "string", required: true, constraints: { pattern: "^C[0-9]{6}$" } },
    { name: "amount", type: "number", required: true, constraints: { min: 0, max: 999999 } },
  ],
};
```

#### 確認項目
- [ ] 各スキーマが対象タイプ（api/screen/batch/job）に適切に定義されている
- [ ] 共通の `fieldSchema` を参照している
- [ ] APIの場合、成功/エラーの両パターンが定義できる

---

### 1.3 統合機能観点スキーマ
**ファイル**: `lib/domain/schemas/system-design.ts`

#### 実装項目
- [ ] `structuredFunctionDesignSchema` の定義（V2として追加）
- [ ] `inputSchema` フィールド（z.array(fieldSchema)）
- [ ] `outputSchema` フィールド（z.array(fieldSchema)）
- [ ] `ioType` フィールド（api/screen/batch/jobを区別）
- [ ] `typeSpecificDetail` フィールド（discriminated union）
- [ ] 既存 `functionDesignContentSchema` との互換性確保

#### 実装例（統合スキーマ）
```typescript
// Discriminated Unionによるタイプ別詳細
const typeSpecificSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("api"), detail: apiInputSchema }),
  z.object({ type: z.literal("screen"), detail: screenInputSchema }),
  z.object({ type: z.literal("batch"), detail: batchInputSchema }),
  z.object({ type: z.literal("job"), detail: jobInputSchema }),
]);

// 新しい構造化機能観点（V2）
export const structuredFunctionDesignSchema = z.object({
  // 新しい構造化フィールド
  ioType: z.enum(["api", "screen", "batch", "job"]),
  structuredInput: z.union([apiInputSchema, screenInputSchema, batchInputSchema, jobInputSchema]),
  structuredOutput: z.union([apiOutputSchema, screenOutputSchema, batchOutputSchema, jobOutputSchema]),
  
  // 既存フィールド（互換性のため残す）
  process: z.string().min(1, "処理は必須"),
  sideEffects: z.string().optional(),
  
  // 非推奨フィールド（移行期間中のみ）
  input: z.string().optional().describe("@deprecated: Use structuredInput"),
  output: z.string().optional().describe("@deprecated: Use structuredOutput"),
});

export type StructuredFunctionDesign = z.infer<typeof structuredFunctionDesignSchema>;

// 型ガード
export function isStructuredDesign(design: unknown): design is StructuredFunctionDesign {
  return typeof design === "object" && 
         design !== null && 
         "ioType" in design && 
         "structuredInput" in design;
}
```

#### 確認項目
- [ ] 新しいスキーマが既存コードと競合しない
- [ ] 型ガード関数（isStructuredDesign）が正しく動作する
- [ ] discriminated unionによる型推論が正しく機能する

---

### 1.5 副作用（状態変化）スキーマ定義
**ファイル**: `lib/domain/schemas/side-effects.ts`（新規作成）

control_plane.md「状態変化（副作用）」に対応。

#### 実装項目
- [ ] `dbOperationSchema` の定義（table, operation: insert/update/delete, condition）
- [ ] `externalApiCallSchema` の定義（endpoint, method, payload, retryPolicy）
- [ ] `eventPublishSchema` の定義（eventType, payload, destination）
- [ ] `fileOutputSchema` の定義（path, format, encoding）
- [ ] `logOutputSchema` の定義（level, message, structuredData）
- [ ] `sideEffectSchema` の定義（上記のunion型）
- [ ] タイプ別副作用スキーマ（apiSideEffects, batchSideEffects等）

#### 実装例（Zod）
```typescript
// DB操作
export const dbOperationSchema = z.object({
  table: z.string(),
  operation: z.enum(["insert", "update", "delete", "upsert"]),
  condition: z.string().optional(),  // WHERE句相当
  affectedColumns: z.array(z.string()).optional(),
});

// 外部API呼び出し
export const externalApiCallSchema = z.object({
  endpoint: z.string(),
  method: z.enum(["GET", "POST", "PUT", "DELETE"]),
  payload: z.array(fieldSchema).optional(),
  retryPolicy: z.object({
    maxRetries: z.number().default(3),
    backoffMs: z.number().default(1000),
  }).optional(),
});

// イベント発行
export const eventPublishSchema = z.object({
  eventType: z.string(),
  payload: z.array(fieldSchema),
  destination: z.enum(["queue", "topic", "webhook"]),
  delayMs: z.number().optional(),
});

// ファイル出力
export const fileOutputSchema = z.object({
  path: z.string(),           // 出力パス（変数可）
  format: z.enum(["csv", "json", "xml", "pdf", "txt"]),
  encoding: z.enum(["utf-8", "shift-jis", "euc-jp"]).default("utf-8"),
  append: z.boolean().default(false),
});

// ログ出力
export const logOutputSchema = z.object({
  level: z.enum(["debug", "info", "warn", "error", "fatal"]),
  message: z.string(),
  structuredData: z.array(fieldSchema).optional(),  // 構造化ログ
});

// 統合副作用スキーマ
export const sideEffectSchema = z.object({
  description: z.string(),  // 人間向け説明（既存sideEffectsとの互換）
  dbOperations: z.array(dbOperationSchema).optional(),
  externalApiCalls: z.array(externalApiCallSchema).optional(),
  events: z.array(eventPublishSchema).optional(),
  fileOutputs: z.array(fileOutputSchema).optional(),
  logs: z.array(logOutputSchema).optional(),
});
export type SideEffect = z.infer<typeof sideEffectSchema>;

// バッチ専用副作用（ファイル出力が主要）
export const batchSideEffectsSchema = z.object({
  fileOutputs: z.array(fileOutputSchema).min(1),  // バッチはファイル出力必須
  dbOperations: z.array(dbOperationSchema).optional(),
  logs: z.array(logOutputSchema).optional(),
});
```

#### control_plane.md対応表

| 方針Aの要求 | 副作用スキーマ | 例 |
|-----------|--------------|-----|
| **DBテーブルのCRUD** | `dbOperations` | `INSERT INTO invoices` |
| **外部API呼び出し** | `externalApiCalls` | 決済API連携 |
| **イベント発行** | `events` | `InvoiceIssued`イベント |
| **ファイル出力** | `fileOutputs` | CSV出力、PDF帳票 |
| **ログ出力** | `logs` | 構造化ログ出力 |

#### 確認項目
- [ ] 各副作用が構造化されて定義できる
- [ ] 既存の`sideEffects`（テキスト）との互換性がある
- [ ] バッチの場合、ファイル出力が必須として定義できる

---

### 1.6 例外スキーマ定義
**ファイル**: `lib/domain/schemas/exceptions.ts`（新規作成）

control_plane.md「例外」に対応。エラーの種別、ステータスコード、対応策を構造化。

#### 実装項目
- [ ] `exceptionTypeSchema` の定義（validation/state/permission/external/timeout/conflict）
- [ ] `recoveryStrategySchema` の定義（none/retry_immediate/retry_with_backoff/fallback/manual/circuit_breaker）
- [ ] `structuredExceptionSchema` の定義（type, condition, httpStatus, errorCode, message等）
- [ ] `exceptionDesignContentSchema` の更新（structuredExceptionsフィールド追加）

#### 実装例（Zod）
```typescript
// 例外タイプ（control_plane.md 6.1節対応）
export const exceptionTypeSchema = z.enum([
  "validation",      // 入力不備
  "state",           // 状態不備
  "permission",      // 権限
  "external",        // 外部エラー（DB、API）
  "timeout",         // タイムアウト
  "conflict",        // 競合
]);

// 復旧戦略
export const recoveryStrategySchema = z.enum([
  "none",                    // 復旧不可
  "retry_immediate",         // 即座にリトライ
  "retry_with_backoff",      // バックオフ付きリトライ
  "fallback",                // フォールバック処理
  "manual_intervention",     // 手動対応
  "circuit_breaker",         // サーキットブレーカー
]);

// 詳細な例外定義
export const structuredExceptionSchema = z.object({
  type: exceptionTypeSchema,           // 例外タイプ
  condition: z.string(),               // 発生条件
  
  // HTTP/API関連
  httpStatus: z.number().optional(),   // HTTPステータス
  errorCode: z.string(),               // エラーコード
  message: z.string(),                 // エラーメッセージ
  
  // 対応
  userNotification: z.enum([
    "none", "inline", "toast", "modal", "page"
  ]).optional(),
  logging: z.enum([
    "none", "structured", "audit", "error"
  ]).optional(),
  
  // 復旧
  recovery: recoveryStrategySchema,
  retryPolicy: z.object({
    maxRetries: z.number().default(3),
    backoffMs: z.number().default(1000),
  }).optional(),
});

// 例外観点の更新
export const exceptionDesignContentSchema = z.object({
  structuredExceptions: z.array(structuredExceptionSchema).optional(),  // 新規
  errorCases: z.string().optional(),     // @deprecated
  userNotification: z.string().optional(), // @deprecated
  logging: z.string().optional(),        // @deprecated
  recovery: z.string().optional(),       // @deprecated
});
```

#### control_plane.md対応表

| 方針Aの要求 | 例外スキーマ | 例 |
|-----------|------------|-----|
| **入力不備** | `type: "validation"` | 金額が負数→400エラー |
| **状態不備** | `type: "state"` | 既に発行済み→409エラー |
| **権限不足** | `type: "permission"` | 権限なし→403エラー |
| **外部エラー** | `type: "external"` | DB接続失敗→503エラー |
| **復旧戦略** | `recovery` | retry_with_backoff |

#### 確認項目
- [ ] control_plane.md 6.1節の異常系パターンが網羅されている
- [ ] HTTPステータスコードが適切に定義できる
- [ ] 復旧戦略（リトライ等）が構造化されている

---

### 1.7 非機能要件スキーマ定義
**ファイル**: `lib/domain/schemas/non-functional.ts`（新規作成）

control_plane.md「非機能要件」に対応。数値基準で測定可能な要件を構造化。

#### 実装項目
- [ ] `performanceSchema` の定義（responseTime, throughput, concurrency）
- [ ] `availabilitySchema` の定義（uptime, rto, rpo）
- [ ] `securitySchema` の定義（auth, encryption, compliance）
- [ ] `observabilitySchema` の定義（logging, metrics, tracing, alerting）
- [ ] `nonFunctionalDesignContentSchema` の更新（structuredフィールド追加）

#### 実装例（Zod）
```typescript
// 性能要件（5.1節「曖昧な表現」を具体化）
export const performanceSchema = z.object({
  responseTime: z.object({
    p95: z.string(),           // 例: "200ms"
    p99: z.string().optional(),
    condition: z.string().optional(), // 例: "データ件数1万件以下"
  }).optional(),
  throughput: z.object({
    rps: z.number(),           // リクエスト/秒
    condition: z.string().optional(),
  }).optional(),
  concurrency: z.object({
    maxUsers: z.number(),
    condition: z.string().optional(),
  }).optional(),
});

// 可用性要件
export const availabilitySchema = z.object({
  uptime: z.string(),          // 例: "99.9%"
  monthlyDowntime: z.string(), // 例: "43分以内"
  rto: z.string().optional(),  // 復旧時間目標
  rpo: z.string().optional(),  // 復旧ポイント目標
});

// セキュリティ要件
export const securitySchema = z.object({
  auth: z.object({
    method: z.enum(["oauth2", "oidc", "api_key", "mfa"]),
    sessionTimeout: z.string().optional(),
  }).optional(),
  encryption: z.object({
    inTransit: z.enum(["tls1.2", "tls1.3"]),
    atRest: z.enum(["aes256", "chacha20"]),
  }).optional(),
  compliance: z.array(z.enum([
    "gdpr", "pii", "pci_dss", "iso27001"
  ])).optional(),
});

// 可観測性要件
export const observabilitySchema = z.object({
  logging: z.object({
    format: z.enum(["json", "structured"]),
    retention: z.string(),     // 例: "90日"
    includeFields: z.array(z.string()), // trace_id, user_id等
  }).optional(),
  metrics: z.object({
    collection: z.enum(["prometheus", "cloudwatch", "datadog"]),
    scrapeInterval: z.string(), // 例: "15s"
  }).optional(),
  tracing: z.object({
    enabled: z.boolean(),
    samplingRate: z.number(),  // 0.0〜1.0
  }).optional(),
  alerting: z.object({
    channels: z.array(z.enum(["email", "slack", "pagerduty"])),
    responseTime: z.string(),  // 例: "P95>500msでアラート"
  }).optional(),
});

// 非機能要件統合
export const structuredNonFunctionalSchema = z.object({
  performance: performanceSchema.optional(),
  availability: availabilitySchema.optional(),
  security: securitySchema.optional(),
  observability: observabilitySchema.optional(),
});

// 非機能観点の更新
export const nonFunctionalDesignContentSchema = z.object({
  structured: structuredNonFunctionalSchema.optional(),  // 新規
  performance: z.string().optional(),    // @deprecated
  availability: z.string().optional(),   // @deprecated
  monitoring: z.string().optional(),     // @deprecated
  security: z.string().optional(),       // @deprecated
  scalability: z.string().optional(),    // @deprecated
});
```

#### control_plane.md対応表（5.1節「曖昧な表現の具体化」）

| 曖昧な表現 | 具体化した記述 | スキーマ |
|-----------|--------------|---------|
| 「高速に処理される」 | `P95で500ms以内（データ件数1万件以下）` | `performance.responseTime.p95` |
| 「高可用性」 | `月間可用率99.9%（月間ダウンタイム43分以内）` | `availability.uptime` |
| 「適切なログが出力される」 | `structured_json形式で、trace_id・user_id・処理時間(ms)を含む` | `observability.logging` |
| 「セキュア」 | `SQLインジェクション対策：プレースホルダ必須` | `security` |

#### 確認項目
- [ ] 数値基準で測定可能な非機能要件が定義できる
- [ ] control_plane.md 5.1節の具体化例が網羅されている
- [ ] 曖昧な表現（「高速」等）を避けて具体値で定義できる

---

### 1.4 成果物スキーマ更新
**ファイル**: `lib/domain/schemas/deliverable.ts`

#### 実装項目
- [ ] `functionDesignContentSchema` の新規フィールド追加
- [ ] `structuredInput` フィールド（オプション）
- [ ] `structuredOutput` フィールド（オプション）
- [ ] 既存 `input`, `output` の非推奨化（@deprecated）
- [ ] `validateDeliverable` 関数の更新（新スキーマ対応）

#### 実装例（更新後のfunctionDesignContentSchema）
```typescript
// 更新後のfunctionDesignContentSchema
export const functionDesignContentSchema = z.object({
  // 新しい構造化フィールド（オプション）
  structuredInput: z.union([apiInputSchema, screenInputSchema, batchInputSchema, jobInputSchema]).optional(),
  structuredOutput: z.union([apiOutputSchema, screenOutputSchema, batchOutputSchema, jobOutputSchema]).optional(),
  ioType: z.enum(["api", "screen", "batch", "job"]).optional(),
  
  // 副作用（control_plane.md「状態変化」対応）
  structuredSideEffects: sideEffectSchema.optional(),  // 新規追加
  
  // 既存フィールド（互換性のため必須は緩和）
  input: z.string().optional(),  // @deprecated: structuredInputを使用
  process: z.string().min(1, "処理は必須"),
  output: z.string().optional(), // @deprecated: structuredOutputを使用
  sideEffects: z.string().optional(), // @deprecated: structuredSideEffectsを使用
});

// バリデーション関数の更新
export function validateDeliverable(design: Deliverable): string[] {
  const errors: string[] = [];
  
  if (!design.name.trim()) {
    errors.push("成果物名は必須です");
  }
  
  const func = design.design.function;
  if (func) {
    // 新しい構造化データがある場合
    if (func.structuredInput && func.structuredOutput) {
      // 構造化データのバリデーション
      const result = functionDesignContentSchema.safeParse(func);
      if (!result.success) {
        errors.push(...result.error.errors.map(e => e.message));
      }
    } 
    // 旧テキストデータのみの場合
    else if (!func.input || !func.output) {
      errors.push("入出力定義が必要です（structuredInput/structuredOutputまたはinput/output）");
    }
  }
  
  return errors;
}
```

#### 確認項目
- [ ] 既存データが後方互換で動作する
- [ ] 新しい構造化データのバリデーションが正しく動作する
- [ ] 新旧いずれかの入出力定義があればバリデーション通過する

---

## 2. 型定義・データ層更新フェーズ

### 2.1 TypeScript型定義
**ファイル**: `lib/domain/types.ts`（または新規ファイル）

#### 実装項目
- [ ] `Field` 型の定義
- [ ] `FieldConstraints` 型の定義
- [ ] `ApiInput`, `ApiOutput` 型の定義
- [ ] `ScreenInput`, `ScreenOutput` 型の定義
- [ ] `BatchInput`, `BatchOutput` 型の定義
- [ ] `JobInput`, `JobOutput` 型の定義
- [ ] `StructuredFunctionDesign` 型の定義

#### 確認項目
- [ ] 全ての型がZodスキーマと一致している
- [ ] 型推論が正しく動作する

---

### 2.2 データ層（Supabase型）
**ファイル**: `lib/data/system-functions.ts` 関連

#### 実装項目
- [ ] DBスキーマ変更用マイグレーション作成
- [ ] `structured_input` JSONBカラム追加（system_functionsまたはdesign_documents）
- [ ] `structured_output` JSONBカラム追加
- [ ] `io_type` カラム追加（api/screen/batch/jobを識別）
- [ ] データ変換関数の追加（JSONB ↔ TypeScript型）

#### 確認項目
- [ ] マイグレーションが正常に適用される
- [ ] 既存データの移行戦略が確立されている

---

## 3. UI/フォーム更新フェーズ

### 3.1 フィールド編集コンポーネント
**ファイル**: `components/forms/FieldEditor.tsx`（新規作成）

#### 実装項目
- [ ] フィールド追加・削除・編集UI
- [ ] 型選択（string/number/boolean/enum/object/array）
- [ ] 必須/任意のトグル
- [ ] 制約条件入力（min, max, pattern, enum値）
- [ ] デフォルト値入力

#### 確認項目
- [ ] フィールドの追加・削除が直感的に行える
- [ ] バリデーションエラーが適切に表示される

---

### 3.2 API専用入出力フォーム
**ファイル**: `components/forms/ApiIoForm.tsx`（新規作成）

#### 実装項目
- [ ] HTTPメソッド選択（GET/POST/PUT/DELETE/PATCH）
- [ ] パス入力フィールド
- [ ] Queryパラメータ編集（FieldEditor利用）
- [ ] Bodyパラメータ編集（FieldEditor利用）
- [ ] 成功レスポンス編集（status + fields）
- [ ] エラーレスポンス編集（status + fields）

#### 確認項目
- [ ] API特有の入力が分かりやすく入力できる
- [ ] 成功/エラーの両パターンが定義できる

---

### 3.3 画面専用入出力フォーム
**ファイル**: `components/forms/ScreenIoForm.tsx`（新規作成）

#### 実装項目
- [ ] トリガー選択（click/input/load/select）
- [ ] 画面要素（elements）編集
- [ ] 遷移先定義
- [ ] メッセージ定義

#### 確認項目
- [ ] 画面固有の概念（ボタンクリック、遷移）が分かりやすい

---

### 3.4 バッチ専用入出力フォーム
**ファイル**: `components/forms/BatchIoForm.tsx`（新規作成）

#### 実装項目
- [ ] スケジュール定義
- [ ] 入力ソース定義
- [ ] パラメータ編集
- [ ] 出力先定義

#### 確認項目
- [ ] バッチ特有の概念（スケジュール、入出力ファイル）が入力できる

---

### 3.5 ジョブ専用入出力フォーム
**ファイル**: `components/forms/JobIoForm.tsx`（新規作成）

#### 実装項目
- [ ] イベントトリガー定義
- [ ] ペイロード編集
- [ ] 処理結果定義
- [ ] 次のイベント定義

#### 確認項目
- [ ] ジョブ固有の概念（イベント連鎖）が定義できる

---

### 3.6 統合入出力セクション
**ファイル**: `components/forms/StructuredIoSection.tsx`（新規作成）

#### 実装項目
- [ ] 対象タイプ選択（api/screen/batch/job）
- [ ] タイプに応じたフォーム切り替え
- [ ] 入力スキーマと出力スキーマのタブ切り替え
- [ ] 既存テキストinput/outputからの移行UI

#### 確認項目
- [ ] 対象タイプを変更してもデータが保持される
- [ ] 新旧の入出力定義が並行して表示・編集できる

---

### 3.7 成果物編集フォーム統合
**ファイル**: `components/deliverables/DeliverableForm.tsx`（既存修正）

#### 実装項目
- [ ] 既存input/outputフィールドの非表示化（または折りたたみ）
- [ ] StructuredIoSectionの統合
- [ ] 保存時のデータ変換処理
- [ ] 既存データの自動移行表示

#### 確認項目
- [ ] 既存データが正しく表示される
- [ ] 新しい構造化データが正しく保存される

---

## 4. データ移行・互換性フェーズ

### 4.1 移行スクリプト作成
**ファイル**: `scripts/migrate-io-schemas.ts`（新規作成）

#### 実装項目
- [ ] 既存テキストinput/outputの解析処理
- [ ] 正規表現/パターンマッチによる構造化データ抽出
- [ ] 移行できないデータの検出とログ出力
- [ ] 手動確認が必要なデータリスト生成
- [ ] 移行実行・ロールバック機能

#### 確認項目
- [ ] テストデータで移行が正しく動作する
- [ ] エッジケース（空文字、特殊文字）が適切に処理される

---

### 4.2 後方互換レイヤー
**ファイル**: `lib/utils/io-schema-compat.ts`（新規作成）

#### 実装項目
- [ ] `toStructuredInput` 関数（テキスト→構造化変換）
- [ ] `toStructuredOutput` 関数（テキスト→構造化変換）
- [ ] `fromStructuredInput` 関数（構造化→テキスト変換、表示用）
- [ ] `hasStructuredData` 関数（構造化データの存在チェック）

#### 確認項目
- [ ] 既存データが互換性を持って動作する
- [ ] 新しい構造化データが優先的に使用される

---

## 5. 検証・テストフェーズ

### 5.1 スキーマ単体テスト
**ファイル**: `tests/unit/schemas/io-schemas.test.ts`（新規作成）

#### 実装項目
- [ ] fieldSchemaのバリデーションテスト
- [ ] 各タイプ別スキーマのテスト
- [ ] constraintsの境界値テスト
- [ ] discriminated unionの型推論テスト

#### 確認項目
- [ ] 全テストがパスする
- [ ] エッジケースが網羅されている

---

### 5.2 フォーム統合テスト
**ファイル**: `tests/integration/io-form.test.ts`（新規作成）

#### 実装項目
- [ ] FieldEditorのインタラクションテスト
- [ ] タイプ切り替え時のデータ保持テスト
- [ ] 保存・読み込みの一貫性テスト

#### 確認項目
- [ ] ユーザー操作シナリオが網羅されている
- [ ] エラー状態が適切にハンドリングされる

---

### 5.3 データ移行テスト
**ファイル**: `tests/integration/migration.test.ts`（新規作成）

#### 実装項目
- [ ] サンプル既存データでの移行テスト
- [ ] 移行不能データの検出テスト
- [ ] ロールバック機能のテスト

#### 確認項目
- [ ] 実データに近いサンプルでテストされている
- [ ] 移行結果の検証基準が明確

---

## 6. ドキュメント・運用フェーズ

### 6.1 開発者ドキュメント
**ファイル**: `docs/io-schema-guide.md`（新規作成）

#### 実装項目
- [ ] 新しいスキーマ構造の説明
- [ ] 各タイプ（api/screen/batch/job）の定義ガイド
- [ ] 移行手順の説明
- [ ] 既存データとの互換性について

#### 確認項目
- [ ] チームメンバーが理解できる内容になっている
- [ ] control_plane.mdとの対応関係が明記されている

---

### 6.2 ユーザーガイド
**ファイル**: `docs/user-guide/io-schema-input.md`（新規作成）

#### 実装項目
- [ ] UI操作手順の説明
- [ ] 各対象タイプの入力例
- [ ] よくある質問・トラブルシューティング

#### 確認項目
- [ ] エンドユーザーが理解できる内容になっている
- [ ] スクリーンショットや図が含まれている（必要に応じて）

---

## 7. ロールアウトフェーズ

### 7.1 ステージング環境検証

#### 実装項目
- [ ] ステージングDBへのマイグレーション適用
- [ ] テストデータでの機能検証
- [ ] 既存機能の回帰テスト

#### 確認項目
- [ ] 既存の業務フローが壊れていない
- [ ] パフォーマンスに問題がない

---

### 7.2 本番環境移行

#### 実装項目
- [ ] メンテナンスウィンドウの設定
- [ ] 本番DBへのマイグレーション適用
- [ ] 移行スクリプトの実行
- [ ] 監視・アラート設定の確認

#### 確認項目
- [ ] ロールバック手順が準備されている
- [ ] インシデント対応フローが明確

---

## 完了基準

- [ ] 全スキーマ定義が完了し、型安全に動作する
  - [ ] データスキーマ（fieldSchema）
  - [ ] 許容範囲・制約（constraints: min/max/pattern/enum/format/unique）
  - [ ] 出力外形（input/outputスキーマ：API/画面/バッチ/ジョブ別）
  - [ ] 副作用・状態変化（sideEffectSchema：DB/API/イベント/ファイル/ログ）
- [ ] UI/フォームが新しい構造に対応している
- [ ] 既存データの移行戦略が確立・検証されている
- [ ] 全テストがパスしている
- [ ] ドキュメントが整備されている
- [ ] ステージング環境で検証済み
- [ ] control_plane.md「方針A」の要求を満たしている（データスキーマ・許容範囲・出力外形・状態変化・例外・非機能要件が構造化して定義可能）
