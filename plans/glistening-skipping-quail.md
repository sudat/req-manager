# コード簡素化・共通化計画

## 概要

コードベース調査の結果、以下の3カテゴリで簡素化・共通化の機会を特定した。
また、コードレビューで発見されたバグ3件（P1×2, P2×1）も含む。

```
難易度: ★★☆
根拠: 15+ files, 500+ lines, 複数コンポーネント連携
リスク: 既存機能の動作確認が必要
```

---

## 0. 最優先：コードレビュー指摘バグの修正

### 0.1 【P1】SSEチャンク境界問題 - `chat-container.tsx`

**ファイル**: `components/ai-chat/chat-container.tsx` (154-158行)

**問題点**:
```typescript
// 現状コード（問題あり）
const chunk = decoder.decode(value, { stream: true });
const lines = chunk.split('\n');

for (const line of lines) {
  if (line.startsWith('data: ')) {
```

- SSEの `data: {json}\n\n` がネットワーク都合でチャンク境界に分割されると:
  - 前半がJSON.parseに失敗して捨てられる
  - 後半は`data:`プレフィックスがないため無視される
- **結果**: トークン欠落・途中終了

**修正方針**:
```typescript
// 修正後: バッファを保持して\n\n単位でイベントを組み立て
let buffer = '';

while (!aborted) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });

  // \n\n で区切られたイベントを処理
  const events = buffer.split('\n\n');
  buffer = events.pop() || ''; // 最後の不完全なイベントをバッファに残す

  for (const event of events) {
    const lines = event.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        // JSONパース処理
      }
    }
  }
}
```

**テスト案**: `data: {"content":"hel"` と `lo"}\n\n` に分割したストリームを流し、全文が表示されることを確認

---

### 0.2 【P1】resourceId固定値問題 - `chat/page.tsx`

**ファイル**: `app/(with-sidebar)/chat/page.tsx` (30-33行)

**問題点**:
```typescript
// 現状コード（問題あり）
const config: ChatConfig = {
  resourceId: ContextProvider.generateResourceId(currentProjectId || 'default', 'user'),
};
```

- `'user'` という固定値を全ユーザーで共有
- **結果**: 同一プロジェクトの複数ユーザー間で会話履歴・セマンティック検索が混在（情報漏えいリスク）

**修正方針**:
```typescript
// 修正後: 認証済みユーザーID または セッションIDを使用
// 要検討: Supabase Authからユーザー取得 or クライアントサイドでセッション生成

// Option A: Supabase Auth使用
const { user } = useAuth();
const userId = user?.id || generateSessionId();

// Option B: セッションID生成（ローカルストレージ）
const sessionId = getOrCreateSessionId();

const config: ChatConfig = {
  resourceId: ContextProvider.generateResourceId(currentProjectId || 'default', userId),
};
```

**テスト案**: 2ユーザーで別スレッドを作成し、相互に履歴が混ざらないことを確認

---

### 0.3 【P2】未使用コンテキスト構築 - `api/chat/route.ts`

**ファイル**: `app/api/chat/route.ts` (88-90行)

**問題点**:
```typescript
// 現状コード（問題あり）
const context = await ContextProvider.buildContext(uiLocation);  // ← 使われていない！
contextMessage = ContextProvider.buildInitialPrompt(uiLocation);
```

- `buildContext()` の戻り値 `context` がその後一切参照されない
- **結果**: Supabaseへの複数クエリが毎回発生してレイテンシ増大・失敗率上昇

**修正方針**:
```typescript
// Option A: 呼び出しを削除（contextが不要な場合）
contextMessage = ContextProvider.buildInitialPrompt(uiLocation);

// Option B: contextをプロンプトに含める（本来の意図だった場合）
const context = await ContextProvider.buildContext(uiLocation);
contextMessage = ContextProvider.buildInitialPrompt(uiLocation, context);
```

**テスト案**: location付きのチャット送信でクエリ回数が増えないことを確認

