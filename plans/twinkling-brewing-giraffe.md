# 業務タスク一覧：ドラッグアンドドロップによる並び替え機能の実装

## 概要

業務タスク一覧画面（`/business/[id]`）にドラッグアンドドロップによる並び替え機能を追加します。

- **「並び替え」ボタン**で並び替えモードに切り替え
- **ドラッグ操作**で行の順序を変更
- **「保存」ボタン**で新しい順序をデータベースに永続化
- **「キャンセル」ボタン**で変更を破棄

---

## 難易度評価

```
難易度: ★★☆ / ★★★
根拠: 5 files, 250行程度の変更, 2新規コンポーネント
リスク: 既存の表示・編集機能への影響最小
```

---

## 技術選定

| ライブラリ | 用途 |
|-----------|------|
| `@dnd-kit/core` | コアDnD機能 |
| `@dnd-kit/sortable` | ソータブルリスト機能 |
| `@dnd-kit/utilities` | CSS変換ユーティリティ |

---

## 実装ステップ

### Step 1: ライブラリインストール

```bash
bun add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

### Step 2: データベース関数の追加

**ファイル**: `supabase/migrations/20260131000000_tasks_sort_order_update.sql`

```sql
-- 業務タスクの並び順を一括更新するRPC関数
CREATE OR REPLACE FUNCTION update_tasks_sort_order(
  p_updates JSONB,
  p_project_id TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  WITH updates AS (
    SELECT
      (elem->>'task_id')::TEXT as task_id,
      (elem->>'new_sort_order')::INTEGER as new_sort_order
    FROM jsonb_array_elements(p_updates) elem
  )
  UPDATE business_tasks
  SET sort_order = updates.new_sort_order,
      updated_at = NOW()
  FROM updates
  WHERE business_tasks.id = updates.task_id
    AND (p_project_id IS NULL OR business_tasks.project_id::TEXT = p_project_id);
END;
$$;
```

---

### Step 3: データレイヤー関数の追加

**ファイル**: `lib/data/tasks.ts` に以下を追加

```typescript
export type TaskSortOrderUpdate = {
  id: string;
  sortOrder: number;
};

export const updateTasksSortOrder = async (
  updates: TaskSortOrderUpdate[],
  projectId?: string
): Promise<DataResult<boolean>> => {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  const { error } = await supabase.rpc('update_tasks_sort_order', {
    p_updates: JSON.stringify(updates.map(u => ({
      task_id: u.id,
      new_sort_order: u.sortOrder,
    }))),
    p_project_id: projectId,
  });

  if (error) return { data: null, error: error.message };
  return { data: true, error: null };
};
```

---

### Step 4: APIルートの作成

**ファイル**: `app/api/business/tasks/reorder/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { updateTasksSortOrder } from "@/lib/data/tasks";

export async function POST(request: NextRequest) {
  try {
    const { updates, projectId } = await request.json();

    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: "updates must be an array" },
        { status: 400 }
      );
    }

    const { data, error } = await updateTasksSortOrder(updates, projectId);

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
```

---

### Step 5: ソータブル行コンポーネントの作成

**ファイル**: `components/tasks/sortable-task-row.tsx` (新規)

```typescript
"use client"

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import type { Task } from "@/lib/domain";
import { stripMarkdown } from "@/lib/utils";
import { parseYamlKeySourceList } from "@/lib/utils/yaml";

interface SortableTaskRowProps {
  task: Task;
  businessArea: string;
  onRowClick: () => void;
  onDelete: () => void;
}

