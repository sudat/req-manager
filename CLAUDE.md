# Project rules

## 設計書参照・更新ルール

- 変更を入れる前に、要件の該当箇所を確認してから設計・実装する。
- 仕様参照の優先順位:
  1. **docs/user-stories.md** - ユーザー体験の北極星（UI/UXレビュー基準）
  2. docs/overview/PRD_overview.md - 開発概要
  3. docs/PRD.md - 詳細仕様
- 不明点がある場合は本家PRDを参照: docs/PRD.md

### @docs/user-stories.md
ユーザーストーリー（北極星）
- **UI/UX改修時は必ず参照**: 各ジャーニー（J1〜J8）のストーリーとUXチェック基準を確認する
- **開発方向性の確認**: 実装済み仕様とストーリーの差分を特定し、優先度を判断する
- **横断的UX原則（P1〜P5）**: すべての画面で守るべき原則を確認する

### @docs/PRD.md

- 直近の作業計画はチェックリストを参照する。作業後は更新する。
- 直近のチェックリスト: docs/checklists/active/*.md

### @docs/design/database-schema-design.md
テーブル定義書
- スキーマを定義する。
- テーブル定義を追加・更新・削除する都度、設計書も更新する。

### @docs/design/er-diagram-feature-plan.md
スキーマ定義書
- BT/BR/SF/SR/DDで複数の業務、複数のシステム機能を横断するスキーマを定義する。
- スキーマとはER図、シーケンス図、業務フロー図などを想定する。

## データ更新ルール

- ユーザーがSupabaseのデータ更新を依頼した場合はsupabase mcp（特にexecute_sql）を使ってデータを更新する。
- supabase mcpが見つからない場合には処理を停止し、ユーザーに対処を相談する。
- ほかの方法でデータの更新を試そうとしないこと。

## テストルール

- E2Eテストはagent-browserを利用すること。

## DD構造化データスキーマ

DD（Design Document）の `details` カラムに保存する構造化データは、以下のスキーマ定義に従う：

### スキーマ定義ファイル

| ファイル | 内容 |
|----------|------|
| `lib/domain/schemas/design-document-structured.ts` | 統合スキーマ（StructuredDesignDocumentSpec） |
| `lib/domain/schemas/io-schemas.ts` | API/画面/バッチ/ジョブの入出力スキーマ |
| `lib/domain/schemas/side-effects.ts` | 保存/通知定義スキーマ（sideEffects） |
| `lib/domain/schemas/fields.ts` | フィールド定義スキーマ（dataFields等） |
| `lib/domain/schemas/core-logic.ts` | コアロジックスキーマ（coreLogic.rules: validate/read/derive/decide） |
| `lib/domain/schemas/exceptions.ts` | 例外定義スキーマ（exceptions） |
| `lib/domain/schemas/non-functional.ts` | 非機能要件スキーマ（nonFunctional） |
| `lib/domain/schemas/model-detail.ts` | モデルタイプ詳細スキーマ（typeDetail） |

### 主要バリデーションルール

#### sideEffects（保存/通知）必須
```typescript
{
  description: string;  // 必須：保存/通知の説明（例："請求書データの作成、PDF生成"）
  dbOperations?: Array<{
    table: string;
    operation: "insert" | "update" | "delete" | "upsert";
    condition?: string;
    affectedColumns?: string[];
  }>;
  externalApiCalls?: Array<{
    endpoint: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    payload?: Field[];
    retryPolicy?: { maxRetries: number; backoffMs: number };
  }>;
  events?: Array<{
    eventType: string;
    payload: Field[];
    destination: "queue" | "topic" | "webhook";
    delayMs?: number;
  }>;
  fileOutputs?: Array<{
    path: string;
    format: "csv" | "json" | "xml" | "pdf" | "txt";
  }>;
}
```

#### inputSchema（ioTypeによる分岐）

**screenタイプ：**
```typescript
{
  trigger: "click" | "input" | "load" | "select";  // 必須
  action?: string;           // 操作内容（例："請求書を発行"）
  targetElement?: string;    // 操作対象UI要素（例："発行ボタン"）
  precondition?: string;     // 前提条件（例："請求対象が1件以上選択されている"）
  elements?: Field[];        // 画面上の入力要素
  dataFields?: Field[];      // 入力データ項目
}
```

**apiタイプ：**
```typescript
{
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";  // 必須
  path: string;              // 必須：エンドポイントパス
  query?: Field[];           // クエリパラメータ
  body?: Field[];            // リクエストボディ
  dataFields?: Field[];      // 入力データ項目
}
```

**batchタイプ：**
```typescript
{
  schedule: string;          // 必須：cron形式（例："0 2 1 * *"）
  source: string;            // 必須：データソース（例："/data/input.csv"）
  parameters?: Field[];      // バッチパラメータ
  dataFields?: Field[];      // 入力データ項目
}
```

**jobタイプ：**
```typescript
{
  event: string;             // 必須：イベントタイプ名
  payload?: Field[];         // イベントペイロード
  dataFields?: Field[];      // 入力データ項目
}
```

**model/external_if/reportタイプ：**
- inputSchemaは不要（undefined可）

### coreLogic vs sideEffects の区別

| 観点 | coreLogic（コアロジック） | sideEffects（保存/通知） |
|------|-------------------------|------------------------|
| **性質** | 純粋なインメモリ業務ロジック | 外部状態変更の宣言 |
| **対象** | 検証・抽出・算出・判定 | DB操作/API呼出し/イベント/ファイル出力 |
| **UIラベル** | - | 「副作用」→「保存/通知」に変更済 |

**設計指針:**
- coreLogicは**外部状態を変更しない**純粋なビジネスルールを記述
- sideEffectsは**当該DDが直接実行する**外部状態変更のみ記載
- `persist` タイプは廃止（重複を避けるため）。状態遷移の判断は `decide` で表現し、実際のDB更新は `sideEffects.dbOperations` で定義

**例:**
```typescript
// coreLogic.rules - 純粋なロジック
{ type: "decide", name: "status_transition", description: "ステータスをissuedに変更すべきか判定" }

// sideEffects.dbOperations - 実際の状態変更
{ table: "invoices", operation: "update", affectedColumns: ["status", "issued_at"] }
```

### データ登録時の注意点

1. **sideEffects.description は必須** - 保存/通知がない場合は `"副作用なし"` を明示
2. **ioTypeに応じたinputSchema構造** - screen/api/batch/jobは専用の構造が必要
3. **必須フィールドの確認** - batchは `schedule` と `source` が必須
4. **バリデーションエラー防止** - 登録前にスキーマファイルで定義を確認すること