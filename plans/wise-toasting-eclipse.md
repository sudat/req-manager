# `/business/AR` ページ UI/UX改善分析

## 対象ページ
- **URL**: `http://localhost:3000/business/AR`
- **画面名**: 業務領域詳細画面（業務タスク一覧）
- **主要ファイル**: `app/(with-sidebar)/business/[id]/page.tsx`

---

## 現状の実装概要

### レイアウト構造
- `ResourceListPage` 汎用コンポーネントを使用
- テーブルベースのリスト表示（カードではない）
- `max-w-[1400px]` 固定幅コンテナ
- パンくずリスト、タイトル、検索バー、テーブル

### カラム構成
| カラム | 内容 |
|--------|------|
| 業務タスクID | フォント: mono 12px, slate-400 |
| 業務タスク | 14px medium slate-900 |
| 業務概要 | truncate max-w-[300px] |
| インプット | truncate max-w-[150px] |
| アウトプット | truncate max-w-[150px] |
| 操作 | 8x8px アイコンボタン |

---

## UI/UX改善分析（優先度順）

### 🔴 CRITICAL: 必須対応

#### 1. タッチターゲットサイズ不足
**問題**: 操作ボタン（Eye/Pencil/Trash2）が `h-8 w-8` (32px) で、推奨最小サイズ 44x44px を下回っている。

**現状**:
```tsx
<Button variant="ghost" size="icon" className="h-8 w-8">
```

**改善案**:
```tsx
<Button variant="ghost" size="icon" className="h-11 w-11">  // 44px
```

**影響**: モバイル/タブレットでの誤操作リスク増大

---

#### 2. キーボードナビゲーション不完全
**問題**: テーブル行がクリック可能だが、キーボード（Enter/Space）で操作できない。

**現状**:
```tsx
<TableRow className="cursor-pointer" onClick={handleClick}>
```

**改善案**:
```tsx
<TableRow
  className="cursor-pointer"
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  tabIndex={0}
  role="button"
>
```

**影響**: キーボードユーザー、スクリーンリーダーユーザーが行操作不可

---

### 🟠 HIGH: 推奨対応

#### 3. テーブルの横スクロール問題
**問題**: モバイルでテーブル幅が画面幅を超える場合、横スクロールがない（truncateで隠蔽）。

**現状**: 各カラムが `truncate` で切り捨て
**改善案**:
- カードビューへの切り替えオプション追加
- または `overflow-x-auto` で横スクロール許可

**影響**: モバイルでの情報量低下

---

#### 4. 空状態のデザイン改善
**問題**: 空状態のメッセージが素っ気ない。アクション誘導がない。

**現状**:
```tsx
<TableCell colSpan={6} className="text-center text-slate-500">
  該当する業務タスクがありません。
</TableCell>
```

**改善案**:
```tsx
<div className="flex flex-col items-center justify-center py-16">
  <FileText className="h-12 w-12 text-slate-300 mb-4" />
  <p className="text-slate-600 mb-4">業務タスクがまだ登録されていません</p>
  <div className="flex gap-2">
    <Button onClick={() => router.push('/chat?...')}>AIで追加</Button>
    <Button variant="outline" onClick={() => router.push('/business/.../create')}>手動で追加</Button>
  </div>
</div>
```

**影響**: 初回訪問時のUX低下、アクション迷子

---

#### 5. テーブルのアクセシビリティ属性不足
**問題**: テーブルに `aria-label` / `caption` / `aria-sort` がない。

**改善案**:
```tsx
<Table aria-label="業務タスク一覧">
  <caption className="sr-only">業務領域ARの業務タスク一覧</caption>
  ...
</Table>
```

---

### 🟡 MEDIUM: あれば良い改善

#### 6. フォントサイズのレスポンシブ対応
**問題**: フォントサイズが固定（`text-[14px]` 等）で、モバイルでは読みづらい可能性。

**改善案**:
```tsx
// 現状
text-[14px]
// 改善
text-sm md:text-base
```

---

#### 7. 行のホバー状態強化
**問題**: ホバー時は `bg-slate-50` のみで、アクション可能なことが視覚的に伝わりにくい。

**現状**:
```tsx
hover:bg-slate-50
```

**改善案**:
```tsx
hover:bg-slate-50 hover:shadow-sm hover:border-l-2 hover:border-l-primary
```

---

#### 8. アクションボタンの配置
**問題**: アクションボタンが常に表示され、視覚ノイズになっている。

**改善案**: 行ホバー時のみ表示
```tsx
<div className="opacity-0 group-hover:opacity-100 transition-opacity">
  {/* アクションボタン */}
</div>
```

---

### 🟢 LOW: 将来的な改善

#### 9. カードビュー/テーブルビュー切り替え
**改善案**: ビュー切り替えトグルを追加し、ユーザー好みに合わせた表示を選択可能に

