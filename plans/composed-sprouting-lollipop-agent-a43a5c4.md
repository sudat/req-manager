# 概念辞書候補（Concept）生成の挙動調査報告

## 要約

chat画面でLLMが概念辞書候補（Concept）を提示する際、**areas（影響領域）値の生成はユーザー入力の自由テキストに依存しており、business_domainsマスターとの参照整合性チェックは行われていない**ことが判明しました。

---

## 1. 各観点からの発見

### 1.1 UI実装構成

**chat画面のルーティングとコンポーネント**
- `/app/(with-sidebar)/chat/page.tsx`: チャットページのエントリーポイント
  - URLパラメータから位置情報（screen, bdId, btId等）を受け取る
  - `ChatContainer`コンポーネントに`config`として渡す

**主要コンポーネント**
- `/components/ai-chat/chat-container.tsx`: チャットの状態管理とAPI通信
  - `conceptCandidates`ステートで概念候補を保持
  - `useStreamingChat`フックから`onConceptCandidates`コールバックで受信
  - `ConceptSuggestionCard`で候補を表示
  - 承認時は`/api/concepts`にPOSTして概念辞書へ登録

**概念候補カード**
- `/components/ai-chat/concept-suggestion/concept-suggestion-card.tsx`
  - `ConceptCandidate`型: `term`, `context`, `isExisting`, `existingDefinition`, `suggestion`, `matchType`, `similarConcept`
  - **注意**: `areas`フィールドはUI側では扱われない

### 1.2 データフロー

**概念候補のフロー**
```
LLM (btDraftTool/brDraftTool)
  ↓ conceptCandidates (配列)
/api/chat (streaming)
  ↓ SSEイベント: concept_candidates
useStreamingChatフック
  ↓ onConceptCandidatesコールバック
ChatContainer (conceptCandidatesステート)
  ↓ ユーザー承認
/api/concepts (POST)
  ↓ 概念辞書へ登録
```

**/api/conceptsの処理**
- `/app/api/concepts/route.ts`
  - `category`パラメータを`areas`としてDBへ保存
  - **制約なし**: `category`は自由テキストとして扱われている
  - コード: `areas: [category]`

### 1.3 Mastra Agent/Tool

**requirements-agent**
- `/lib/mastra/agents/requirements-agent.ts`
  - ユーザーの自然言語入力を構造化された要件に整形する
  - `btDraftTool`, `brDraftTool`などを使用

**btDraftTool**
- `/lib/mastra/tools/bt-draft.ts`
  - LLMプロンプトで`concepts`を抽出
  - 既存概念との照合（完全一致、類似一致、新規）
  - **重要**: `conceptCandidates`には`areas`フィールドが含まれない
  - コード構造:
    ```typescript
    conceptCandidates: Array<{
      term: string;
      context: string;
      isExisting: boolean;
      existingDefinition?: string;
      suggestion?: string;
      matchType?: 'exact' | 'similar' | 'new';
      similarConcept?: {...};
    }>
    ```

**brDraftTool**
- `/lib/mastra/tools/br-draft.ts`
  - 同様の構造で概念候補を生成
  - `areas`フィールドなし

### 1.4 プロンプト・LLM連携

**btDraftToolのLLMプロンプト**
- `concepts`フィールドの抽出指示:
  ```
  "concepts": ["概念1", "概念2", "..."]
  ```
- 生成ルール:
  - 「conceptsは業務で使われる重要な概念・用語を抽出」
- **areas生成に関する指示なし**

**brDraftToolのLLMプロンプト**
- 同様に`concepts`のみを抽出
- **areas生成に関する指示なし**

### 1.5 バリデーション・制約

**現在の状況**
- `BusinessArea`型は`string`のエイリアス（自由テキスト）
- `/lib/domain/enums.ts`: `export type BusinessArea = string;`
- **business_domainsマスターとの整合性チェックなし**

**ビジネス領域マスターとの対比**
- `business_domains`テーブルの`area`フィールドには有効なコードが格納（AR, AP, GL等）
- `listBusinessDomainsTool`, `searchBusinessDomainsTool`で検索可能
- しかし、概念辞書の`areas`はこれらとの連携がない

---

## 2. 現状のareas生成ロジック

### 概念登録時のフロー

```
1. ユーザーが概念候補を承認
2. ConceptApprovalFormで入力:
   - term (用語名)
   - definition (定義)
   - aliases (同義語) - オプション
   - category (カテゴリ) - オプション、デフォルト'common'
3. /api/conceptsへPOST
4. DBへ保存:
   - areas: [category]  // categoryをそのまま配列化
```

### 問題点

1. **categoryが自由テキスト**: ユーザー入力やデフォルト値'common'がそのまま使われる
2. **business_domains.areaとの整合性チェックなし**: AR, AP, GLなどの有効コードか検証されない
3. **UIからの選択肢提供なし**: ドロップダウン等で有効なareaを選ぶUIがない
4. **LLMプロンプトでareas生成指示なし**: btDraftTool/brDraftToolでareasを生成していない

---

## 3. 制約追加が必要な箇所

### 優先度別修正箇所

#### 【高優先度】概念登録APIでのバリデーション

**ファイル**: `/app/api/concepts/route.ts`

**現状**:
```typescript
const { projectId, term, definition, aliases = [], category = 'common' } = body;
// ...
const conceptInput: ConceptCreateInput = {
  // ...
  areas: [category],  // categoryをそのまま使用
  // ...
};
```