---

## 1. 高優先度：大きなファイル・関数の分割

### 1.1 `components/settings/project-settings-content.tsx` (599行)

**問題点**:
- 1コンポーネントに全設定ロジックが集約
- 設定値更新のスプレッド演算子が4-5段ネスト

**推奨対応**:
```
ProjectSettingsContent (親)
├── ExplorationSettings (探索設定セクション)
├── AllowPathsSettings (許可パス設定セクション)
├── ReviewSettings (レビュー設定セクション)
└── useProjectSettings() カスタムフック
```

### 1.2 `components/ai-chat/chat-container.tsx` (401行)

**問題点**:
- `sendMessage`関数が約120行
- ストリーミング処理、タイムアウト、エラーハンドリングが1関数に混在

**推奨対応**:
```typescript
// 新規: hooks/use-chat-stream.ts
export function useChatStream() {
  // ストリーミング処理を分離
}
```

### 1.3 `app/(with-sidebar)/links/page.tsx` (463行)

**問題点**:
- テーブル、フィルター、バッチ操作が1ファイルに混在
- ネストが5-6段

**推奨対応**:
- `RequirementLinkRow` コンポーネント分離
- `useLinkFilters()` フック抽出

### 1.4 `lib/health-score/index.ts` - `buildHealthScoreSummary` (170行)

**問題点**:
- 複数のissue計算ロジックが1関数に集約

**推奨対応**:
- issue種別ごとの計算関数に分割

---

## 2. 高優先度：データ層CRUD関数の共通化

### 現状の問題

`lib/data/` 配下の10+ファイルで以下が重複:

```typescript
// 全ファイルで繰り返される（95%同一）
export const listXxx = async (projectId?: string) => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  let query = supabase.from("table_name").select("*").order("id");
  if (projectId) query = query.eq("project_id", projectId);

  const { data, error } = await query;
  if (error) return { data: null, error: error.message };
  return { data: (data as Row[]).map(toEntity), error: null };
};
```

**対象ファイル**:
- `lib/data/businesses.ts`
- `lib/data/system-domains.ts`
- `lib/data/projects.ts`
- `lib/data/concepts.ts`
- `lib/data/system-requirements.ts`
- `lib/data/system-functions.ts`
- `lib/data/requirement-links.ts`
- その他

### 推奨対応

```typescript
// 新規: lib/data/crud-factory.ts
export function createCrudOperations<Row, Entity>(config: {
  tableName: string;
  toEntity: (row: Row) => Entity;
  toRow: (entity: Entity) => Partial<Row>;
}) {
  return {
    list: async (projectId?: string) => { ... },
    getById: async (id: string) => { ... },
    create: async (entity: Partial<Entity>) => { ... },
    update: async (id: string, entity: Partial<Entity>) => { ... },
    delete: async (id: string) => { ... },
  };
}

// 使用例: lib/data/businesses.ts
const crud = createCrudOperations<BusinessRow, Business>({
  tableName: "business_domains",
  toEntity: toBusiness,
  toRow: toBusinessRow,
});

export const { list: listBusinesses, getById: getBusinessById, ... } = crud;
```

---

## 3. 中優先度：カスケードフックの共通化

### 現状の問題

以下2ファイルが85%同一構造（各148行）:
- `hooks/use-business-requirement-cascade.ts`
- `hooks/use-system-requirement-cascade.ts`

3段階のカスケードデータフェッチが完全に同じパターン。

### 推奨対応

```typescript
// 新規: hooks/use-cascade-fetch.ts
export function useCascadeFetch<L1, L2, L3>(config: {
  fetchLevel1: (projectId: string) => Promise<L1[]>;
  fetchLevel2: (l1Id: string) => Promise<L2[]>;
  fetchLevel3: (l2Id: string) => Promise<L3[]>;
}) {
  // 共通ロジック
}
```

---

## 4. 中優先度：フィルタリングフックの共通化

