# システム領域一覧の操作アイコン修正計画

## 概要
`/system`ページの操作アイコンを`/business`ページに合わせて統一し、削除機能を追加する。

## 現状の違い

| 項目 | `/system`（現状） | `/business`（目標） |
|------|-------------------|---------------------|
| 照会アイコン | 👁（絵文字） | Eye（lucide-react） |
| 編集アイコン | ✏（絵文字） | Pencil（lucide-react） |
| 削除アイコン | **なし** | Trash2（lucide-react） |

## 難易度
```
難易度: ★☆☆
根拠: 1 file, 約20 lines, 0 components
リスク: 低（UI変更のみ、既存機能への影響なし）
```

## 修正対象ファイル
- `app/(with-sidebar)/system-domains/page.tsx`

## 修正内容

### 1. lucide-reactアイコンの追加インポート（6行目）
```tsx
// Before
import { Search, Plus, AlertCircle } from "lucide-react";

// After
import { Search, Plus, AlertCircle, Eye, Pencil, Trash2 } from "lucide-react";
```

### 2. 操作アイコンの変更（265-287行目）
絵文字を lucide-react アイコンに変更し、削除ボタンを追加：

```tsx
<div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
  {/* 照会ボタン */}
  <Link href={`/system/${domain.id}`}>
    <Button size="icon" variant="outline" className="..." title="照会">
      <Eye className="h-4 w-4" />
    </Button>
  </Link>
  {/* 編集ボタン */}
  <Link href={`/system/${domain.id}/edit`}>
    <Button size="icon" variant="outline" className="..." title="編集">
      <Pencil className="h-4 w-4" />
    </Button>
  </Link>
  {/* 削除ボタン（新規追加） */}
  <Button
    size="icon"
    variant="outline"
    className="... hover:bg-rose-600 hover:text-white hover:border-rose-600"
    title="削除"
    onClick={() => handleDelete(domain.id, domain.name)}
  >
    <Trash2 className="h-4 w-4" />
  </Button>
</div>
```

### 3. 削除処理関数の追加
`SystemDomainsPageContent`コンポーネント内に削除ハンドラを追加：

```tsx
const handleDelete = async (id: string, name: string) => {
  if (!confirm(`「${name}」を削除しますか？この操作は取り消せません。`)) {
    return;
  }
  const { error } = await deleteSystemDomain(id);
  if (error) {
    alert(`削除に失敗しました: ${error}`);
    return;
  }
  // リストから削除した項目を除外して再描画
  setItems((prev) => prev.filter((item) => item.id !== id));
};
```

## 検証方法
1. `bun run dev` でローカルサーバー起動
2. Playwright MCPで `/system` ページにアクセス
3. 以下を確認：
   - 照会・編集・削除の3つのアイコンが表示されること
   - アイコンがlucide-reactスタイル（SVGアイコン）であること
   - 削除ボタンクリック時に確認ダイアログが表示されること
   - 削除実行後、一覧から該当項目が消えること
