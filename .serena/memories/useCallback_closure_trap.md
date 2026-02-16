# useCallback の依存配列トラップ

## 問題
`useCallback` の依存配列に状態変数が含まれていないと、コールバック関数は古い値を参照し続ける。

## 今回のケース
`resource-list-page.tsx` で削除ダイアログの削除ボタンが効かなかった。

### 原因
```typescript
// ❌ 間違い: itemToDelete が依存配列にない
const handleDeleteConfirm = useCallback(
  async () => {
    if (!itemToDelete) return;  // 常に null のまま
    // ... 削除処理
  },
  [onDelete, deleteItem, config, toast],
);
```

### 修正
```typescript
// ✅ 正しい: itemToDelete を依存配列に追加
const handleDeleteConfirm = useCallback(
  async () => {
    if (!itemToDelete) return;
    // ... 削除処理
  },
  [onDelete, deleteItem, config, itemToDelete],
);
```

## 教訓
`useCallback` を使う際は、関数内で使用している**すべての状態変数・props**を依存配列に含める必要がある。

ESLint の `react-hooks/exhaustive-deps` ルールを有効にしておくと、こうした問題を防げる。