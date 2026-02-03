# コード簡素化・共通化プラン（Phase 2）

## 前回の実施内容（完了済み）
- ✅ `app/api/chat/route.ts` の分割（589行→212行）
- ✅ `lib/data/system-requirements.ts` の共通化
- ✅ `lib/data/acceptance-criteria.ts` の共通化
- ✅ `executeListQuery` ヘルパー追加

---

## 今回の調査結果サマリー

### カテゴリA: 簡単で効果が高い（★☆☆）

| 対象 | 行数/影響 | 問題 | 推奨アクション |
|------|-----------|------|---------------|
| 並び替え関数の重複 | 5ファイル×30行 | `updateXxxSortOrder` が5箇所でコピペ | `crud-factory.ts` に `createSortOrderUpdater` 追加 |
| 並び替え用型定義 | 6ファイル×4行 | `XxxSortOrderUpdate` 型が重複 | 既存の `SortOrderUpdate` を再利用 |
| splitCsv/splitLines | 2ファイル×10行 | 文字列分割ユーティリティが重複 | `lib/utils/string.ts` に移動 |
| `chat-messages.tsx` | 303行 | 3コンポーネントが1ファイル | ファイル分割（MessageBubble, ProgressSteps） |
| `related-requirements-transformer.ts` | 390行 | 2関数間で70行の重複 | 共通部分を抽出 |

### カテゴリB: 中程度の難易度（★★☆）

| 対象 | 行数 | 問題 | 推奨アクション |
|------|------|------|---------------|
| `sse-stream-builder.ts` | 327行 | start関数が270行、チャンク処理が混在 | チャンクハンドラーをオブジェクトに分離 |
| `project-settings-content.tsx` | 548行 | 設定フォームの全項目が1コンポーネント | セクション別コンポーネントに分割 |
| `requirement-links.ts` | 417行 | CRUD関数のボイラープレート重複 | `executeListQuery` 適用拡大 |
| `task-sync.ts` | 368行 | sync関数が同じ構造で重複 | 共通syncパターンを抽出 |
| `commit-draft.ts` | 315行 | 巨大switch文が2箇所 | ドラフトタイプ別ハンドラーに分離 |
| TaskForm.tsx | 23 props | props爆発 | オブジェクト化 or useFormフック |

### カテゴリC: 難易度が高い（★★★）

| 対象 | 行数 | 問題 | 推奨アクション |
|------|------|------|---------------|
| `use-streaming-chat.ts` | 293行 | sendMessage関数が220行、ネスト深い | ストリーム処理とUI状態管理を分離 |
| `resource-list-page.tsx` | 572行 | 状態管理・DnD・描画が混在 | useResourceListフック + 表コンポーネント分離 |

---

## 実施プラン: 大規模（カテゴリA + B）

**所要時間**: 半日〜1日
**効果**: 約500行の重複削減、コードベース全体の品質向上

---

## 実装順序

### Phase 1: カテゴリA（簡単な項目）

#### 1-1. 並び替え関数の共通化
**対象ファイル**:
- `lib/data/crud-factory.ts` - `createSortOrderUpdater` 追加
- `lib/data/businesses.ts` - 適用
- `lib/data/tasks.ts` - 適用
- `lib/data/system-domains.ts` - 適用
- `lib/data/system-functions.ts` - 適用
- `lib/data/concepts.ts` - 適用

**難易度**: ★☆☆

#### 1-2. 並び替え用型定義の統一
**対象**: 6ファイルの `XxxSortOrderUpdate` 型を `SortOrderUpdate` に統一

**難易度**: ★☆☆

#### 1-3. splitCsv/splitLines ユーティリティ移動
**対象ファイル**:
- `lib/utils/string.ts` - 新規作成
- `app/(with-sidebar)/ideas/create/page.tsx` - import変更
- `app/(with-sidebar)/ideas/[id]/edit/page.tsx` - import変更

**難易度**: ★☆☆

#### 1-4. chat-messages.tsx のファイル分割
**対象ファイル**:
- `components/ai-chat/chat-messages.tsx` - ChatMessagesのみ残す
- `components/ai-chat/message-bubble.tsx` - 新規
- `components/ai-chat/progress-steps.tsx` - 新規

**難易度**: ★☆☆

#### 1-5. related-requirements-transformer.ts の重複解消
**対象**: `buildRelatedRequirements` と `buildRelatedRequirementsWithSuspicion` の共通部分抽出

**難易度**: ★☆☆

### Phase 2: カテゴリB（中程度の項目）

#### 2-1. sse-stream-builder.ts の分割
**対象ファイル**:
- `app/api/chat/lib/sse-stream-builder.ts` - リファクタ
- `app/api/chat/lib/chunk-handlers.ts` - 新規（チャンクタイプ別ハンドラー）

**改善後の構造**:
```typescript
const chunkHandlers: Record<string, ChunkHandler> = {
  'text-delta': handleTextDelta,
  'tool-call': handleToolCall,
  'tool-result': handleToolResult,
  'tool-error': handleToolError,
  'error': handleError,
};
```

**難易度**: ★★☆

#### 2-2. requirement-links.ts の共通化
**対象**: `executeListQuery` を適用して重複削減

**難易度**: ★☆☆

#### 2-3. task-sync.ts の共通化
**対象**: `syncBusinessRequirements` と `syncSystemRequirements` の共通パターン抽出

**難易度**: ★★☆

#### 2-4. commit-draft.ts のswitch文分離
**対象**: ドラフトタイプ別ハンドラーをオブジェクトに分離

**難易度**: ★★☆

#### 2-5. project-settings-content.tsx の分割
**対象ファイル**:
- `components/settings/project-settings-content.tsx` - 親コンポーネント
- `components/settings/sections/exploration-settings.tsx` - 新規
- `components/settings/sections/allow-paths-settings.tsx` - 新規
- `components/settings/sections/impact-review-settings.tsx` - 新規

**難易度**: ★★☆

#### 2-6. TaskForm.tsx のprops整理
**対象**: propsをオブジェクト形式に統合

**難易度**: ★★☆

---

## 検証方法

1. **型チェック**: `bunx tsc --noEmit`
2. **ビルド確認**: `bun run build`
3. **動作確認**: 主要画面の表示・操作確認

