# 業務要件カードスケルトンローディング修正計画

## 背景

ユーザーからの報告：
- **URL**: `http://localhost:3002/business/BIZ-001/TASK-001`
- **問題**: 1つ目のカード（与信管理カード）内のスケルトンローディングが動作していない

## 原因分析

### 現在の実装

**`RequirementsSection.tsx` (L35-40)**:
```tsx
{loading && <CardSkeleton />}
{error && <div className="text-[14px] text-rose-600">{error}</div>}
{!loading && !error && items.length === 0 && (
  <div className="text-[14px] text-slate-500">{emptyMessage}</div>
)}
{!loading && !error && items.map(renderItem)}
```

**`useAsyncData.ts` (L18-19)**:
```tsx
const [data, setData] = useState<T[]>([]);      // 初期値: 空配列
const [loading, setLoading] = useState(true);    // 初期値: true
```

### 課題

1. **初期状態の問題**: `loading=true` かつ `items=[]` の状態で、スケルトンが表示されるべきところが、条件分岐の問題で正しく動作していない可能性がある

2. **高速フェッチの問題**: データフェッチが高速で完了した場合、`loading` が `true` から `false` に変わるまでの時間が短すぎて、スケルトンが一瞬も表示されない

3. **`CardSkeleton` の形状**: 現在使用されている `CardSkeleton` は2列グリッドレイアウトだが、`BusinessRequirementCard` は単一カラムの `Collapsible` レイアウトで、形状が一致していない

## 修正方針

### スコープ
- **IN**: `RequirementsSection.tsx` のスケルトンローディング実装を修正
- **OUT**: 新しいスケルトンコンポーネントの作成（既存の `CardSkeleton` を使用）

### 修正パターン

1. **早期returnパターンへの変更**: `loading` 時に早期returnでスケルトンを返すように変更

2. **最小ローディング時間の追加**: データフェッチが高速すぎる場合に備えて、最小ローディング時間（例：300ms）を追加してスケルトンが確実に表示されるようにする

3. **スケルトン複数表示**: 複数のカードを表示する場合は、スケルトンも複数表示する

## 実装計画

### 修正1: RequirementsSection.tsx のロジック変更

**ファイル**: `app/(with-sidebar)/business/[id]/[taskId]/components/RequirementsSection.tsx`

**変更内容**:
```tsx
// 修正前
{loading && <CardSkeleton />}
{error && <div className="text-[14px] text-rose-600">{error}</div>}
{!loading && !error && items.length === 0 && (
  <div className="text-[14px] text-slate-500">{emptyMessage}</div>
)}
{!loading && !error && items.map(renderItem)}

// 修正後
{loading && (
  <>
    <CardSkeleton />
    {items.length > 1 && <CardSkeleton />}
  </>
)}
{!loading && error && <div className="text-[14px] text-rose-600">{error}</div>}
{!loading && !error && items.length === 0 && (
  <div className="text-[14px] text-slate-500">{emptyMessage}</div>
)}
{!loading && !error && items.map(renderItem)}
```

### Critical Files

| ファイルパス | 役割 | 変更内容 |
|-------------|------|----------|
| `app/(with-sidebar)/business/[id]/[taskId]/components/RequirementsSection.tsx` | 業務要件/システム要件セクションの共通コンポーネント | スケルトンローディングの条件分岐を修正 |

## Verification（検証方法）

修正後の検証手順：

1. **動作確認**:
   - `http://localhost:3002/business/BIZ-001/TASK-001` にアクセス
   - ページリロード時にスケルトンが表示されることを確認
   - 高速リロード（Ctrl+Shift+R）でもスケルトンが表示されることを確認

2. **確認ポイント**:
   - スケルトンが表示される時間は適切か（短すぎず、長すぎず）
   - スケルトンの形状が実際のカードに近いか
   - ローディング完了後に正しくカードが表示されるか

### 確認コマンド（参考）

```bash
# 開発サーバー起動
bun run dev

# ブラウザでアクセス
# http://localhost:3000/business/BIZ-001/TASK-001
```

## 注記

- 既存の `CardSkeleton` コンポーネントを使用する
- 新しいスケルトンコンポーネントの作成はスコープ外（将来的な改善として検討可能）
- `RequirementsSection` は業務要件とシステム要件の両方で使用されているため、両方のスケルトンが改善される
