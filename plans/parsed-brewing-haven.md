# AI修正指示機能の削除

## 概要
`/business/[id]/ai-order` ページと、業務一覧ページの「AI修正指示」ボタンを削除する。

## 削除対象

### 1. AI修正指示ボタンの削除
**ファイル**: `app/(with-sidebar)/business/[id]/page.tsx`

削除対象（178-183行目）:
```tsx
<Link href={`/business/${routeArea}/ai-order`}>
  <Button className="h-8 gap-2 text-[14px] bg-slate-900 hover:bg-slate-800">
    <Sparkles className="h-4 w-4" />
    AI修正指示
  </Button>
</Link>
```

### 2. AI修正指示ページの削除
**ファイル**: `app/(with-sidebar)/business/[id]/ai-order/page.tsx`

- ファイル全体を削除（211行）

## 影響範囲
- `ai-order` の文字列を検索した結果、上記2ファイル以外に参照なし
- `Sparkles` アイコンは「AIで追加」ボタンでも使用中のため、インポートは残る

## 実装手順
1. `app/(with-sidebar)/business/[id]/page.tsx` から178-183行目を削除
2. `app/(with-sidebar)/business/[id]/ai-order/page.tsx` を削除

## 検証方法
1. 開発サーバー起動後、`http://localhost:3000/business/AR` にアクセス
2. 「AI修正指示」ボタンが表示されていないことを確認
3. 「新規作成」「AIで追加」ボタンは正常に動作することを確認
