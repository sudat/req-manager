# デザイン調整: DD編集画面の余白最適化

## Context
`/system/[id]/[srfId]/edit/design-documents` ページにて、ユーザーから以下のスタイル調整がフィードバックされました。

1. DesignDocumentCard の左パディングが大きすぎる → `pl-4` を `p-2` に変更
2. カード間の余白が大きすぎる → `my-8` を `my-2` に変更

## 変更内容

### 1. DesignDocumentCard.tsx (301行目)
**ファイル**: `components/forms/design-document/DesignDocumentCard.tsx`

**変更前**:
```tsx
<div className="pl-4 border-l-4 border-indigo-500 bg-slate-50/50 rounded-md p-4">
```

**変更後**:
```tsx
<div className="p-2 border-l-4 border-indigo-500 bg-slate-50/50 rounded-md">
```

- `pl-4`（左16pxパディング）→ `p-2`（全方向8pxパディング）
- 既存の `p-4` を削除して統合

### 2. design-document-list.tsx (103行目)
**ファイル**: `components/forms/design-document-list.tsx`

**変更前**:
```tsx
<div className="border-t-2 border-slate-300 my-8" />
```

**変更後**:
```tsx
<div className="border-t-2 border-slate-300 my-2" />
```

- `my-8`（上下32pxマージン）→ `my-2`（上下8pxマージン）

## 検証方法
1. `/system/GL/SF-GL-0002/edit/design-documents` にアクセス
2. DDカードの左パディングが小さくなっていることを確認
3. DDカード間の余白が小さくなっていることを確認

## リスク
- なし（スタイル調整のみ）