**修正案**:
1. `category`パラメータを`areas`に変更（配列で受け取る）
2. `business_domains`テーブルから有効な`area`を取得して検証
3. 無効なareaが含まれる場合は400エラーを返す

#### 【中優先度】概念候補生成時のareas付与

**ファイル**: `/lib/mastra/tools/bt-draft.ts`, `/lib/mastra/tools/br-draft.ts`

**現状**:
- LLMプロンプトで`concepts`のみ抽出
- `conceptCandidates`に`areas`フィールドがない

**修正案**:
1. LLMプロンプトに`areas`抽出を追加
2. ビジネス領域（`bdId`）を参照して、適切なareaを設定
3. `conceptCandidates`型に`areas`フィールドを追加

#### 【中優先度】UIでのareas選択

**ファイル**: `/components/ai-chat/concept-suggestion/...`

**現状**:
- `ConceptApprovalForm`で自由テキスト入力の`category`

**修正案**:
1. `listBusinessDomainsTool`から有効なarea一覧を取得
2. セレクトボックスまたはマルチセレクトでareaを選択可能にする
3. デフォルト値は現在の業務領域（btDraftToolから渡されたbdId）を使用

#### 【低優先度】型定義の厳密化

**ファイル**: `/lib/domain/enums.ts`

**現状**:
```typescript
export type BusinessArea = string;
```

**修正案**:
1. 有効なareaコードのUnion型に変更
2. または、branded typeでラップして検証を強制

---

## 4. 関連ファイル一覧

### UIコンポーネント
- `/app/(with-sidebar)/chat/page.tsx`
- `/components/ai-chat/chat-container.tsx`
- `/components/ai-chat/chat-messages.tsx`
- `/components/ai-chat/concept-suggestion/concept-suggestion-card.tsx`
- `/components/ai-chat/concept-suggestion/types.ts`

### API
- `/app/api/chat/route.ts`
- `/app/api/chat/lib/chunk-handlers.ts`
- `/app/api/concepts/route.ts`

### Hooks
- `/hooks/use-streaming-chat.ts`

### Mastra Tools
- `/lib/mastra/agents/requirements-agent.ts`
- `/lib/mastra/tools/bt-draft.ts`
- `/lib/mastra/tools/br-draft.ts`
- `/lib/mastra/tools/list-business-domains.ts`
- `/lib/mastra/tools/search-business-domains.ts`

### データアクセス
- `/lib/data/concepts.ts`
- `/lib/data/businesses.ts`

### 型定義
- `/components/ai-chat/types.ts`
- `/lib/domain/entities.ts`
- `/lib/domain/value-objects.ts`
- `/lib/domain/enums.ts`

### ドキュメント
- `/docs/design/database-schema-design.md`

---

## 5. 次のステップへの提案（実装プラン）

### Phase 1: 概念登録APIでのバリデーション（最小限の修正）

**目的**: 無効なareaがDBに保存されるのを防ぐ

**手順**:
1. `/app/api/concepts/route.ts`を修正
   - `business_domains`テーブルから有効なareaを取得
   - 入力されたareasを検証
   - 無効なareaが含まれる場合は400エラー

**期待効果**:
- データ整合性の最低限の担保
- UI修正待ちで無効なデータが混入するのを防止

### Phase 2: 概念候補生成時のareas付与

**目的**: LLMが生成する概念候補に適切なareasを含める

**手順**:
1. `btDraftTool`, `brDraftTool`のLLMプロンプトを修正
   - `areas`フィールド抽出を追加
   - ビジネス領域（bdId）をコンテキストに含める
2. `ConceptCandidate`型に`areas`フィールドを追加
3. チャンクハンドラーでareasを転送

**期待効果**:
- ユーザーがareasを手動で入力する手間を削減
- 適切なデフォルト値の提供

### Phase 3: UIでのareas選択支援

**目的**: ユーザーが有効なareaを選択しやすくする

**手順**:
1. `ConceptApprovalForm`を修正
   - `listBusinessDomains`から有効なarea一覧を取得
   - セレクトボックス/マルチセレクトを実装
   - デフォルト値を現在の業務領域に設定

**期待効果**:
- ユーザビリティの向上
- 入力ミスの削減

### Phase 4: 型定義の厳密化（オプション）

**目的**: 型レベルで有効なareaを保証する

**手順**:
1. `BusinessArea`型をUnion型に変更
2. 既存コードとの互換性を確認

**期待効果**:
- コンパイル時のエラー検出
- リファクタリングの安全性向上

---

## 6. 補足情報

### business_domainsマスターの構造

| カラム | 型 | 説明 |
|--------|-----|------|
| area | text | PK, 業務領域コード（AR/AP/GL） |
| name | text | 業務名 |
| summary | text | 業務概要 |
| project_id | text | プロジェクトID |

### conceptsテーブルの構造

| カラム | 型 | 説明 |
|--------|-----|------|
| id | text | PK, C-##### 形式 |
| name | text | 概念名 |
| synonyms | text[] | 同義語配列 |
| areas | text[] | 影響するシステム領域（AR/AP/GL） |
| definition | text | 定義 |
| related_docs | text[] | 関連ドキュメント |
| requirement_count | integer | 使用要件数 |
| project_id | text | プロジェクトID |

### 既存概念との照合ロジック

1. 完全一致: 用語名・同義語の小文字でマップ照合
2. 類似一致: LLMで意味的類似度を判定（70%-89%を提示）
3. 新規: 90%以上または70%未満は除外/新規扱い
