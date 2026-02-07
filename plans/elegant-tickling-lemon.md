# 設計ドキュメント項目の整理・簡略化

## Context

### 背景
現在、`http://localhost:3000/system/AR/SF-AR-0001/edit/design-documents` 画面で、画面・IF・バッチなどの成果物単位の設計を構造的に定義している。しかし、以下の問題がある：

1. **入力者（ユーザー）のUX観点**：項目が煩雑で、何を入力すべきか不明確。専門的すぎる項目が多く、入力を諦める原因になっている
2. **設計引き渡し先（ClaudeCode）の観点**：実装に不要な詳細項目が含まれており、本質的な設計情報が埋もれている

### 目的
過剰な項目を削除/簡略化し、必要最小限の項目に絞ることで：
- ユーザーの入力負担を軽減
- ClaudeCodeへの設計引き渡しを明確化
- 設計ドキュメントの可読性向上

### 前提知識（control_plane.mdより）
設計ドキュメント（DD）の役割は「契約（SR）をコードに接続すること」であり、以下が責務：
- エントリポイント（変更の入口となるファイル）の特定
- 変更境界（トランザクション・認可・冪等性）の明示
- Allow Paths（変更可能なファイルのスコープ）の定義

一方、Acceptance Criteria（GWT形式）は **SRレベル**で管理されており、DDレベルでは重複するため不要。

---

## 整理方針

### ユーザーの回答を踏まえた方針
1. **非機能要件**：3項目に絞る（responseTimeP95, uptime, authMethod）
2. **constraints詳細**：簡略化する（format3種類、unique/errorMessage削除）
3. **Acceptance Criteria**：SRレベルで管理されるため、DDレベルでは追加しない
4. **Allow Paths**：現時点では不要（ユーザー判断）
5. **impl_unit_id/sf_id**：後で検討（現時点では追加しない）

### 削除/簡略化対象の項目

#### 1. 非機能要件（nonFunctional）の簡略化

**現状（non-functional.ts）**：
```typescript
{
  performance: { responseTime, throughput, concurrency },
  availability: { uptime, rto, rpo },
  security: { auth, encryption, compliance },
  observability: { logging, metrics, tracing, alerting }
}
```

**問題点**：
- `metrics.scrapeInterval`, `tracing.samplingRate`, `encryption.atRest` などインフラ設定レベルの項目が含まれる
- 実装初期段階では専門的すぎて入力が困難
- ClaudeCodeの実装には不要（インフラで解決すべき内容）

**改善後**：
```typescript
{
  responseTimeP95?: string,  // "200ms" 形式
  uptime?: string,           // "99.9%" 形式
  authMethod?: "oauth2" | "oidc" | "api_key" | "mfa"
}
```

すべてオプション項目とし、必要に応じて入力する形式に変更。

---

#### 2. フィールド制約（constraints）の簡略化

**現状（fields.ts）**：
```typescript
{
  min?: number,
  max?: number,
  pattern?: string,
  format?: "email" | "uuid" | "url" | "uri" | "date" | "datetime" | "time" | "ipv4" | "ipv6" | "hostname",
  enum?: string[],
  default?: unknown,
  unique?: boolean,
  errorMessage?: string
}
```

**問題点**：
- `format` が10種類あり、選択肢が多すぎる
- `unique` はDB設計の範疇（DDレベルでは過剰）
- `errorMessage` は各フィールドで記述するのが現実的でない（フロント側で自動生成すべき）

**改善後**：
```typescript
{
  min?: number,
  max?: number,
  pattern?: string,
  format?: "email" | "date" | "uuid",  // 3種類に絞る
  enum?: string[],
  default?: unknown
}
```

削除項目：`unique`, `errorMessage`
簡略化項目：`format` を頻出3種類（email/date/uuid）のみに制限

---

#### 3. 副作用（sideEffects）の簡略化

**現状（side-effects.ts）**：
```typescript
fileOutputs: {
  path: string,
  format: "csv" | "json" | "xml" | "pdf" | "txt",
  encoding: "utf-8" | "shift-jis" | "euc-jp",
  append: boolean
}
```

**問題点**：
- `encoding`, `append` はファイル出力の細かい制御
- バッチ処理以外ではほぼ使わない
- 実装時にコードで調整可能な範囲

**改善後**：
```typescript
fileOutputs: {
  path: string,
  format: "csv" | "json" | "xml" | "pdf" | "txt"
}
```

削除項目：`encoding`, `append`

---

#### 4. typeDetailの一部削除

**現状（design-document-structured.ts）**：
```typescript
// model型
{ ioType: "model", entity?: string, table?: string }

// report型
{ ioType: "report", format?: "pdf" | "csv" | "xlsx" | "json", outputPath?: string }
```

**問題点**：
- `model` 型の `entity`, `table` は `entryPoints` に `models/invoice.ts` を記載すれば十分
- `report` 型の `format`, `outputPath` は `outputSchema` の fields に含めれば重複

**改善後**：
- `model` 型：`entity`, `table` を削除、`entryPoints` で代替
- `report` 型：`format`, `outputPath` を削除、`outputSchema` で代替

---

## 変更対象ファイル