#### 10. 一括選択・一括操作
**改善案**: チェックボックスで複数行選択し、一括削除等の操作を可能に

---

## 推奨対応優先順位

| 優先度 | 項目 | 工数 | 影響範囲 |
|--------|------|------|----------|
| 1 | タッチターゲットサイズ | 0.5h | アクセシビリティ・モバイル |
| 2 | キーボードナビゲーション | 1h | アクセシビリティ |
| 3 | 空状態デザイン | 1h | 初回UX |
| 4 | テーブルaria属性 | 0.5h | アクセシビリティ |
| 5 | モバイル対応（横スクロール/カード） | 2h | レスポンシブ |

---

## 選択された対応範囲

**CRITICAL + 空状態改善**（工数目安: 2.5h）

---

## 実装計画

### Task 1: タッチターゲットサイズ改善（0.5h）

**対象ファイル**: `components/resource-page/sortable-resource-row.tsx`

**変更内容**:
```tsx
// Before
<Button variant="ghost" size="icon" className="h-8 w-8">

// After
<Button variant="ghost" size="icon" className="h-11 w-11">
```

**注意点**:
- アイコンサイズも調整が必要: `h-4 w-4` → `h-5 w-5`
- `sortable-resource-row.tsx` のみ修正（他のページは `ResourceListPage` 経由で影響）

---

### Task 2: キーボードナビゲーション追加（1h）

**対象ファイル**: `components/resource-page/sortable-resource-row.tsx`

**変更内容**:
```tsx
// TableRow に追加
<TableRow
  className="cursor-pointer border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"
  onClick={() => onRowClick && onRowClick(row)}
  onKeyDown={(e) => {
    if ((e.key === 'Enter' || e.key === ' ') && onRowClick) {
      e.preventDefault();
      onRowClick(row);
    }
  }}
  tabIndex={0}
  role="button"
  aria-label={`${row.name || row.id}の詳細を表示`}
>
```

**注意点**:
- `SortableResourceRow` の props に `onRowClick` が既に存在するか確認
- フォーカスリングのスタイル追加: `focus-visible:ring-2 focus-visible:ring-primary`

---

### Task 3: 空状態デザイン改善（1h）

**対象ファイル**: `components/resource-page/resource-list-page.tsx`

**変更内容**:
空状態用コンポーネントを新規作成:

```tsx
// components/resource-page/empty-state.tsx
interface EmptyStateProps {
  message: string;
  createHref: string;
  aiChatHref?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ message, createHref, aiChatHref, icon }: EmptyStateProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-16">
      {icon || <FileText className="h-12 w-12 text-slate-300 mb-4" />}
      <p className="text-slate-600 mb-6">{message}</p>
      <div className="flex gap-3">
        {aiChatHref && (
          <Button
            onClick={() => router.push(aiChatHref)}
            className="bg-gradient-to-r from-purple-600 to-pink-600"
          >
            AIで追加
          </Button>
        )}
        <Button variant="outline" onClick={() => router.push(createHref)}>
          手動で追加
        </Button>
      </div>
    </div>
  );
}
```

**resource-list-page.tsx での使用**:
```tsx
{displayRows.length === 0 ? (
  <TableBody>
    <TableRow>
      <TableCell colSpan={config.errorColSpan} className="border-0 p-0">
        <EmptyState
          message={config.emptyMessage}
          createHref={config.createHref}
          aiChatHref={config.aiChatHref}  // configに追加が必要
        />
      </TableCell>
    </TableRow>
  </TableBody>
) : (
  // 既存のテーブル表示
)}
```

**config/resource-lists.tsx への追加**:
```tsx
export const createBusinessTaskListConfig = (businessArea: string) => ({
  // ...existing...
  aiChatHref: `/chat?screen=BD&bdId=${businessArea}`,  // 追加
});
```

---

## 検証計画

### 動作確認項目
1. **タッチターゲット**: ブラウザのインスペクタで44px以上を確認
2. **キーボード操作**:
   - Tab で行にフォーカス移動
   - Enter/Space で詳細画面に遷移
   - フォーカスリングが表示される
3. **空状態**:
   - 業務タスク0件の業務領域で表示確認
   - ボタンクリックで遷移確認

### テスト方法
- Playwright MCP または agent-browser でスクリーンショット取得
- キーボード操作のE2Eテスト（任意）

---

## 影響範囲

| 変更 | 影響するページ |
|------|---------------|
| タッチターゲット | 業務タスク一覧、システム機能一覧等（ResourceListPage使用箇所全般） |
| キーボード操作 | 同上 |
| 空状態 | 同上 |

**※ ResourceListPage は汎用コンポーネントのため、修正は他のページにも反映される**

---

## 補足: 既存の良い点

- ✅ パンくずリストあり
- ✅ ボタンに `title` 属性あり
- ✅ 行に `cursor-pointer` あり
- ✅ ドラッグ&ドロップ並び替え対応
- ✅ 検索機能あり