export function SortableTaskRow({
  task,
  businessArea,
  onRowClick,
  onDelete,
}: SortableTaskRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatKeySource = (value: string) => {
    const parsed = parseYamlKeySourceList(value);
    const items = parsed.value.filter((item) => item.name || item.source);
    if (items.length === 0) return value;
    return items
      .map((item) => {
        const name = item.name || "—";
        const source = item.source ? ` / ${item.source}` : "";
        return `${name}${source}`;
      })
      .join(" | ");
  };

  const inputLabel = formatKeySource(task.input);
  const outputLabel = formatKeySource(task.output);

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"
    >
      {/* ドラッグハンドル列 */}
      <TableCell className="w-10 px-2 py-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600"
          aria-label="ドラッグして並び替え"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </TableCell>
      <TableCell className="px-4 py-3">
        <span className="font-mono text-[12px] text-slate-400">{task.id}</span>
      </TableCell>
      <TableCell className="px-4 py-3">
        <span className="text-[14px] font-medium text-slate-900">{task.name}</span>
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="max-w-[300px] truncate text-[13px] text-slate-600" title={stripMarkdown(task.summary)}>
          {stripMarkdown(task.summary)}
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="max-w-[150px] truncate text-[13px] text-slate-600" title={inputLabel}>
          {inputLabel}
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="max-w-[150px] truncate text-[13px] text-slate-600" title={outputLabel}>
          {outputLabel}
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Link href={`/business/${businessArea}/${task.id}`}>
            <Button size="icon" variant="outline" title="照会" className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/business/${businessArea}/${task.id}/edit`}>
            <Button size="icon" variant="outline" title="編集" className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <Button size="icon" variant="outline" title="削除" className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
```

---

### Step 6: メインページの修正

**ファイル**: `app/(with-sidebar)/business/[id]/page.tsx`

#### 追加するimport

```typescript
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableTaskRow } from "@/components/tasks/sortable-task-row";
import { Loader2 } from "lucide-react";
```

#### 追加するstate

```typescript
const [isReorderMode, setIsReorderMode] = useState(false);
const [reorderedItems, setReorderedItems] = useState<Task[]>([]);
const [isSaving, setIsSaving] = useState(false);
```

#### 追加するハンドラー関数

```typescript
// 並び替えモード開始
const handleEnterReorderMode = () => {
  setReorderedItems(filtered);
  setIsReorderMode(true);
  setQuery(""); // 検索フィルタをクリア
};

// ドラッグ終了時の処理
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  setReorderedItems((items) => {
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    return arrayMove(items, oldIndex, newIndex);
  });
};

// 並び替え保存
const handleSaveReorder = async () => {
  setIsSaving(true);
  try {
    const updates = reorderedItems.map((task, index) => ({
      id: task.id,
      sortOrder: index,
    }));

    const response = await fetch("/api/business/tasks/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates, projectId: currentProjectId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "保存に失敗しました");
    }

    // 成功：データを再読み込み
    const { data: taskRows, error: taskError } = await listTasksByBusinessId(businessId!, currentProjectId);
    if (taskError) {
      alert("保存しましたが、データの再読み込みに失敗しました");
    } else {
      setItems(taskRows ?? []);
    }
    setIsReorderMode(false);
  } catch (error) {
    alert(error instanceof Error ? error.message : "保存に失敗しました");
  } finally {
    setIsSaving(false);
  }
};

// 並び替えキャンセル
const handleCancelReorder = () => {
  setReorderedItems([]);
  setIsReorderMode(false);
};
```

#### ツールバーにボタン追加

```typescript
{/* 既存の「新規作成」ボタンの後に追加 */}
{!isReorderMode ? (
  <Button
    onClick={handleEnterReorderMode}
    disabled={filtered.length < 2}
    className="h-8 gap-2 text-[14px]"
  >
    並び替え
  </Button>
) : (
  <>
    <Button
      onClick={handleSaveReorder}
      disabled={isSaving}
      className="h-8 gap-2 text-[14px]"
    >
      {isSaving ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          保存中...
        </>
      ) : (
        "保存"
      )}
    </Button>
    <Button
      onClick={handleCancelReorder}
      disabled={isSaving}
      variant="outline"
      className="h-8 gap-2 text-[14px]"
    >
      キャンセル
    </Button>
  </>
)}
```

#### 検索入力を並び替えモード時に無効化

```typescript
<input
  type="text"
  placeholder="業務タスク名、ID、業務概要、inputs/outputsで検索..."
  value={query}
  onChange={(event) => setQuery(event.target.value)}
  disabled={isReorderMode}
  className={cn(
    "w-full pl-10 pr-3 py-1.5 bg-transparent border-0 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none",
    isReorderMode && "opacity-50 cursor-not-allowed"
  )}
/>
```

#### テーブルの条件レンダリング

```tsx
{/* 既存のテーブル部分を置き換え */}
{isReorderMode ? (
  // 並び替えモードのテーブル
  <div className="rounded-md border border-slate-200 bg-white overflow-hidden">
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={reorderedItems.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-200">
              <TableHead className="w-10 px-2 py-3"></TableHead>
              <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">業務タスクID</TableHead>
              <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">業務タスク</TableHead>
              <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">業務概要</TableHead>
              <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">インプット</TableHead>
              <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">アウトプット</TableHead>
              <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reorderedItems.map((task) => (
              <SortableTaskRow
                key={task.id}
                task={task}
                businessArea={routeArea}
                onRowClick={() => handleRowClick(task.id)}
                onDelete={() => handleDelete(task)}
              />
            ))}
          </TableBody>
        </Table>
      </SortableContext>
    </DndContext>
  </div>
) : (
  // 既存の通常テーブル（filtered.mapでレンダリング）
  <div className="rounded-md border border-slate-200 bg-white overflow-hidden">
    <Table>
      {/* 既存のテーブル構造 */}
    </Table>
  </div>
)}
```

---

## 修正ファイル一覧

| ファイル | 変更内容 |
|---------|----------|
| `package.json` | `@dnd-kit` パッケージ追加 |
| `supabase/migrations/20260131000000_tasks_sort_order_update.sql` | **新規**: RPC関数 |
| `lib/data/tasks.ts` | `updateTasksSortOrder`関数追加 |
| `app/api/business/tasks/reorder/route.ts` | **新規**: APIルート |
| `components/tasks/sortable-task-row.tsx` | **新規**: ソータブル行コンポーネント |
| `app/(with-sidebar)/business/[id]/page.tsx` | 並び替えモード追加 |

---

## 動作フロー

1. **初期状態**: 通常のテーブル表示、検索可能
2. **「並び替え」クリック**:
   - 検索フィルタが無効化
   - ドラッグハンドル列が表示
   - ボタンが「保存」「キャンセル」に変化
3. **ドラッグ操作**:
   - 行をドラッグして順序を変更
   - リアルタイムでプレビュー
4. **「保存」クリック**:
   - 一括更新APIを呼び出し
   - 成功ならデータ再読み込みして通常モードへ
5. **「キャンセル」クリック**:
   - 変更破棄して通常モードへ

---

## エッジケース対応

| ケース | 対応 |
|--------|------|
| 空リスト | 「並び替え」ボタンをdisabled |
| 1件のみ | 「並び替え」ボタンをdisabled |
| 検索中 | 並び替えモード開始時に検索クリア |
| 保存中 | ボタンをdisabled、ローダー表示 |
| 保存失敗 | エラーメッセージ表示、並び替えモード維持 |

---

## 検証手順

1. ライブラリをインストール
2. マイグレーションを適用
3. コードを修正
4. 以下の手順で動作確認：

```
1. 業務タスク一覧画面を開く
2. 「並び替え」ボタンが表示されることを確認
3. 「並び替え」クリックでドラッグハンドルが表示される
4. 行をドラッグして順序を変更できる
5. 「保存」クリックで順序が永続化される
6. ページを再読み込みしても順序が維持される
7. 「キャンセル」で変更が破棄される
8. 検索フィルタが並び替えモード時に無効化される
```

---

## 事後検証（E2Eテスト）

`e2e-testing` スキルを使用して動作確認を実施：

```bash
# 実装完了後に実行
/e2e-testing
```

確認項目：
- ドラッグアンドドロップ操作
- 保存機能の動作
- キャンセル機能の動作
- 検索フィルタとの併用制限

---

## トラブルシューティング

### エラー: `Could not find the function public.update_tasks_sort_order`

**原因**: マイグレーションがデータベースに適用されていない

**解決方法**: 以下のいずれかの方法でマイグレーションを適用する

#### 方法1: Supabase MCPを使用する（推奨）

```typescript
// MCP経由でマイグレーションを適用
mcp__plugin_supabase_supabase__apply_migration({
  migration_file: "supabase/migrations/20260131000000_tasks_sort_order_update.sql"
})
```

または、既存のマイグレーションを確認して適用：

1. `list_migrations` で現在のマイグレーション状況を確認
2. `apply_migration` で新しいマイグレーションを適用

#### 方法2: Supabaseダッシュボードから直接SQLを実行

1. Supabaseダッシュボードにアクセス
2. SQL Editor を開く
3. 以下のSQLを実行：

```sql
-- 業務タスクの並び順を一括更新するRPC関数
CREATE OR REPLACE FUNCTION update_tasks_sort_order(
  p_updates JSONB,
  p_project_id TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  WITH updates AS (
    SELECT
      (elem->>'task_id')::TEXT as task_id,
      (elem->>'new_sort_order')::INTEGER as new_sort_order
    FROM jsonb_array_elements(p_updates) elem
  )
  UPDATE business_tasks
  SET sort_order = updates.new_sort_order,
      updated_at = NOW()
  FROM updates
  WHERE business_tasks.id = updates.task_id
    AND (p_project_id IS NULL OR business_tasks.project_id::TEXT = p_project_id);
END;
$$;
```

#### 方法3: Supabase CLIを使用する

```bash
supabase db push
```

---

## 検証チェックリスト

マイグレーション適用後、以下を確認：

- [ ] Supabaseダッシュボードで関数 `update_tasks_sort_order` が作成されている
- [ ] `list_migrations` でマイグレーション履歴に `20260131000000` が含まれている
- [ ] 「並び替え」→「保存」が正常に動作する
- [ ] 保存後にデータの順序が維持されている
