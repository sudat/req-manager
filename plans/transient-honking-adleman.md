# 業務タスク削除ボタン追加の修正計画

## 問題概要

### バグの原因
`ResourceListPage` コンポーネントで、削除ボタンの表示条件が `deleteItem` prop のみをチェックしており、`onDelete` prop が考慮されていない。

**現象**: `/business/[id]` ページでは `onDelete={deleteTask}` を渡しているが、削除ボタンが表示されない。

### 根本原因
- `handleDelete` 関数（169-174行目）では `onDelete` 優先ロジックが実装されている
- しかし `renderActions` では `deleteItem` のみしかチェックしていない
- この不整合により、ボタン自体が表示されない

---

## 修正範囲

**対象ファイル**: `components/resource-page/resource-list-page.tsx`

### 変更点

#### 1. renderActions 内の削除ボタン表示条件（255-264行目）

```typescript
// 修正前
const deleteAction = deleteItem
    ? [{ icon: Trash2, label: "削除", onClick: () => handleDelete(item), variant: "outline" as const }]
    : [];

// 修正後
const deleteAction = (deleteItem || onDelete)
    ? [{ icon: Trash2, label: "削除", onClick: () => handleDelete(item), variant: "outline" as const }]
    : [];
```

#### 2. useCallback の依存配列（296行目）

```typescript
// 修正前
[config, deleteItem, handleDelete],

// 修正後
[config, deleteItem, onDelete, handleDelete],
```

#### 3. テーブルヘッダーの操作列表示判定（486, 520, 529, 554行目）

```typescript
// 修正前
{(config.actions || deleteItem) && (

// 修正後
{(config.actions || deleteItem || onDelete) && (
```

---

## 影響を受けるページ

### 修正で動作するようになるページ

| ページ | パス | 渡しているprop |
|--------|------|----------------|
| 業務タスク一覧 | `/app/(with-sidebar)/business/[id]/page.tsx` | `onDelete={deleteTask}` |
| システム機能一覧 | `/app/(with-sidebar)/system/[id]/page.tsx` | `onDelete={deleteFunction}` |

### 回帰テストが必要な既存ページ

| ページ | 状態 |
|--------|------|
| 概念辞書 (`/ideas`) | `deleteItem` 使用中。既存動作の維持を確認 |

---

## 検証計画

### 手動テスト（Playwright MCP）

1. **業務タスク一覧で削除ボタンが表示される**
   - URL: `/business/AR`
   - 期待: 各行の操作列にゴミ箱アイコンが表示される

2. **削除フローの動作確認**
   - 削除ボタンクリック → 確認ダイアログ表示
   - 確認後、データが削除され一覧から消える
   - エラー時に alert が表示される

3. **既存ページの回帰テスト**
   - `/ideas` でこれまで通り削除ボタンが動作すること

### E2E テストシナリオ

```typescript
test('業務タスク一覧で削除ボタンが表示される', async ({ page }) => {
  await page.goto('/business/AR');
  const deleteButtons = page.getByRole('button', { name: '削除' });
  await expect(deleteButtons.first()).toBeVisible();
});

test('業務タスクの削除フロー', async ({ page }) => {
  await page.goto('/business/AR');
  page.getByRole('button', { name: '削除' }).first().click();
  // 確認ダイアログを承認
  // 削除後に一覧から消えることを確認
});
```

---

## リスク評価

```
難易度: ★☆☆
根拠: 1 file, ~10 lines, 1 component
リスク: 依存関係が単純で、変更範囲が限定されている
```

### 懸念点
- **低リスク**: `deleteItem` を使用しているページ（Ideas）の動作は変更されない
- **論理的整合性**: `deleteItem || onDelete` は「いずれかが存在すれば」という直感的な条件

---

## Critical Files

- `components/resource-page/resource-list-page.tsx:255-264` - renderActions の削除ボタン表示条件
- `components/resource-page/resource-list-page.tsx:296` - useCallback の依存配列
- `components/resource-page/resource-list-page.tsx:486,520,529,554` - 操作列表示判定
- `app/(with-sidebar)/business/[id]/page.tsx:23` - 修正で動作するようになるページ
- `hooks/use-business-tasks.ts:54-65` - deleteTask 関数の実装
- `lib/ui/confirm.ts:1-3` - confirmDelete ヘルパー