### スキーマ定義
1. **lib/domain/schemas/non-functional.ts**
   - `structuredNonFunctionalSchema` を簡略化
   - performance/availability/security/observability を削除
   - responseTimeP95/uptime/authMethod の3項目に変更

2. **lib/domain/schemas/fields.ts**
   - `constraintsSchema` を簡略化
   - `format` を3種類に制限
   - `unique`, `errorMessage` を削除

3. **lib/domain/schemas/side-effects.ts**
   - `fileOutputSchema` を簡略化
   - `encoding`, `append` を削除

4. **lib/domain/schemas/design-document-structured.ts**
   - `typeDetailSchema` を簡略化
   - model型の `entity`, `table` を削除
   - report型の `format`, `outputPath` を削除

### フォーム・表示コンポーネント
5. **components/forms/design-document/DesignDocumentCard.tsx**
   - 非機能要件の入力欄を3項目に変更
   - constraints入力欄を簡略化
   - fileOutputs入力欄を簡略化
   - typeDetail入力欄を調整

6. **components/system-domains/design-document-section.tsx**
   - 表示ラベルマップ（DD_DETAILS_KEY_LABELS）を更新
   - 削除された項目のラベルを削除

### ユーティリティ
7. **lib/utils/design-documents/structured-compat.ts**
   - 互換性処理を更新（削除された項目を無視）

### テスト
8. **tests/unit/schemas/design-document-structured.test.ts**
   - 削除された項目のテストを削除
   - 簡略化された項目のテストを更新

---

## 実装手順

### Step 1: スキーマ定義の更新
1. `non-functional.ts` を簡略化（3項目のみ）
2. `fields.ts` の constraints を簡略化（format3種類、unique/errorMessage削除）
3. `side-effects.ts` の fileOutputs を簡略化（encoding/append削除）
4. `design-document-structured.ts` の typeDetail を簡略化（model/report型の詳細削除）

### Step 2: フォームコンポーネントの更新
1. `DesignDocumentCard.tsx` の非機能要件入力欄を3項目に変更
2. constraints入力欄を更新（format選択肢を3種類に、unique/errorMessage入力欄を削除）
3. fileOutputs入力欄を更新（encoding/append入力欄を削除）
4. typeDetail入力欄を更新（model/report型の詳細入力欄を削除）

### Step 3: 表示コンポーネントの更新
1. `design-document-section.tsx` のラベルマップを更新
2. 削除された項目が表示されないことを確認

### Step 4: 互換性処理の更新
1. `structured-compat.ts` で削除された項目を無視
2. 既存データの読み込み時にエラーが出ないことを確認

### Step 5: テストの更新
1. `design-document-structured.test.ts` を更新
2. 削除された項目のテストを削除
3. 簡略化された項目のテストケースを更新

### Step 6: 動作確認
1. TypeScriptコンパイルエラーがないことを確認
2. 既存の設計ドキュメントが正しく表示されることを確認
3. 新規作成時に簡略化された項目のみが表示されることを確認
4. E2Eテストで画面操作を確認

---

## 検証方法

### 単体テスト
```bash
bun test tests/unit/schemas/design-document-structured.test.ts
```

### TypeScriptコンパイル
```bash
bunx tsc --noEmit
```

### E2E動作確認
1. 開発サーバー起動：`bun dev`
2. `http://localhost:3000/system/AR/SF-AR-0001/edit/design-documents` にアクセス
3. 既存の設計ドキュメントが正しく表示されることを確認
4. 新規作成時に簡略化された入力欄が表示されることを確認
5. 保存後、データが正しく保存されることを確認

---

## 備考

### 削除項目の一覧
- **非機能要件**：performance/availability/security/observability の詳細項目すべて
- **constraints**：unique, errorMessage, format の7種類（email/date/uuid以外）
- **fileOutputs**：encoding, append
- **typeDetail**：model型のentity/table、report型のformat/outputPath

### 残す項目の一覧
- **基本情報**：name, type, summary, entryPoints, designPolicy（変更なし）
- **構造化仕様**：version, ioType, inputSchema, outputSchema, inputFields, outputFields, sideEffects, exceptions, nonFunctional（簡略化版）
- **非機能要件**：responseTimeP95, uptime, authMethod（3項目のみ）
- **constraints**：min, max, pattern, format（3種類）, enum, default
- **fileOutputs**：path, format
- **typeDetail**：API/Screen/Batch/Job/ExternalIf型の基本項目（method/path, route/trigger等）のみ

### 将来の拡張
- impl_unit_id/sf_id の追加は後で検討
- 非機能要件の詳細項目は、必要になったら段階的に追加
- constraints の format は、必要に応じて種類を増やす

---

## リスク

### 既存データへの影響
- 既存の設計ドキュメントに削除対象の項目が含まれている場合、表示時に無視される
- データベースには残るため、後で復元可能
- 互換性処理（structured-compat.ts）で安全に処理

### 機能制限
- 詳細な非機能要件を記述できなくなる → 必要になったら項目を追加
- 詳細な制約を記述できなくなる → コード実装時に調整

### 軽減策
- スキーマ変更時は後方互換性を維持（optional項目として扱う）
- 既存データの読み込み時にエラーが出ないようにする
- 必要に応じて項目を段階的に追加できる設計にする
