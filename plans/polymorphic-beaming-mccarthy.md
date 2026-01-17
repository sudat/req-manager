# TableSkeleton の行の高さ調整

## 課題
`/business` と `/system-domains` ページのテーブルスケルトンで、行の高さが実際のデータ行より低く、違和感がある。

## 原因
- **データ行**: `TableCell` に `px-4 py-3` を指定
- **スケルトン行**: デフォルトの `TableCell`（`p-2`）を使用 + Skeleton `h-6`

## 修正内容

### 対象ファイル
- `components/skeleton/table-skeleton.tsx`

### 変更点
1. `TableCell` に `px-4 py-3` の className を追加
2. `Skeleton` の高さを `h-6` → `h-4` に変更

### 修正後のイメージ
```tsx
export function TableSkeleton({ cols, rows = 5 }: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <TableCell key={j} className="px-4 py-3">
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
```

## 影響範囲
`TableSkeleton` コンポーネント自体を修正したため、以下のすべてのページに自動適用されます：

| ページ | ルート |
|--------|--------|
| 業務一覧 | `/business` |
| システム領域一覧 | `/system-domains` |
| 業務タスク | `/business/[id]/tasks` |
| システム領域詳細 | `/system-domains/[id]` |
| アイデア一覧 | `/ideas` |

## 検証方法
1. http://localhost:3000/business にアクセス
2. ローディング状態でスケルトンが表示されることを確認（高さを視覚確認）
3. データ読み込み後の行の高さとスケルトンの行の高さが揃っていることを確認
4. http://localhost:3000/system-domains でも同様に確認
5. （必要に応じて）`/ideas`、`/business/[id]/tasks`、`/system-domains/[id]` も確認
