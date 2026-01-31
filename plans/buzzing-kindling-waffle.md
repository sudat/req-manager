# /business/[id] ページの ResourceListPage 統一計画

## 概要
`/business/[id]` ページを他の3ページ（`/business`, `/system-domains`, `/system-domains/[id]`）と同じ `ResourceListPage` 共通コンポーネントパターンに統一する。

**難易度: ★★☆**
**根拠: 3 files, 約200行変更, 1コンポーネント追加**

---

## 現状の課題

| ページ | 実装方式 |
|--------|----------|
| `/business` | ResourceListPage ✅ |
| `/system-domains` | ResourceListPage ✅ |
| `/system-domains/[id]` | ResourceListPage ✅ |
| `/business/[id]` | **個別実装** ❌ |

- `/business/[id]` のみテーブルHTMLを直接記述
- カラム定義がページ内にハードコード
- 業務タスク固有の `formatKeySource` 関数（input/output のYAMLパース）が共通化の障壁

---

## 実装方針

`createSystemFunctionListConfig` と同じパターンで `createBusinessTaskListConfig` を実装。

### 設計のポイント
- `formatKeySource` はカラム定義の `cell` 関数内で閉じて処理
- `businessArea` は実行時に決まるため、config生成時の引数として受け取る
- `SortableTaskRow` は廃止し、共通の `SortableResourceRow` を使用

---

## 修正ファイル一覧

| ファイル | 操作 | 変更内容 |
|---------|------|----------|
| `config/resource-lists.tsx` | 修正 | `createBusinessTaskListConfig` 関数を追加 |
| `hooks/use-business-tasks.ts` | 新規作成 | `useBusinessTasks` カスタムフック |
| `app/(with-sidebar)/business/[id]/page.tsx` | 修正 | ResourceListPage を使用するように簡素化 |
| `components/tasks/sortable-task-row.tsx` | 削除検討 | SortableResourceRow に統合のため不要に |

---

## 詳細実装内容

### 1. `config/resource-lists.tsx` に追加

```typescript
// formatKeySource を共通関数として抽出（Task用）
const formatTaskKeySource = (value: string): string => {
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

const businessTaskColumns: ColumnDef<Task & { businessArea: string }>[] = [
  { id: "id", header: "業務タスクID", ... },
  { id: "name", header: "業務タスク", ... },
  { id: "summary", header: "業務概要", ... },
  { id: "input", header: "インプット", cell: (task) => formatTaskKeySource(task.input), ... },
  { id: "output", header: "アウトプット", cell: (task) => formatTaskKeySource(task.output), ... },
];

export const createBusinessTaskListConfig = (
  businessArea: string
): ResourceListConfig<Task & { businessArea: string }> => ({
  title: "業務一覧（詳細）",
  description: "業務領域内の業務タスク（業務プロセスの細分）",
  searchPlaceholder: "業務タスク名、ID、業務概要、inputs/outputsで検索...",
  createHref: `/business/${businessArea}/create`,
  columns: businessTaskColumns,
  actions: (task) => [
    { icon: Eye, label: "照会", href: () => `/business/${businessArea}/${task.id}` },
    { icon: Pencil, label: "編集", href: () => `/business/${businessArea}/${task.id}/edit` },
  ],
  getRowHref: (task) => `/business/${businessArea}/${task.id}`,
  getSearchText: (task) => [task.id, task.name, task.summary, task.input, task.output, ...].join(" "),
  enableReorder: true,
  onReorderSave: async (updates) => {
    const { updateTasksSortOrder } = await import("@/lib/data/tasks");
    return await updateTasksSortOrder(updates);
  },
});
```

### 2. `hooks/use-business-tasks.ts` を新規作成

`useSystemFunctions` と同じパターンで実装：

```typescript
import { useEffect, useState } from "react";
import type { Task } from "@/lib/domain";
import { listTasksByBusinessId, deleteTask } from "@/lib/data/tasks";
import { useProject } from "@/components/project/project-context";

export const useBusinessTasks = (businessId: string) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentProjectId, loading: projectLoading } = useProject();

  // データフェッチ & 削除処理の実装
  // ...

  return { tasks, loading, error, deleteTask: handleDeleteTask, clearError };
};
```

### 3. `app/(with-sidebar)/business/[id]/page.tsx` を簡素化

```typescript
"use client"

import { use } from "react";
import { ResourceListPage } from "@/components/resource-page/resource-list-page";
import { createBusinessTaskListConfig } from "@/config/resource-lists";
import { useBusinessTasks } from "@/hooks/use-business-tasks";
import { useBusinessByKey } from "@/hooks/use-business-by-key";

export default function BusinessTasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: businessKey } = use(params);
  const { businessId, businessArea: resolvedArea, loading: businessLoading } = useBusinessByKey(businessKey);
  const { tasks, loading, error, deleteTask, clearError } = useBusinessTasks(businessId ?? "");

  const routeArea = resolvedArea ?? businessKey;
  const config = createBusinessTaskListConfig(routeArea);

  return (
    <>
      {/* パンくずリストはそのまま維持 */}
      <Breadcrumb>...</Breadcrumb>

      {/* ヘッダーも維持 */}
      <div className="mb-4">
        <h1>業務一覧（詳細）</h1>
        <p>業務領域内の業務タスク</p>
      </div>

      {/* ResourceListPage に委譲 */}
      <ResourceListPage
        items={tasks}
        loading={loading || businessLoading}
        error={error}
        config={config}
        onDelete={deleteTask}
        onClearError={clearError}
      />
    </>
  );
}
```

