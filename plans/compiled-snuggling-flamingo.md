# Schema-based Working Memoryへの移行計画

## 概要

Template-based Working MemoryからSchema-based（Zod）Working Memoryへ移行し、構造化されたセッション状態管理を実現する。

## 移行の理由

| 現状（Template方式） | 目標（Schema方式） |
|---------------------|-------------------|
| 全体を再生成する必要がある | 変更フィールドのみ更新（Merge Semantics） |
| Markdownをパース必要 | JSONとして直接アクセス可能 |
| 書き忘れ・コピペミスのリスク | Zodによる型安全・バリデーション |

---

## 実装手順

### 1. スキーマ定義ファイルの作成

**新規ファイル**: `lib/mastra/memory/working-memory-schema.ts`

```typescript
import { z } from 'zod';

// 草案状態スキーマ
export const DraftItemSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['bt', 'br', 'sf', 'sr', 'ac', 'impl_unit']),
  content: z.any().optional(),
  status: z.enum(['draft', 'committed', 'discarded']).optional(),
  previewAvailable: z.boolean().optional(),
  uncertainties: z.array(z.string()).optional(),
  createdAt: z.string().optional(),
});

// 位置情報スキーマ
export const LocationInfoSchema = z.object({
  type: z.enum(['bd', 'bt', 'br', 'sd', 'sf', 'sr', 'cr', 'project']),
  id: z.string().optional(),
  name: z.string().optional(),
  projectId: z.string(),
  breadcrumb: z.array(z.string()).optional(),
});

// メインスキーマ
export const WorkingMemorySchema = z.object({
  currentLocation: LocationInfoSchema.optional(),
  activeDrafts: z.array(DraftItemSchema).optional(),
  committedItems: z.array(z.object({
    type: z.enum(['bt', 'br', 'sf', 'sr', 'ac', 'impl_unit']),
    id: z.string(),
    code: z.string(),
    name: z.string(),
    committedAt: z.string(),
  })).optional(),
  pendingIssues: z.array(z.object({
    category: z.enum(['uncertainty', 'question', 'blocking', 'info_needed']),
    description: z.string(),
    relatedDraftId: z.string().optional(),
    createdAt: z.string(),
  })).optional(),
  sessionMetadata: z.object({
    lastActivity: z.string().optional(),
    totalDraftsCreated: z.number().optional(),
    totalCommits: z.number().optional(),
  }).optional(),
});

export type WorkingMemory = z.infer<typeof WorkingMemorySchema>;
```

---

### 2. メモリ設定の更新

**ファイル**: `lib/mastra/memory.ts`

**変更点**:
- `template` プロパティを削除
- `schema: WorkingMemorySchema` を追加

```typescript
import { Memory } from '@mastra/memory';
import { LibSQLStore, LibSQLVector } from '@mastra/libsql';
import { WorkingMemorySchema } from './memory/working-memory-schema';

export const memory = new Memory({
  storage: new LibSQLStore({
    id: 'requirements-memory-storage',
    url: 'file:./data/memory.db',
  }),
  vector: new LibSQLVector({
    id: 'requirements-vector-storage',
    url: 'file:./data/vector.db',
  }),
  embedder: 'openai/text-embedding-3-small',
  options: {
    lastMessages: 20,
    semanticRecall: {
      topK: 3,
      messageRange: { before: 2, after: 1 },
    },
    workingMemory: {
      enabled: true,
      schema: WorkingMemorySchema,  // ← templateから変更
    },
  },
});
```

---

### 3. エージェント指示の拡張

**ファイル**: `lib/mastra/agents/requirements-agent.ts`

**追加内容**:
- 「Working Memoryの管理」セクションを追加
- 更新タイミングとMerge Semanticsの説明
- Tool実行後のメモリ更新を明示

追加する指示内容:

```typescript
instructions: `
既存の指示に加え、以下を追加：

## Working Memoryの管理

**updateWorkingMemoryツールが利用可能です。**

### 更新のタイミング
1. 草案作成後: activeDraftsに追加
2. コミット後: committedItemsに追加、activeDraftsをクリア（null）
3. 未確定事項: pendingIssuesに追加

### Merge Semantics
- 更新したいフィールドのみを指定してください
- 他のフィールドは自動的に保持されます

### 例: BT草案作成後
{
  "activeDrafts": [{
    "type": "bt",
    "content": { "code": "GL-001", ... },
    "status": "draft"
  }],
  "sessionMetadata": { "totalDraftsCreated": 1 }
}

### 例: コミット後
{
  "activeDrafts": null,
  "committedItems": [{ "type": "bt", "id": "bt-xxx", ... }],
  "sessionMetadata": { "totalCommits": 1 }
}
`
```

---

## 検証手順

### 1. 型安全性チェック
```bash
bun run build
```

### 2. 手動テストシナリオ

**シナリオ1: BT草案作成**
```
ユーザー入力: "GL領域に「一般会計の締め処理」という業務タスクを追加して"

期待される動作:
1. btDraftToolが呼ばれる
2. updateWorkingMemoryでactiveDraftsに追加される
3. メモリに草案情報が保存される
```

**シナリオ2: コミット操作**
```
ユーザー入力: "確定して"

期待される動作:
1. commitDraftToolが呼ばれる
2. activeDraftsがクリアされ、committedItemsに追加される
```

**シナリオ3: 連続操作**
```
ユーザー入力: "そのBTにBRも追加して"

期待される動作:
1. WorkingMemoryからbtIdを参照
2. brDraftToolが正しいbtIdで呼ばれる
```

---

## 影響を受けるファイル

| ファイル | 変更内容 |
|---------|---------|
| `lib/mastra/memory/working-memory-schema.ts` | 新規作成 |
| `lib/mastra/memory.ts` | template→schemaに変更 |
| `lib/mastra/agents/requirements-agent.ts` | 指示を拡張 |

---

## 既存機能への影響

- ✅ すべての既存ツールは変更不要
- ✅ チャットAPIは変更不要
- ✅ ContextProviderはそのまま利用可能

---

## ロールバック計画

問題が発生した場合:

```bash
git checkout lib/mastra/memory.ts
git checkout lib/mastra/agents/requirements-agent.ts
rm lib/mastra/memory/working-memory-schema.ts
bun run build
```
