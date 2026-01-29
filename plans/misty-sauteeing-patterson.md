# マークダウンライブラリ使用状況調査

## 調査概要
アプリ全体でマークダウン表示に使用されているライブラリと実装パターンを調査し、統制状況を確認する。

---

## 結論

**ライブラリ自体は統一されている** ✅
- 使用ライブラリ: `react-markdown` (^10.1.0) + `remark-gfm` (^4.0.1) のみ

**実装の重複がある** ⚠️
- 2箇所でほぼ同じカスタムコンポーネント定義が重複

---

## 使用ライブラリ一覧

| ライブラリ | バージョン | 用途 |
|-----------|-----------|------|
| react-markdown | ^10.1.0 | メインのマークダウンレンダラー |
| remark-gfm | ^4.0.1 | GitHub Flavored Markdown拡張 |

---

## 使用箇所マッピング

### 1. チャットメッセージ表示
- **ファイル**: `components/ai-chat/chat-messages.tsx`
- **コンポーネント**: `MessageBubble`
- **用途**: AIアシスタントの応答をマークダウンで表示

### 2. 汎用マークダウンレンダラー
- **ファイル**: `components/markdown/markdown-renderer.tsx`
- **用途**: 各種ドキュメント・カード表示で再利用
  - `components/product-requirement/markdown-field-view.tsx`
  - `app/(with-sidebar)/business/[id]/[taskId]/business-requirement-card.tsx`
  - `app/(with-sidebar)/business/[id]/[taskId]/components/TaskSummaryCard.tsx`
  - `components/system-domains/basic-info-section.tsx`

### 3. プレーンテキスト変換
- **ファイル**: `lib/utils.ts`
- **関数**: `stripMarkdown`
- **用途**: 一覧表示等でマークダウン記号を除去

---

## 課題: 実装の重複

### 問題点
`chat-messages.tsx` と `markdown-renderer.tsx` で以下が重複している：

1. **カスタムコンポーネント定義**: h1-h3, p, ul, ol, li, strong, code, etc.
2. **スタイル定義**:
   - チャット: `prose prose-sm prose-slate max-w-none` (Tailwind Typography)
   - MarkdownRenderer: `markdown-content text-[14px] text-slate-700` (独自)

### 影響
- スタイリングの一貫性がない
- コンポーネント定義の変更時に2箇所修正が必要

---

## 改善実施計画

### 方針
`MarkdownRenderer` コンポーネントをソースオブス・トゥルースとし、全箇所で統一的に使用する。

### 変更内容

#### ① `components/ai-chat/chat-messages.tsx` の修正

**削除** (L4-5, L129-149):
```typescript
// 削除: 直接インポートしているライブラリ
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// 削除: 重複しているカスタムコンポーネント定義
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    ul: ({ children }) => <ul className="list-disc pl-4 my-2 space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-4 my-2 space-y-1">{children}</ol>,
    li: ({ children }) => <li className="text-[14px]">{children}</li>,
    p: ({ children }) => <p className="my-2">{children}</p>,
    strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
    code: ({ children, className }) => { /* ... */ }
  }}
>
```

**追加** (L4付近):
```typescript
// 追加: 共通コンポーネントをインポート
import { MarkdownRenderer } from '@/components/markdown/markdown-renderer';
```

**変更** (L128-153):
```typescript
// 変更前
<div className="prose prose-sm prose-slate max-w-none">
  <ReactMarkdown ...>{message.content}</ReactMarkdown>
  ...
</div>

// 変更後
<MarkdownRenderer
  content={message.content}
  className="prose prose-sm prose-slate max-w-none"
/>
{message.isStreaming && (
  <span className="inline-block w-1 h-4 ml-1 bg-current animate-pulse" />
)}
```

#### ② `components/markdown/markdown-renderer.tsx` の確認

既に `className` プロパティが実装されているため、変更不要。

- `className` プロパティが存在する (L8, L11)
- 既存の `markdown-content` クラスにマージされる (L17)

---

## 変更ファイル一覧

| ファイル | 変更内容 | 行数 |
|----------|----------|------|
| `components/ai-chat/chat-messages.tsx` | インポート変更 + 重複コード削除 | -25行 / +2行 |
| `components/markdown/markdown-renderer.tsx` | 変更なし | 0行 |

---

## 変更規模評価

| 項目 | 評価 |
|------|------|
| **難易度** | ★☆☆ |
| **根拠** | 2ファイル、約27行の削除・修正、既存コンポーネント再利用のみ |
| **リスク** | 低 |
| **懸念点** | チャット表示のインラインコードスタイル (`bg-slate-200`) が `MarkdownRenderer` のスタイル (`bg-slate-100`) に変わる |

---

## 検証計画

### ① ビルド確認
```bash
bun run build
```

### ② E2Eテスト（Playwright MCP）
1. チャット画面でAI応答を表示
2. マークダウン記法（見出し、リスト、コード）が正しくレンダリングされるか確認
3. ビジネス要件カード等の他の表示箇所も確認

### ③ 目視確認項目
- [ ] チャットメッセージでマークダウンが正しく表示される
- [ ] リスト、コードブロック、強調文字が正しく表示される
- [ ] ビジネス要件カード、タスク要約カードでも正しく表示される