---

## 機能維持確認

| 機能 | 対応方法 |
|------|----------|
| 検索フィルタ | `config.getSearchText` で再現 |
| 並び替え | `config.enableReorder: true`, `config.onReorderSave` で既存API呼び出し |
| 削除 | `onDelete` prop で既存削除処理 |
| 行クリック | `config.getRowHref` で遷移先定義 |
| `formatKeySource` | カラム定義の `cell` 関数内で処理 |
| AIで追加ボタン | ページ側でカスタムツールバーを維持（ResourceListPageの外側） |

---

## 検証手順

1. ページが正常に表示されること
2. **ヘッダーが1つだけ表示されていること（重複していないこと）**
3. 検索フィルタが動作すること（ID、名前、概要、input/output）
4. 並び替え（ドラッグ&ドロップ）が動作すること
5. 削除ボタンが動作すること
6. 行クリックで詳細画面に遷移すること
7. 照会/編集ボタンが動作すること
8. **「AIで追加」ボタンが表示されていること**

### E2Eテスト項目（Playwright MCP 使用）

```bash
# 1. ページ表示
http://localhost:3000/business/AR

# 2. 検索機能
- 検索ボックスに「業務」と入力 → 絞り込みされること
- 検索クリア → 全件表示されること

# 3. 並び替え
- 行をドラッグ&ドロップ → 順序が変更されること
- ページリロード → 順序が保持されていること

# 4. 削除
- 削除ボタンクリック → 確認ダイアログ表示
- 確認 → レコードが削除されること
```

---

## 問題: ヘッダーが2重に表示されている

### 原因
`ResourceListPage` は常に内部でヘッダー（タイトルと説明）を表示するようになっています。`/business/[id]/page.tsx` では独自のヘッダーとパンくずリストを表示しているため、ヘッダーが2重に表示されています。

### 解決策
`ResourceListPage` に `hideHeader` prop を追加して、ヘッダーを非表示にできるようにします。

### 追加修正ファイル

| ファイル | 操作 | 変更内容 |
|---------|------|----------|
| `components/resource-page/resource-list-page.tsx` | 修正 | `hideHeader` prop を追加し、`true` の場合はヘッダーを非表示にする |
| `app/(with-sidebar)/business/[id]/page.tsx` | 修正 | `ResourceListPage` に `hideHeader={true}` を渡す |

### 詳細実装内容

#### 1. `components/resource-page/resource-list-page.tsx` の修正

```typescript
// props に追加
type ResourceListPageProps<T> = {
  // ... 既存のprops
  /** ヘッダーを非表示にする（ページ側でヘッダーを表示する場合） */
  hideHeader?: boolean;
};

// ヘッダー部分を条件付きレンダリング
export function ResourceListPage<T extends { id: string }>({
  // ... 既存のprops
  hideHeader,
}: ResourceListPageProps<T>) {
  // ...

  return (
    <>
      <MobileHeader />
      <div className="flex-1 min-h-screen bg-white">
        <div className="mx-auto max-w-[1400px] px-8 py-4">
          {/* Page Header - hideHeader が true の場合は非表示 */}
          {!hideHeader && (
            <div className="mb-4">
              {backHref && backLabel && (
                <Link
                  href={backHref}
                  className="inline-flex items-center gap-1 text-[13px] text-slate-600 hover:text-slate-900 mb-3"
                >
                  ← {backLabel}
                </Link>
              )}
              <h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-2">
                {headerTitle || config.title}
              </h1>
              <p className="text-[13px] text-slate-500">{headerDescription || config.description}</p>
            </div>
          )}

          {/* Search Bar */}
          {/* ... */}
        </div>
      </div>
    </>
  );
}
```

#### 2. `app/(with-sidebar)/business/[id]/page.tsx` の修正

```typescript
<ResourceListPage
  items={tasks}
  loading={loading || businessLoading}
  error={error}
  config={config}
  onDelete={deleteTask}
  onClearError={clearError}
  hideHeader={true}  // ← ヘッダーを非表示にする
  extraHeaderActions={[
    {
      label: "AIで追加",
      href: routeArea ? `/chat?screen=BD&bdId=${routeArea}` : "/chat",
      icon: Sparkles,
      variant: "ai",
    },
  ]}
/>
```

---

## Critical Files

- `/usr/local/src/dev/wsl/personal-pj/req-manager/config/resource-lists.tsx`
- `/usr/local/src/dev/wsl/personal-pj/req-manager/hooks/use-business-tasks.ts` (新規)
- `/usr/local/src/dev/wsl/personal-pj/req-manager/app/(with-sidebar)/business/[id]/page.tsx`
- `/usr/local/src/dev/wsl/personal-pj/req-manager/components/resource-page/resource-list-page.tsx`
