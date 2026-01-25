# detectAmbiguousWords ランタイムエラー修正計画

## エラー概要

```
Cannot read properties of undefined (reading 'includes')
lib/domain/schemas/system-design.ts (176:48)
```

## 根本原因

`detectAmbiguousWords` 関数が `text` パラメータが `undefined` の場合を考慮していない。

```typescript
// lib/domain/schemas/system-design.ts:176
export function detectAmbiguousWords(text: string): string[] {
  return AMBIGUOUS_WORDS.filter((word) => text.includes(word)); // text が undefined のとクラッシュ
}
```

`AmbiguousWordLint` コンポーネントが、オプションフィールド（`undefined` 可能性のあるフィールド）の値をそのまま `detectAmbiguousWords` に渡している。

## 修正アプローチ

### Step 1: detectAmbiguousWords で防御的プログラミング（主要修正）

**ファイル**: `lib/domain/schemas/system-design.ts`

```typescript
export function detectAmbiguousWords(text: string): string[] {
  if (!text || typeof text !== 'string') return [];
  return AMBIGUOUS_WORDS.filter((word) => text.includes(word));
}
```

### Step 2: AmbiguousWordLint でも早期リターン（追加防御）

**ファイル**: `components/ui/alert.tsx` または `components/forms/design/ambiguous-word-lint.tsx`

```typescript
export function AmbiguousWordLint({ text }: AmbiguousWordLintProps) {
  if (!text) return null; // 早期リターン
  const ambiguousWords = detectAmbiguousWords(text);
  // ... rest
}
```

### Step 3: オプションフィールドに AmbiguousWordLint を追加（完全性担保）

以下のフォームコンポーネントで、オプションフィールドに lint を追加：

| ファイル | 追加対象フィールド |
|----------|-------------------|
| `components/forms/design/forms/function-design-form.tsx` | `sideEffects` |
| `components/forms/design/forms/data-design-form.tsx` | `constraints`, `migration` |
| `components/forms/design/forms/exception-design-form.tsx` | `userNotification`, `logging`, `recovery` |
| `components/forms/design/forms/auth-design-form.tsx` | `boundary` |

各フィールドに以下のパターンを適用：
```typescript
<AmbiguousWordLint text={content.fieldName || ""} />
```

## 変更ファイル一覧

| ファイル | 種別 | 優先度 |
|----------|------|--------|
| `lib/domain/schemas/system-design.ts` | 変更 | 高（必須） |
| `components/forms/design/ambiguous-word-lint.tsx` | 変更 | 高（推奨） |
| `components/forms/design/forms/function-design-form.tsx` | 変更 | 中 |
| `components/forms/design/forms/data-design-form.tsx` | 変更 | 中 |
| `components/forms/design/forms/exception-design-form.tsx` | 変更 | 中 |
| `components/forms/design/forms/auth-design-form.tsx` | 変更 | 中 |

## 検証方法

1. システム機能編集ページ (`/system-domains/GL/SRF-027/edit`) を開く
2. 任意の設計観点タブをクリック
3. オプションフィールド（制約、ロギング等）にテキストを入力
4. エラーが発生しないことを確認

## 注意事項

- Step 1 は必須（最小修正でエラー解消）
- Step 2 は追加防御として推奨
- Step 3 はUX向上のために推奨（必須ではない）
