# DD構造化スキーマ 3セクション統合計画

## Context

現在DDの構造化仕様（非modelタイプ）は、入出力関連が5セクションに分散している：

1. 入力スキーマ（`inputSchema`）— 振る舞い的な契約 + 型別の埋め込みField[]
2. コアロジック（`coreLogic`）
3. 出力スキーマ（`outputSchema`）— 振る舞い的な契約 + 型別の埋め込みField[]
4. 入力項目（`inputFields`）— フラットなField[]
5. 出力項目（`outputFields`）— フラットなField[]

**問題**: フィールド定義が2箇所に分散し、どこに書くべきか迷う。情報フローも直感的でない。

**目標**: 3セクション構成に統合する。

```
入力スキーマ（入力項目含む）→ コアロジック → 出力スキーマ（出力項目含む）
```

**対象タイプ**: api / screen / batch / job の4タイプのみ。model / external_if / report は現状維持。

```
難易度: ★★☆
根拠: 6 files, ~300 lines, 4 components (schema + viewer + editor + compat)
リスク: 既存DDデータの後方互換性。parseStructuredDetailsでの自動マイグレーションで対応
```

---

## 実装手順

### Step 1: I/Oスキーマに `dataFields` プロパティ追加

**ファイル**: `lib/domain/schemas/io-schemas.ts`

各入力スキーマ・出力スキーマに `dataFields: Field[]`（デフォルト `[]`）を追加する。
旧 `inputFields`/`outputFields` のデータはここに吸収される。

```typescript
// 各 input schema に追加
dataFields: fieldArraySchema.default([]).describe("入力データ項目（汎用）")

// 各 output schema に追加
dataFields: fieldArraySchema.default([]).describe("出力データ項目（汎用）")
```

追加対象:
- `apiInputSchema` / `apiOutputSchema`
- `screenInputSchema` / `screenOutputSchema`
- `batchInputSchema` / `batchOutputSchema`
- `jobInputSchema` / `jobOutputSchema`

### Step 2: トップレベルの `inputFields`/`outputFields` を廃止

**ファイル**: `lib/domain/schemas/design-document-structured.ts`

1. `inputFields` と `outputFields` をスキーマから削除
2. `createEmptyStructuredDesignDocumentSpec()` から `inputFields`/`outputFields` の初期化を削除
3. 各I/Oスキーマのデフォルト値に `dataFields: []` が含まれるので、初期化側の対応は不要

### Step 3: 後方互換マイグレーション

**ファイル**: `lib/utils/design-documents/structured-compat.ts`

`parseStructuredDetails()` にマイグレーションロジックを追加：

```typescript
// DB読み込み時に旧データを自動変換
if (raw.inputFields?.length > 0 && parsed.inputSchema) {
  parsed.inputSchema.dataFields = [
    ...(parsed.inputSchema.dataFields || []),
    ...raw.inputFields
  ];
}
if (raw.outputFields?.length > 0 && parsed.outputSchema) {
  parsed.outputSchema.dataFields = [
    ...(parsed.outputSchema.dataFields || []),
    ...raw.outputFields
  ];
}
// 旧プロパティを除去
delete parsed.inputFields;
delete parsed.outputFields;
```

これにより **DBマイグレーション不要**。保存時に新形式で書き戻される。

### Step 4: Viewer統合（表示側）

#### 4a. メインビューア

**ファイル**: `components/system-domains/structured-spec-viewer/index.tsx`

- 「入力項目（データ）」セクション（`input-fields`）を削除
- 「出力項目（データ）」セクション（`output-fields`）を削除
- 9セクション → 7セクションに

#### 4b. InputSchemaViewer

**ファイル**: `components/system-domains/structured-spec-viewer/InputSchemaViewer.tsx`

各タイプの表示末尾に `dataFields` の `FieldsViewer` を追加：

```tsx
{/* 既存の型別表示の後 */}
{inputSchema.dataFields && inputSchema.dataFields.length > 0 && (
  <LabeledValue label="入力データ項目">
    <FieldsViewer fields={inputSchema.dataFields} />
  </LabeledValue>
)}
```

