# コード簡素化計画

## 対象範囲

### 1. リストページのDRY違反解消
- `app/business/page.tsx` (247行)
- `app/system-domains/page.tsx` (224行)
- `app/ideas/page.tsx` (250行)

**現状**: 3ファイルがほぼ同じ構造で重複

**目標**: 汎用 `ResourceListPage` コンポーネント + 設定オブジェクトで統一

### 2. タスク詳細ページの簡素化
- `app/business/[id]/tasks/[taskId]/page.tsx` (342行)

**現状**: データフェッチ、状態管理、ヘルススコア計算、レンダリングが混在

**目標**: カスタムフック・小コンポーネント分割・ユーティリティ抽出

---

## 実装ステップ

### Phase 1: リストページ統合

#### 1.1 共通フックの作成
- **ファイル**: `hooks/use-resource-list.ts` (新規)
- **内容**: リストページ共通の状態管理・フィルタリング・ページネーション
- **抽出元**: 既存3ページの共通ロジック

#### 1.2 汎用テーブルコンポーネント
- **ファイル**: `components/resource-table/resource-table.tsx` (新規)
- **内容**: カラム設定ベースの汎用テーブル
- **機能**: ソート、フィルタ、アクションボタン

#### 1.3 汎用ページコンポーネント
- **ファイル**: `components/resource-page/resource-list-page.tsx` (新規)
- **内容**: ツールバー + テーブル + ページネーション

#### 1.4 設定オブジェクト
- **ファイル**: `config/resource-lists.ts` (新規)
- **内容**: 各リソース（business/system-domains/ideas）のカラム・アクション定義

#### 1.5 既存ページの置き換え
- 3ファイルを `ResourceListPage` 使用に書き換え
- **期待削減行数**: 約400行

---

### Phase 2: タスク詳細ページ分割

#### 2.1 データフェッチフック
- **ファイル**: `hooks/use-task-detail.ts` (新規)
- **内容**: タスク・関連要件のデータ取得
- **既存コード**: page.tsx の fetch 関数群

#### 2.2 ヘルススコア計算
- **ファイル**: `lib/utils/health-score.ts` (新規)
- **内容**: ヘルススコア計算ロジック
- **既存コード**: page.tsx 内のインライン計算

#### 2.3 コンポーネント分割
- **ファイル**: `components/task-detail/task-header.tsx` (新規)
- **ファイル**: `components/task-detail/task-summary.tsx` (新規)
- **ファイル**: `components/task-detail/task-requirements.tsx` (新規)
- **既存コード**: page.tsx の JSX 各セクション

#### 2.4 本体簡素化
- page.tsx をフック + コンポーネント呼び出しのみに
- **期待行数**: 342行 → 100行程度

---

## 変更ファイル一覧

### 新規作成
- `hooks/use-resource-list.ts`
- `components/resource-table/resource-table.tsx`
- `components/resource-table/resource-table-toolbar.tsx`
- `components/resource-page/resource-list-page.tsx`
- `config/resource-lists.ts`
- `hooks/use-task-detail.ts`
- `lib/utils/health-score.ts`
- `components/task-detail/task-header.tsx`
- `components/task-detail/task-summary.tsx`
- `components/task-detail/task-requirements.tsx`

### 変更
- `app/business/page.tsx`
- `app/system-domains/page.tsx`
- `app/ideas/page.tsx`
- `app/business/[id]/tasks/[taskId]/page.tsx`

---

## 検証方法

### Playwright MCP で動作確認
1. **リストページ**: business, system-domains, ideas の各一覧画面で
   - 検索が動作する
   - フィルタが動作する
   - ページネーションが動作する
   - アクションボタン（作成、削除）が動作する

2. **タスク詳細ページ**:
   - タスク情報が表示される
   - ヘルススコアが正しく計算される
   - 関連要件が表示される
   - 編集・削除ボタンが動作する

### 手動テスト項目
- [ ] 各リストページで表示・検索・フィルタ・ページネーション
- [ ] タスク詳細で全情報表示
- [ ] TypeScriptエラーなし
- [ ] Lintエラーなし

---

## 難易度評価

**難易度**: ★★☆ / ★★★

**根拠**:
- 14 files 変更/新規
- 推定 600-700 lines 変更
- 4 components 連携（リストページ統合）+ 4 components（タスク詳細分割）

**リスク**:
- 複数ページに影響するリファクタリングのため、回帰テスト必須
- 設計ミスがあると再度大規模修正が必要

**成功条件**:
- 振る舞いが完全に維持されている
- 行数が大幅に削減されている（合計-500行以上）
- 重複が排除されている（DRY）
