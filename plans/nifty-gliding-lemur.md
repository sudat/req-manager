# プロジェクト管理機能の追加

## 概要
サイドバーのProjectSwitcherを拡張し、プロジェクトの追加・編集・削除機能を提供する。

## 難易度
```
難易度: ★★☆
根拠: 5 files, 約250 lines, 3 components
リスク: ProjectContextの変更が既存の全ページに影響する可能性（破壊的変更なし）
```

## UXアプローチ: ハイブリッド方式

### 選定理由
1. **サイドバー複雑化の回避**: 新メニュー追加なし
2. **操作頻度に応じたUI**: 高頻度操作（切替）はドロップダウン、低頻度操作（編集・削除）は専用ページ
3. **既存パターンとの整合性**: ResourceListPage, 編集ページパターンを踏襲

### UI構成
```
ProjectSwitcher（ドロップダウン）
  ├── プロジェクト一覧（現行）
  ├── ────────────
  ├── [+] 新規作成 → Dialog（インライン）
  └── [⚙] プロジェクト管理 → /projects
```

## 実装対象

### 修正ファイル

| ファイル | 変更内容 |
|---------|---------|
| `components/project/project-context.tsx` | `refreshProjects` 関数を追加 |
| `components/project/project-switcher.tsx` | ドロップダウンに「新規作成」「管理」を追加、ダイアログ統合 |

### 新規作成ファイル

| ファイル | 内容 |
|---------|------|
| `components/project/project-create-dialog.tsx` | 新規作成ダイアログ（名前・説明入力） |
| `app/projects/page.tsx` | プロジェクト一覧・管理ページ |
| `app/projects/[id]/edit/page.tsx` | プロジェクト編集ページ |

## 実装詳細

### 1. project-context.tsx（修正）
```typescript
// ProjectContextValue に追加
refreshProjects: () => Promise<void>

// 実装
const refreshProjects = async () => {
  const { data } = await listProjects()
  if (data) setProjects(data)
}
```

### 2. project-create-dialog.tsx（新規）
- Dialog + form構造
- フィールド: プロジェクト名（必須）、説明（任意）
- 作成後、自動的に新プロジェクトに切り替え

### 3. project-switcher.tsx（修正）
```tsx
// 追加インポート
import { Plus, Settings } from "lucide-react"
import Link from "next/link"
import { ProjectCreateDialog } from "./project-create-dialog"

// DropdownMenuContent内に追加
<DropdownMenuSeparator />
<DropdownMenuItem onClick={() => setIsCreateOpen(true)}>
  <Plus className="mr-2 h-4 w-4" />
  新規プロジェクト作成
</DropdownMenuItem>
<DropdownMenuItem asChild>
  <Link href="/projects">
    <Settings className="mr-2 h-4 w-4" />
    プロジェクト管理
  </Link>
</DropdownMenuItem>
```

### 4. app/projects/page.tsx（新規）
- ResourceListPageパターンは使わず、シンプルなカード一覧で実装
- 各カードに編集・削除アクション
- 削除制約:
  - 現在選択中のプロジェクトは削除不可
  - 最後の1件は削除不可

### 5. app/projects/[id]/edit/page.tsx（新規）
- 既存編集ページパターン踏襲（Card + form構造）
- フィールド: プロジェクトID（表示のみ）、名前、説明

## 画面遷移フロー
```
サイドバー ProjectSwitcher
       │
       ├──[プロジェクト選択]──→ 選択したプロジェクトに切替
       │
       ├──[新規プロジェクト作成]──→ ダイアログ表示
       │                              │
       │                              └──[作成]──→ 新プロジェクトに切替
       │
       └──[プロジェクト管理]──→ /projects
                                  │
                                  ├──[編集]──→ /projects/[id]/edit
                                  │                 │
                                  │                 └──[保存]──→ /projects
                                  │
                                  └──[削除]──→ 確認ダイアログ → 削除
```

## 実装順序

1. **Phase 1**: `project-context.tsx` に `refreshProjects` を追加
2. **Phase 2**: `project-create-dialog.tsx` を新規作成
3. **Phase 3**: `project-switcher.tsx` を拡張
4. **Phase 4**: `app/projects/page.tsx` を作成
5. **Phase 5**: `app/projects/[id]/edit/page.tsx` を作成
6. **Phase 6**: E2Eテスト（Playwright MCP）

## デザイン方針
- design-principlesスキルを参照し、モダンで洗練されたミニマリズムデザインを適用
- 既存UIコンポーネント（shadcn/ui）を活用
- 背景: bg-slate-50、カード: 白背景 + shadow

## 検証方法
1. サイドバーのドロップダウンから新規作成ダイアログが開くこと
2. 新規作成後、自動的にそのプロジェクトに切り替わること
3. 「プロジェクト管理」から /projects に遷移すること
4. 一覧から編集・削除が行えること
5. 現在選択中のプロジェクトは削除できないこと
