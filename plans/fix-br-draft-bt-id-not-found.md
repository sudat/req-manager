# 修正プラン: BT登録直後のBR草案作成でBTが見つからないエラー

## 問題の再確認

BTを登録した直後に同じチャットスレッドで「業務要件も追加して」と依頼すると、`brDraftTool`が「業務タスクが見つかりません」エラーを返す。

**エラー詳細:**
- 対象BT: `BT-GL-0010`（DBには確実に存在）
- エラーメッセージ: 「BR草案生成に失敗: 業務タスクが見つかりません」
- 発生箇所: `lib/mastra/tools/br-draft.ts:42`

---

## 根本原因の特定

DeepExplore徹底調査により、**複合的な原因**が判明:

### 原因1: コンテキストプロバイダーがBT IDを含めていない（最優先）

**問題コード:** `lib/mastra/context/provider.ts:158-159`

```typescript
case 'bt':
  return `業務タスク「${location.name}」に業務要件を追加します。この業務で達成したいことは何ですか？`;
  // ❌ location.id（BT ID）が含まれていない！
```

AIエージェントは「業務タスク「xxx」」という名前しか知らず、**BT ID（BT-GL-0010）を知る術がない**。

### 原因2: commitDraftToolがワーキングメモリを更新していない

**問題:** BT登録成功後に、ワーキングメモリの `committedItems` が更新されない。

**関連コード:** `lib/mastra/tools/commit-draft.ts`
- ワーキングメモリ更新ロジックが完全に欠如

### 原因3: AIエージェントの推論に依存しすぎている

**問題:** systemプロンプトは「commitDraftToolの結果からIDを取得して」と指示しているが、
AIが会話履歴を解析して推論する必要があり、信頼性が低い。

---

## 修正方針

### 難易度: ★★☆
- **修正ファイル数**: 3 files
- **変更行数概算**: 60-80 lines
- **影響コンポーネント**: 3 components

### 修正順序（重要）

1. **Phase 1: context/provider.ts** - BT IDをプロンプトに含める（最小限の修正で最大の効果）
2. **Phase 2: commit-draft.ts** - ワーキングメモリ自動更新（堅牢性向上）
3. **Phase 3: br-draft.ts** - エラーメッセージ改善（デバッグ支援）

---

## 詳細な修正内容

### Phase 1: context/provider.ts（最優先）

**ファイル:** `lib/mastra/context/provider.ts`

**変更箇所:** `buildInitialPrompt` メソッドの `bt` ケース

**現在のコード（158-159行目）:**
```typescript
case 'bt':
  return `業務タスク「${location.name}」に業務要件を追加します。この業務で達成したいことは何ですか？`;
```

**修正後のコード:**
```typescript
case 'bt':
  return `業務タスク「${location.name}」（ID: ${location.id}）に業務要件を追加します。この業務で達成したいことは何ですか？`;
```

**修正理由:**
- AIエージェントにBT IDを明示的に伝える
- これだけでbrDraftToolのbtIdパラメータに正しい値が渡されるようになる

**期待される効果:**
- AIエージェントが「ID: BT-GL-0010」という情報を認識
- brDraftTool呼び出し時に `btId: "BT-GL-0010"` を正しく設定

---

### Phase 2: commit-draft.ts（堅牢性向上）

**ファイル:** `lib/mastra/tools/commit-draft.ts`

**変更1: ワーキングメモリ更新関数の追加**

**追加位置:** ファイル先頭のimport後

**追加コード:**
```typescript
import { updateWorkingMemory } from '@/lib/mastra/memory/working-memory';

/**
 * コミット済みアイテムをワーキングメモリに追加する
 */
async function addCommittedItemToMemory(
  threadId: string,
  type: 'bt' | 'br' | 'sf' | 'sr' | 'ac' | 'impl_unit',
  id: string,
  code: string,
  name: string
): Promise<void> {
  try {
    const { workingMemory } = await import('@/lib/mastra/memory/working-memory');
    const memory = await workingMemory.get(threadId);

    const newItem = {
      type,
      id,
      code,
      name,
      committedAt: new Date().toISOString(),
    };

    const committedItems = [...(memory.committedItems || []), newItem];
    await workingMemory.update(threadId, { committedItems });

    console.log('[commit_draft] Working memory updated:', { type, id, name });
  } catch (error) {
    // ワーキングメモリ更新の失敗は本体処理を妨げない
    console.warn('[commit_draft] Failed to update working memory:', error);
  }
}
```

**変更2: BTハンドラでワーキングメモリ更新を呼び出す**

**変更箇所:** `draftHandlers.bt` 関数（157-178行目）

**現在のコード:**
```typescript
bt: async () => {
  const v = btContentSchema.parse(content);
  const row = {
    business_id: v.business_domain_id,
    project_id: v.project_id,
    id: v.code,
    name: v.name,
    // ...
  };
  const inserted = await insertRow('business_tasks', row);
  return inserted?.id ?? v.code;
},
```