### 現状の問題

以下2ファイルが95%同一構造:
- `hooks/use-change-request-filters.ts`
- `hooks/use-system-function-filters.ts`

### 推奨対応

```typescript
// 新規: hooks/use-list-filter.ts
export function useListFilter<T>(config: {
  items: T[];
  searchFields: (item: T) => string[];
  statusField?: keyof T;
}) {
  // 共通ロジック
}
```

---

## 5. 低優先度：その他の共通化機会

### 5.1 product-requirement View/Editの統合

10ファイルが同じ1行ラッパー構造:
```tsx
export function XxxView({ value }: Props) {
  return <MarkdownTextareaView label="ラベル" value={value} />;
}
```

**推奨**: 設定オブジェクトで管理

### 5.2 テーブルコンポーネントの共通化

`change-request-table.tsx` と `system-function-table.tsx` が90%同一構造。

**推奨**: `GenericTable` コンポーネント作成

### 5.3 スタイルクラスの整理

ハードコードされたフォントサイズ・色:
- `text-[11px]`, `text-[12px]`, `text-[13px]`, `text-[14px]`
- `text-slate-400`, `text-slate-500`

**推奨**: Tailwind設定でカスタムユーティリティ定義

---

## 対象サマリー

### バグ修正（Phase 0）

| 重大度 | 対象 | リスク |
|--------|------|--------|
| 🔴 P1 | SSEバッファリング | トークン欠落・途中終了 |
| 🔴 P1 | resourceIdユーザー分離 | 情報漏えい |
| 🟡 P2 | 未使用context削除 | レイテンシ増大 |

### 簡素化・共通化（Phase 1-4）

| 優先度 | 対象 | 推定削減行数 | ファイル数 |
|--------|------|-------------|-----------|
| 高 | 設定画面分割 | -300行 | 1→4 |
| 高 | チャット分割 | -150行 | 1→2 |
| 高 | CRUD共通化 | -800行 | 10+ |
| 中 | カスケードフック | -100行 | 2→1 |
| 中 | フィルタフック | -50行 | 2→1 |
| 低 | View/Edit統合 | -80行 | 10→1 |
| 低 | テーブル共通化 | -100行 | 2→1 |

**合計推定削減**: 約1,500行

---

## 実装順序の推奨

### Phase 0: バグ修正（最優先）

| # | 重大度 | 対象ファイル | 修正内容 | 備考 |
|---|--------|-------------|---------|------|
| 0.1 | P1 | `components/ai-chat/chat-container.tsx` | SSEバッファリング実装 | 今回実施 |
| 0.2 | P1 | `app/(with-sidebar)/chat/page.tsx` | resourceIdユーザー分離 | **後回し**（認証方針決定後） |
| 0.3 | P2 | `app/api/chat/route.ts` | 未使用context呼び出し削除/活用 | 今回実施 |

### Phase 1-4: 簡素化・共通化

1. **Phase 1**: CRUD共通化（最大効果、他に影響少）
2. **Phase 2**: 設定画面・チャット分割（可読性向上）
3. **Phase 3**: フック共通化（中規模効果）
4. **Phase 4**: 低優先度項目（時間があれば）

---

## 検証方法

### Phase 0 検証（バグ修正）
1. **SSEバッファリング**:
   - チャット画面でAIに長文回答を生成させ、トークン欠落がないか確認
   - Network タブでSSEチャンクを監視
2. **resourceId分離**:
   - 異なるブラウザ/シークレットウィンドウで2ユーザーとしてチャット
   - 相互に履歴が混ざらないことを確認
3. **未使用context**:
   - `console.log`でクエリ回数を確認、または削除後にエラーがないことを確認

### Phase 1-4 検証（簡素化）
各Phase完了後:
1. `bun run build` でビルドエラーがないことを確認
2. Playwright MCPで主要画面の動作確認
3. 既存の単体テストがあれば実行
