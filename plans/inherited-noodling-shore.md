# Runtime TypeError 修正計画

## 問題
`lib/domain/schemas/system-design.ts:176` で発生:
```
Cannot read properties of undefined (reading 'includes')
```

`detectAmbiguousWords` 関数が `undefined` の `text` を受け取り、`text.includes()` 呼び出しでエラー発生。

## 修正ファイル

### 1. `lib/domain/schemas/system-design.ts`

**変更前:**
```typescript
export function detectAmbiguousWords(text: string): string[] {
  return AMBIGUOUS_WORDS.filter((word) => text.includes(word));
}
```

**変更後:**
```typescript
export function detectAmbiguousWords(text: string): string[] {
  if (!text) return [];
  return AMBIGUOUS_WORDS.filter((word) => text.includes(word));
}
```

### 2. `components/forms/design/ambiguous-word-lint.tsx`

`AmbiguousWordLint` コンポーネントでも防御的な対応を追加:

**変更:**
```typescript
export function AmbiguousWordLint({ text }: AmbiguousWordLintProps) {
  const ambiguousWords = detectAmbiguousWords(text || "");

  // ... 以降は変更なし
```

## 検証

1. 修正後にページを再読み込み
2. `/system-domains/GL/SRF-027/edit` にアクセス
3. エラーが発生しないことを確認
4. 曖昧語（「高速」「柔軟」など）を入力した際に警告が表示されることを確認

## 難易度
**★☆☆** (1ファイル、数行の変更、低リスク)
