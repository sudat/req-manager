# コード簡素化・共通化 調査レポート

## 概要

code-simplifierスキルを使用したコードベース全体の簡素化候補を調査した結果をまとめる。

---

## 1. 優先度：高（即時対応推奨）

### 1.1 lib/mastra/tools/ - OpenAI API呼び出しの重複

**問題**: 4ファイルで同じfetch処理が繰り返されている（各15-20行）

| ファイル | 行数 |
|----------|------|
| `lib/mastra/tools/bt-draft.ts` | 187-201行 |
| `lib/mastra/tools/br-draft.ts` | 80-94行 |
| `lib/mastra/tools/impl-unit-draft.ts` | 153-166行 |
| `lib/mastra/tools/system-draft.ts` | 149-163行 |

**重複コード例**:
```typescript
const llmResponse = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${openaiApiKey}`,
  },
  body: JSON.stringify({
    model: 'gpt-5-mini',
    messages: [...],
    response_format: { type: 'json_object' },
  }),
});
```

**改善案**: `lib/mastra/utils/llm-helpers.ts` を新規作成
- 推定削減行数: 60-80行

---

### 1.2 一覧ページコンポーネントの重複パターン

**問題**: 5つのページで同一のデータフェッチ・フィルタリング・削除処理パターン

| ファイル | 行数 |
|----------|------|
| `app/(with-sidebar)/system/page.tsx` | 339行 |
| `app/(with-sidebar)/business/[id]/page.tsx` | 304行 |
| `app/(with-sidebar)/ideas/[id]/page.tsx` | 326行 |
| `app/(with-sidebar)/projects/page.tsx` | - |
| `app/(with-sidebar)/tickets/page.tsx` | - |

**重複パターン**:
1. 状態管理（items, query, error, loading）
2. useEffectでのデータフェッチ（activeフラグパターン）
3. useMemoでのフィルタリング
4. 削除ハンドラ

**改善案**:
- 既存の`ResourceListPage`コンポーネント（241行）を活用
- または `useResourceList` カスタムフックを作成
- 推定削減行数: 500-700行

---

### 1.3 SearchToolbar / TableRowActions UIパターン

**問題**: 検索バーと操作ボタン（Eye/Pencil/Trash2）が複数ページで重複

**改善案**:
- `components/ui/search-toolbar.tsx` を新規作成
- `components/ui/table-row-actions.tsx` を新規作成
- 推定削減行数: 70行

---

## 2. 優先度：中（中期対応）

### 2.1 巨大ファイルの分割

| ファイル | 行数 | 問題点 |
|----------|------|--------|
| `app/api/chat/route.ts` | 578行 | start()関数が370行、深いネスト |
| `components/settings/project-settings-content.tsx` | 548行 | 深層更新パターンが20回以上 |
| `components/ai-chat/chat-container.tsx` | 431行 | sendMessage関数が100行 |
| `lib/utils/hierarchical-editor.ts` | 439行 | - |

**改善案**:
- `chat/route.ts`: イベントハンドラを別ファイルに分離
- `project-settings-content.tsx`: immer導入 または パス指定型setter作成
- `chat-container.tsx`: `useStreamingChat`フックに分離

---

### 2.2 lib/mastra/tools/ エラーハンドリング統一

**問題**: 各ツールでバラバラなエラーレスポンス形式

**改善案**: `lib/mastra/utils/tool-helpers.ts` を新規作成
```typescript
export const toolSuccess = <T>(data: T, message: string) => ({
  success: true, ...data, message,
});
export const toolError = (error: Error, message: string) => ({
  success: false, error: error.message, message,
});
```

---

### 2.3 フォームフィールドコンポーネントの統一

**問題**: TaskBasicInfoCard.tsx と TaskForm.tsx で類似フィールド構成

**改善案**:
- `LabeledInput` コンポーネント
- `LabeledTextarea` コンポーネント
- 推定削減行数: 50行

---

### 2.4 lib/data/ CRUDパターンの共通化

**問題**: 各データファイルで同じlist/delete関数パターン（30-50行重複）

**改善案**: 既存の `lib/data/crud-factory.ts`（215行）をより多くのファイルで活用
- 推定削減行数: 300-400行

---

## 3. 優先度：低（長期対応）

### 3.1 分散カスタムフックの集約

**問題**: `app/(with-sidebar)/` 配下に13個のカスタムフックが分散

**対象ファイル**:
- `use-task-detail.ts` (231行)
- `useSystemFunctionForm.ts` (266行)
- `useSystemFunctionFormActions.ts` (181行)
- `use-manual-add-data.ts` (203行)
- `useSystemFunctionCreate.ts` (224行)
- など

**改善案**: `/hooks/` ディレクトリへの集約と汎用化

---

### 3.2 採番ロジックの統一

**問題**: bt-draft, br-draft, impl-unit-draft, system-draftで類似の採番ロジック

**改善案**: `lib/utils/id-rules.ts` を拡張して全ツールで統一

---

### 3.3 型定義の重複解消

**問題**: `context/types.ts` の UILocation と `memory/working-memory-schema.ts` の LocationInfoSchema で重複

**改善案**: 単一のZodスキーマから型を導出

---

## 4. 改善優先度サマリ

| 優先度 | カテゴリ | 推定削減行数 | 難易度 |
|--------|----------|-------------|--------|
| **高** | OpenAI API呼び出し共通化 | 60-80行 | ★☆☆ |
| **高** | 一覧ページ共通化 | 500-700行 | ★★☆ |
| **高** | SearchToolbar/TableRowActions | 70行 | ★☆☆ |
| 中 | 巨大ファイル分割 | - (構造改善) | ★★☆ |
| 中 | エラーハンドリング統一 | 30-40行 | ★☆☆ |
| 中 | フォームフィールド統一 | 50行 | ★☆☆ |
| 中 | lib/data/ CRUD共通化 | 300-400行 | ★★☆ |
| 低 | フック集約 | 200-300行 | ★★☆ |
| 低 | 採番ロジック統一 | 20-30行 | ★☆☆ |
| 低 | 型定義重複解消 | 10-15行 | ★☆☆ |

---

## 5. 推奨アクション

### 即時実行可能（難易度：★☆☆）

1. **`lib/mastra/utils/llm-helpers.ts` 新規作成**
   - OpenAI API呼び出しを共通化
   - 4ファイルの重複を解消

2. **`lib/mastra/utils/tool-helpers.ts` 新規作成**
   - toolSuccess/toolError ヘルパー関数
   - エラーレスポンス形式を統一

3. **`components/ui/search-toolbar.tsx` 新規作成**
   - 検索バーUIを共通化

### 次ステップ推奨（難易度：★★☆）

1. **一覧ページのリファクタリング**
   - `system/page.tsx`
   - `business/[id]/page.tsx`
   - `ideas/[id]/page.tsx`
   - → `ResourceListPage` または `useResourceList` を活用

2. **chat-container.tsx の分割**
   - `useStreamingChat` フックに分離
   - sendMessage関数を100行→30行に削減

---

## 6. 検証方法

1. **型チェック**: `bun run typecheck`
2. **ビルド**: `bun run build`
3. **動作確認**: Playwright MCPで主要画面を確認
   - 一覧ページ（system, business）
   - AIチャット機能
   - エクスポート機能