#### 4c. OutputSchemaViewer

**ファイル**: `components/system-domains/structured-spec-viewer/OutputSchemaViewer.tsx`

同様に各タイプの表示末尾に `dataFields` の `FieldsViewer` を追加。

### Step 5: Editor統合（編集側）

**ファイル**: `components/forms/design-document/DesignDocumentCard.tsx`

`StructuredSpecEditor` 内の変更：

1. **セクション5「入力項目（データ）」を削除**
   - API用の `ApiInputFieldsSection`（query + body FieldEditor）はセクション2「入力スキーマ」に移動
   - 他タイプ用の汎用 FieldEditor もセクション2「入力スキーマ」末尾に移動
   - 移動先では `dataFields` を編集するように変更

2. **セクション6「出力項目（データ）」を削除**
   - API用の `ApiOutputFieldsSection`（success.fields + error.fields FieldEditor）はセクション4「出力スキーマ」に移動
   - 他タイプ用の汎用 FieldEditor もセクション4「出力スキーマ」末尾に移動
   - 移動先では `dataFields` を編集するように変更

3. **`updateStructuredSpec` のパス変更**
   - `spec.inputFields` → `spec.inputSchema.dataFields`
   - `spec.outputFields` → `spec.outputSchema.dataFields`

### Step 6: 型定義の整合性確認

**ファイル**:
- `lib/domain/schemas/io-schemas.ts` の型エクスポート確認
- TypeScript型が正しく推論されることを確認

---

## 変更対象ファイル一覧

| # | ファイル | 変更内容 |
|---|---------|---------|
| 1 | `lib/domain/schemas/io-schemas.ts` | 全I/Oスキーマに `dataFields` 追加 |
| 2 | `lib/domain/schemas/design-document-structured.ts` | `inputFields`/`outputFields` 削除、`createEmpty...` 更新 |
| 3 | `lib/utils/design-documents/structured-compat.ts` | `parseStructuredDetails` にマイグレーション追加 |
| 4 | `components/system-domains/structured-spec-viewer/index.tsx` | 入力項目・出力項目セクション削除 |
| 5 | `components/system-domains/structured-spec-viewer/InputSchemaViewer.tsx` | `dataFields` 表示追加 |
| 6 | `components/system-domains/structured-spec-viewer/OutputSchemaViewer.tsx` | `dataFields` 表示追加 |
| 7 | `components/forms/design-document/DesignDocumentCard.tsx` | フィールド編集UIをスキーマセクションに統合 |

## 変更しないファイル

- `lib/domain/schemas/fields.ts` — Field型はそのまま
- `lib/domain/schemas/core-logic.ts` — コアロジックは変更なし
- `lib/domain/schemas/side-effects.ts` — 副作用は変更なし
- `lib/domain/schemas/exceptions.ts` — 例外は変更なし
- `lib/domain/schemas/non-functional.ts` — 非機能は変更なし
- `lib/mastra/tools/dd-draft.ts` — AI草案は構造化スキーマ未生成のため影響なし
- DB（Supabase）— マイグレーション不要（JSONB内の自動変換で対応）

---

## 検証方法

1. **既存データの後方互換**: `inputFields`/`outputFields` にデータがある既存DDを開き、入力スキーマ・出力スキーマセクション内に正しく表示されることを確認
2. **新規DD作成**: 新規DDを作成し、入力スキーマセクション内でフィールドの追加・編集・削除ができることを確認
3. **保存と再読み込み**: 編集→保存→再読み込みで、データが `inputSchema.dataFields`/`outputSchema.dataFields` に正しく永続化されることを確認
4. **4タイプ動作確認**: api / screen / batch / job の各タイプで3セクション表示が正しいことを確認
5. **非対象タイプ**: model / external_if / report が従来通り動作することを確認
6. **E2Eテスト**: agent-browserで `/system/AR/SF-AR-0001` のDD詳細を開き、3セクション構成を画面上で確認