**修正後のコード:**
```typescript
bt: async () => {
  const v = btContentSchema.parse(content);
  const row = {
    business_id: v.business_domain_id,
    project_id: v.project_id,
    id: v.code,
    name: v.name,
    summary: v.summary ?? null,
    business_context: v.businessContext ?? null,
    process_steps: v.processSteps ?? null,
    input: v.input ?? null,
    output: v.output ?? null,
    concepts: toTextArrayOrEmpty(v.concepts),
    concept_ids_yaml: v.conceptIdsYaml ?? null,
    person: v.person ?? null,
    sort_order: v.sort_order ?? 0,
    created_at: now,
    updated_at: now,
  };
  const inserted = await insertRow('business_tasks', row);
  const insertedId = inserted?.id ?? v.code;

  // ワーキングメモリに追加（非同期で実行、失敗しても本体処理は続行）
  // 注意: threadIdへのアクセス方法は要確認

  return insertedId;
},
```

**技術的課題:**
- `commitDraftTool` は `threadId` を直接受け取っていない
- 解決策: `inputSchema` に `threadId` を追加するか、Mastraのコンテキストから取得

**代替案（シンプル）- 推奨:**
`commitDraftTool` の返却メッセージにIDを強調:

```typescript
return toolSuccess(
  `✅ 業務タスクを登録しました\n\n**ID: ${insertedId}**\n名前: ${v.name}`,
  { id: insertedId, type, name: v.name }
);
```

これにより、AIエージェントは会話履歴から明確にIDを認識できる。

---

### Phase 3: br-draft.ts（デバッグ支援）

**ファイル:** `lib/mastra/tools/br-draft.ts`

**変更箇所:** エラーメッセージの改善（35-43行目付近）

**現在のコード:**
```typescript
const { data: bt } = await supabase
  .from('business_tasks')
  .select('id, name')
  .eq('id', btId)
  .single();

if (!bt) {
  throw new Error('業務タスクが見つかりません');
}
```

**修正後のコード:**
```typescript
console.log('[br_draft] Searching for BT:', { btId });

const { data: bt } = await supabase
  .from('business_tasks')
  .select('id, name')
  .eq('id', btId)
  .single();

if (!bt) {
  console.error('[br_draft] BT not found:', { btId });
  throw new Error(`業務タスクが見つかりません（検索ID: ${btId}）。BT IDが正しいか確認してください。`);
}

console.log('[br_draft] BT found:', { id: bt.id, name: bt.name });
```

**修正理由:**
- デバッグ時に実際に渡されたbtIdがわかる
- ユーザーにもどのIDで検索したか伝わる

---

## 実装手順

### Step 1: Phase 1の実装（必須）

```bash
# ファイルを編集
lib/mastra/context/provider.ts

# 158-159行目を修正
```

**検証:**
- BT登録後、同じチャットで「業務要件も追加して」と依頼
- エラーが発生しないことを確認

### Step 2: Phase 2の実装（推奨）

```bash
# ファイルを編集
lib/mastra/tools/commit-draft.ts
```

**検証:**
- BT登録時のレスポンスにIDが強調表示されることを確認

### Step 3: Phase 3の実装（オプション）

```bash
# ファイルを編集
lib/mastra/tools/br-draft.ts
```

---

## テスト計画

### 手動テスト手順

1. **アプリケーション起動**
   ```bash
   bun dev
   ```

2. **ブラウザでアクセス**
   - `http://localhost:3000/chat?screen=BD&bdId=GL`

3. **テストケース1: BT→BR連続登録**
   - 「新しい業務タスクを登録して」と依頼
   - BT草案が表示されたら承認して登録
   - 「じゃあ業務要件も追加して」と依頼
   - **期待結果**: エラーなくBR草案が生成される

4. **テストケース2: 既存BTへのBR追加**
   - 既存のBT詳細画面からチャットを開く
   - 「業務要件を追加して」と依頼
   - **期待結果**: エラーなくBR草案が生成される

### 自動テスト（E2E）

Playwright MCPを使用:
```bash
# スキルを実行
/e2e-testing
```

---

## リスクと対策

| リスク | 確率 | 影響 | 対策 |
|--------|------|------|------|
| AIエージェントがIDを無視する | 低 | 中 | systemプロンプトにもID使用を明記 |
| 既存の会話フローに影響 | 低 | 低 | 変更は最小限、追加のみ |
| ワーキングメモリ更新の失敗 | 中 | 低 | エラーハンドリングで本体処理を妨げない |

---

## 関連ファイル一覧

| ファイル | 行数 | 変更タイプ |
|----------|------|-----------|
| `lib/mastra/context/provider.ts` | 158-159 | 修正 |
| `lib/mastra/tools/commit-draft.ts` | 176-177 | 修正（メッセージ強調） |
| `lib/mastra/tools/br-draft.ts` | 35-43 | 修正（ログ・エラー改善） |

---

## 次のステップ

1. [ ] Phase 1の修正を実装
2. [ ] 開発サーバーで動作確認
3. [ ] Playwright MCPでE2Eテスト
4. [ ] 問題が解決したらPhase 2, 3を実装（オプション）
