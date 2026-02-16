# 削除確認ダイアログのUI改善

## コンテキスト
業務一覧画面（`/business`）の削除確認ダイアログが、プロジェクト一覧画面（`/projects`）のモダンなダイアログと比べて「しょぼい」との指摘があり、UI統一を目的とした改善。

## 現状の課題

| 画面 | 実装 | UI品質 |
|------|------|--------|
| プロジェクト一覧 | shadcn/ui `Dialog` コンポーネント | アラートアイコン、適切なボタン配置 |
| 業務一覧 | `window.confirm()` | シンプルなブラウザ標準ダイアログ |

## 既存の実装

**業務一覧（`components/resource-page/resource-list-page.tsx`）:**
```typescript
import { confirmDelete } from "@/lib/ui/confirm";

// handleDelete関数内
const itemLabel = config.getSearchText(item).split(" ")[0];
if (!confirmDelete(itemLabel)) return;
```

**`lib/ui/confirm.ts`:**
```typescript
export const confirmDelete = (label: string) => {
  return window.confirm(`${label}を削除します。よろしいですか？`);
};
```

**プロジェクト一覧（`app/(with-sidebar)/projects/page.tsx`）:**
- `Dialog` コンポーネントでモーダンな削除確認ダイアログを実装
- アラートアイコン（`AlertTriangle`）
- 説明文（「このプロジェクトを削除してもよろしいですか？ プロジェクトに関連するすべてのデータが削除される可能性があります。」）
- キャンセル・削除ボタンの適切な配置

## 改善方針

### 1. 共通削除確認ダイアログコンポーネントの作成

`components/ui/confirm-dialog.tsx` を新規作成し、プロジェクト一覧と同じモダンなダイアログを共通コンポーネントとして提供する。

#### 機能要件
- shadcn/ui `Dialog` コンポーネントを使用
- アラートアイコン（`AlertTriangle`）を表示
- タイトル、説明文、キャンセル・削除ボタンをpropsで渡せる
- 削除中のローディング状態表示

#### インターフェース
```typescript
interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string | React.ReactNode
  onConfirm: () => void | Promise<void>
  confirmLabel?: string;  // デフォルト: "削除"
  cancelLabel?: string;  // デフォルト: "キャンセル"
  loading?: boolean;
}
```

### 2. 既存コードの置き換え

#### 対象ファイル
1. `components/resource-page/resource-list-page.tsx`
2. `lib/ui/confirm.ts` - 削除または `confirm-dialog` への委譲

#### 変更内容
- `confirmDelete()` 関数の代わりに `ConfirmDialog` コンポーネントを使用
- 状態管理: `deleteDialogOpen`, `itemToDelete`, `isDeleting` を追加
- `handleDeleteClick()`: 削除ボタンクリックでダイアログを表示
- `handleDeleteConfirm()`: 実際の削除処理を実行
- **重要**: `ConfirmDialog` に `alert={true}` propを渡してアラートアイコンを表示

### 3. 他のリソース一覧画面への適用

以下の画面も `ResourceListPage` を使用しているため、同じ改善が自動的に適用されます：
- システム領域一覧 (`/system`)
- 変更要求一覧 (`/tickets`)
- その他リソース一覧ページ

## UIデザイン

### レイアウト
```
┌─────────────────────────────────────┐
│ [アイコン] タイトル           │
│                                 │
│ 説明文                         │
│                                 │
│         [キャンセル] [削除]     │
└─────────────────────────────────────┘
```

### スタイル
- `AlertDialog` コンポーネント（shadcn/ui）を使用
- アラート色（`text-rose-600`）のアイコン
- 削除ボタン: `variant="destructive"`（赤色）
- キャンセルボタン: `variant="outline"`

## 検証計画
1. 業務領域を削除し、モーダンなダイアログが表示されることを確認
2. キャンセルでダイアログが閉じることを確認
3. 削除ボタンで削除が実行され、トーストが表示されることを確認
4. 他のリソース一覧画面（システム領域など）でも同じ動作になることを確認

## 既知の問題と修正（2026-02-12 発生）

### 問題
削除確認ダイアログが出ていない（`alert={true}` propが渡っていないためアラートアイコンが表示されない）

### 修正
`resource-list-page.tsx` で `ConfirmDialog` を使用する際に、`alert={true}` propを明示的に渡すように変更

## 備考
- 削除確認ダイアログは他の画面でも使われる可能性があるため、共通コンポーネントとして実装する
- `window.confirm()` は使用を中止し、プロジェクト一覧と同じUI体験を提供する
