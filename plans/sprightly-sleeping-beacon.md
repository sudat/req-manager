# 業務一覧（詳細）画面から「業務コンテキスト」列を削除

## 概要
`app/(with-sidebar)/business/[id]/tasks/page.tsx` のテーブルから「業務コンテキスト」列を削除する。

## 変更ファイル
- `app/(with-sidebar)/business/[id]/tasks/page.tsx`

## 変更内容

### 1. テーブルヘッダーから削除（179行目）
```tsx
// 削除
<TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">業務コンテキスト</TableHead>
```

### 2. テーブル行から削除（260-267行目）
```tsx
// 削除
<TableCell className="px-4 py-3">
  <div
    className="max-w-[160px] truncate text-[13px] text-slate-600"
    title={stripMarkdown(task.businessContext)}
  >
    {stripMarkdown(task.businessContext)}
  </div>
</TableCell>
```

### 3. colSpan を 7 → 6 に変更（187, 190, 196行目）
```tsx
// 変更前
<TableCell colSpan={7} ...>

// 変更後
<TableCell colSpan={6} ...>
```

### 4. TableSkeleton の cols を 7 → 6 に変更（187行目）
```tsx
// 変更前
<TableSkeleton cols={7} rows={5} />

// 変更後
<TableSkeleton cols={6} rows={5} />
```

## 検証方法
1. `http://localhost:3000/business/BIZ-001/tasks` にアクセス
2. テーブルに「業務コンテキスト」列が表示されていないことを確認
3. 他の列（業務タスクID、業務タスク、業務概要、インプット、アウトプット、操作）が正しく表示されていることを確認
4. ローディング状態・エラー状態・空状態でも表示が崩れていないことを確認

## 難易度
- **難易度**: ★☆☆
- **根拠**: 1ファイル、4箇所の変更（列ヘッダー削除、セル削除、colSpan調整×2、スケルトン調整）
- **リスク**: 低（テーブル列削除のみでロジック変更なし）
