# DD セクション表示修正計画

## Context

`/system/GL/SF-GL-0002` のDD（Design Document）セクションに3つの表示不具合がある。

| # | 問題 | 対象DD | 根本原因 |
|---|------|--------|----------|
| ① | 未設定の折り畳みセクションが表示される | 全DD | `StructuredSpecViewer` が全7セクションを無条件にレンダリング |
| ② | 「構造化データの読み込みに失敗しました: typeDetail.ioType: Invalid input」 | DD-SF-GL-0002-010 | DB内の `typeDetail` に `ioType` キーが欠落し、Zod discriminatedUnion が失敗 |
| ③ | 折り畳みセクションが空 | DD-SF-GL-0002-020 | model タイプで `typeDetail?.ioType === "model"` ガードに失敗し、何もレンダリングされない |

```
難易度: ★☆☆
根拠: 2 files, ~40 lines, 0 components
リスク: 低 — 全変更が防御的・加算的。スキーマやDB変更なし
```

## 修正ファイル

| ファイル | 修正対象 |
|----------|----------|
| `lib/utils/design-documents/structured-compat.ts` | Issue ② |
| `components/system-domains/structured-spec-viewer/index.tsx` | Issue ①③ |

---

## Fix 1: `structured-compat.ts` — typeDetail.ioType 正規化（Issue ②）

`parseStructuredDetails()` の Zod パース前に、`typeDetail.ioType` をトップレベル `ioType` に同期する正規化ステップを追加。

### 追加する関数

```typescript
function normalizeTypeDetail(raw: Record<string, unknown>): Record<string, unknown> {
  const result = { ...raw };
  const topLevelIoType = raw.ioType;
  if (typeof topLevelIoType !== "string") return result;

  const typeDetail = raw.typeDetail;
  if (isRecord(typeDetail) && typeDetail.ioType !== topLevelIoType) {
    result.typeDetail = { ...typeDetail, ioType: topLevelIoType };
  }
  return result;
}
```

### parseStructuredDetails 変更

```diff
  const normalized = isRecord(details) ? details : {};
+ const withTypeDetail = normalizeTypeDetail(normalized);
- const migrated = migrateLegacyFields(normalized);
+ const migrated = migrateLegacyFields(withTypeDetail);
```

**理由**: `typeDetailSchema` は `ioType` を discriminator キーとする discriminatedUnion。キーが欠落するとパース失敗する。トップレベル `ioType` から補完することで自己修復。

---

## Fix 2: `index.tsx` — 未設定セクションの非表示化（Issue ①）

`ViewerSection` に `hasContent` フラグを追加し、`false` のセクションをフィルタ除外。

### hasContent 判定基準

| セクション | `hasContent` 条件 | 根拠（各Viewerの空判定と同一） |
|-----------|-------------------|-------------------------------|
| エントリポイント | `entryPoints.length > 0` | `EntryPointsViewer` L13 |
| 入力スキーマ | `!!spec.inputSchema` | `InputSchemaViewer` L70 |
| コアロジック | `(spec.coreLogic.rules?.length ?? 0) > 0` | `CoreLogicViewer` L30 |
| 出力スキーマ | `!!spec.outputSchema` | `OutputSchemaViewer` L56 |
| 副作用 | `hasSideEffectsContent(spec.sideEffects)` | `SideEffectsViewer` L46-50 |
| 例外 | `spec.exceptions.length > 0` | `ExceptionsViewer` L35 |
| 非機能要件 | `!!(responseTimeP95 \|\| uptime \|\| authMethod \|\| authorizationBoundary)` | `NonFunctionalViewer` L17-21 |

### ヘルパー関数

```typescript
function hasSideEffectsContent(se: StructuredDesignDocumentSpec["sideEffects"]): boolean {
  return (se.dbOperations?.length ?? 0) > 0
    || (se.externalApiCalls?.length ?? 0) > 0
    || (se.events?.length ?? 0) > 0
    || (se.fileOutputs?.length ?? 0) > 0;
}
```

### レンダリング変更

```diff
  {!isModelType &&
-   standardSections.map((section) => (
+   standardSections
+     .filter((s) => s.hasContent)
+     .map((section) => (
```

---

## Fix 3: `index.tsx` — model タイプのレンダリングギャップ修正（Issue ③）

### 変更

```diff
- {isModelType && spec.typeDetail?.ioType === "model" && (
+ {isModelType && (
    <FoldableStructuredSection ...>
-     <ModelDetailViewer typeDetail={spec.typeDetail} />
+     {spec.typeDetail?.ioType === "model" ? (
+       <ModelDetailViewer typeDetail={spec.typeDetail} />
+     ) : (
+       <EmptyState message="エンティティ定義が未設定です" />
+     )}
    </FoldableStructuredSection>
  )}
```

`EmptyState` を import に追加:
```typescript
import { EmptyState } from "./EmptyState";
```

**理由**: `ModelDetailViewer` の型が `Extract<StructuredTypeDetail, { ioType: "model" }>` なので、`typeDetail` が undefined や非 model の場合は直接渡せない。三項演算子で分岐し、`EmptyState` でフォールバック。

---

## 実装順序

1. **Fix 1** (`structured-compat.ts`) — データ層の正規化を先に入れる
2. **Fix 2 + Fix 3** (`index.tsx`) — 同一ファイルなので同時に修正

## 検証

`http://localhost:3000/system/GL/SF-GL-0002` で以下を確認:

- [ ] DD-SF-GL-0002-010: パースエラーバナーが消え、構造化データが正常表示
- [ ] DD-SF-GL-0002-020: 「エンティティ定義」セクションが表示される（空ステートまたは実データ）
- [ ] 全DD: 未設定のセクション（出力スキーマ等）の折り畳みが非表示
- [ ] データが設定されている DD のセクションは従来どおり表示
