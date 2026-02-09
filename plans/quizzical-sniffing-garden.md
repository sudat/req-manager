# DDフォーム改善計画: API型の入出力構造化 + 認可境界

## Context

DD（Design Document）の構造化設計フォーム（`DesignDocumentCard` > `StructuredSpecEditor`）を分析した結果、以下の問題が判明した。

**問題**: `io-schemas.ts` にはAPI用の構造化スキーマ（`query`/`body`の区別、`success`/`error`レスポンス構造）が既に定義されているが、UIフォームではそれらを使わず、全ioType共通の `inputFields`/`outputFields`（フラットなFieldEditorリスト）のみを表示している。結果として：
- APIのパスパラメータ/クエリパラメータ/リクエストボディの区別がつかない
- 成功レスポンスとエラーレスポンスの区別ができない
- 非機能要件で認可境界が記述できない

**方針**: 新しいスキーマは作らない。**既存の`ApiInput`/`ApiOutput`型をUIに反映するだけ**で改善する（KISSの原則）。

```
難易度: ★★☆
根拠: 2 files, 約170 lines, 影響コンポーネント2
リスク: 既存データとの互換性（inputFieldsにデータが入っている既存DDがある場合）
```

---

## 変更対象ファイル

| ファイル | 変更内容 | 変更量 |
|---|---|---|
| `lib/domain/schemas/non-functional.ts` | `authorizationBoundary` フィールド追加 | +5行 |
| `components/forms/design-document/DesignDocumentCard.tsx` | `ApiInputSection` / `ApiOutputSection` 追加、条件分岐、認可境界UI | +約160行 |

---

## Step 1: 非機能要件スキーマに認可境界フィールド追加

**ファイル**: `lib/domain/schemas/non-functional.ts`

`authMethod` の後に追加:
```typescript
authorizationBoundary: z
  .string()
  .optional()
  .describe("認可境界。必要な権限やロール（例: 'billing:invoice:issue権限が必要'）"),
```

- `.optional()` なので既存データに影響なし（後方互換）

---

## Step 2: API型の入力セクション改善

**ファイル**: `components/forms/design-document/DesignDocumentCard.tsx`

### 2a. `ApiInputSection` ローカルコンポーネントを追加

`StructuredSpecEditor` 関数の前（または後）にローカルコンポーネントとして定義。

```
ApiInputSection
├── FieldEditor: "クエリパラメータ" (inputSchema.query)
│   description: "URLの?以降に付与（例: ?page=1&limit=20）"
└── FieldEditor: "リクエストボディ" (inputSchema.body)
    description: "POST/PUT/PATCHリクエストのペイロード"
```

- **既存の `FieldEditor` をそのまま再利用**
- `inputSchema` は `createEmptyStructuredDesignDocumentSpec("api")` で `{ method: "POST", path: "/", query: [], body: [] }` として初期化済み
- パスパラメータは `path` フィールドの `{id}` 記法で表現（構造化は不要 = YAGNI）

### 2b. 入力セクション条件分岐

508-513行目のFieldEditor（入力フィールド）を条件分岐に変更:

```tsx
{spec.ioType === "api" && spec.inputSchema && "method" in spec.inputSchema ? (
  <ApiInputSection
    inputSchema={spec.inputSchema}
    onChange={(inputSchema) => onChange({ ...spec, inputSchema })}
  />
) : (
  <FieldEditor
    label="入力フィールド"
    description="この機能が受け取るデータの構造を定義します"
    fields={spec.inputFields}
    onChange={(fields) => onChange({ ...spec, inputFields: fields })}
  />
)}
```

---

## Step 3: API型の出力セクション改善

### 3a. `ApiOutputSection` ローカルコンポーネントを追加

```
ApiOutputSection
├── 成功レスポンス（緑ボーダー）
│   ├── Input(number): ステータスコード (outputSchema.success.status, デフォルト200)
│   └── FieldEditor: "レスポンスフィールド" (outputSchema.success.fields)
└── エラーレスポンス（赤ボーダー）
    └── 各エラーパターン (outputSchema.error[])
        ├── Input(number): ステータスコード
        ├── Input: 説明（条件）
        ├── FieldEditor: "エラーフィールド"
        └── 削除ボタン
    └── 追加ボタン
```

- 成功/エラーを色分けボーダーで視覚的に区別
- 既存の副作用リスト（DB操作/外部API/イベント）と同じ「動的リスト + 追加/削除ボタン」パターンを踏襲

### 3b. 出力セクション条件分岐

514-519行目のFieldEditor（出力フィールド）を条件分岐に変更:

```tsx
{spec.ioType === "api" && spec.outputSchema && "success" in spec.outputSchema ? (
  <ApiOutputSection
    outputSchema={spec.outputSchema}
    onChange={(outputSchema) => onChange({ ...spec, outputSchema })}
  />
) : (
  <FieldEditor
    label="出力フィールド"
    description="この機能が返すデータの構造を定義します"
    fields={spec.outputFields}
    onChange={(fields) => onChange({ ...spec, outputFields: fields })}
  />
)}
```

---

## Step 4: 非機能要件UIに認可境界を追加

**ファイル**: `components/forms/design-document/DesignDocumentCard.tsx`

979行目（authMethod Selectの閉じタグ後）に追加:

```tsx
<div className="space-y-1">
  <Label className="text-xs text-slate-500">認可境界（任意）</Label>
  <Textarea
    placeholder="例: billing:invoice:issue権限が必要、管理者ロール限定"
    value={spec.nonFunctional.authorizationBoundary ?? ""}
    onChange={(e) => updateStructuredSpec((current) => ({
      ...current,
      nonFunctional: { ...current.nonFunctional, authorizationBoundary: e.target.value },
    }))}
    rows={2}
  />
</div>
```

---

## スコープ外（意図的に対応しない）

| 項目 | 理由 |
|---|---|
| パスパラメータの構造化 | path文字列の`{id}`記法で十分（YAGNI） |
| 画面/バッチ/ジョブの入出力改善 | 現状のinputFields/outputFieldsで問題なし |
| データモデル/状態遷移の構造化 | details（YAML自由記述）で対応可能 |
| コアロジックの構造化 | 設計方針テキストで対応可能 |
| 既存inputFieldsデータの自動マイグレーション | 新規作成時にquery/body使用を促すだけで十分 |

---

## 後方互換性

- `non-functional.ts`: `.optional()` 追加のみ。既存データに影響なし
- `io-schemas.ts`: 変更なし
- `design-document-structured.ts`: 変更なし
- API型DDで既存の `inputFields`/`outputFields` にデータがある場合: **データは保持されるが、UIでは `inputSchema.query/body` と `outputSchema.success/error` が優先表示される**。inputSchema が未設定の既存DDでは、`"method" in spec.inputSchema` チェックで既存のFieldEditorにフォールバック

---

## 検証方法

1. **API型DD新規作成**: 構造化を開始 → クエリパラメータ/リクエストボディを入力 → 成功/エラーレスポンスを入力 → 保存 → リロードして復元確認
2. **非API型DD確認**: screen/batch/job型が従来通りinputFields/outputFieldsで動作すること
3. **認可境界**: 非機能要件セクションで自由記述を入力 → 保存 → 復元確認
4. **既存データ互換**: 既存のAPI型DDを開いて壊れないこと
