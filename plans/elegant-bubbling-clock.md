# プロジェクト単位データ管理機能 実装計画

## 難易度評価

```
難易度: ★★☆
根拠: 12 files, 400行程度, 5 components
リスク: 既存データ移行時の参照整合性、全ルートテーブルへのproject_id追加
```

## 概要

現在は全データが単一プロジェクト前提。プロジェクト単位でデータを分離し、サイドバー下部でプロジェクト切り替えができるようにする。

**決定事項**
- 認証: なし（projectsテーブルのみ）
- 所有モデル: シンプル（1ユーザー = 複数プロジェクト）
- 既存データ: 「新会計システムプロジェクト」に紐付け
- RLS: 導入しない（アプリ側フィルタリング）

---

## Phase 1: DBスキーマ変更

### 1.1 projectsテーブル作成

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_name ON projects(name);

-- デフォルトプロジェクト作成
INSERT INTO projects (id, name, description)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '新会計システムプロジェクト',
  '既存データを紐付けた初期プロジェクト'
);
```

### 1.2 ルートテーブルへのproject_id追加

対象: `business_domains`, `system_domains`, `concepts`, `change_requests`

```sql
-- business_domains
ALTER TABLE business_domains
ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

UPDATE business_domains
SET project_id = '00000000-0000-0000-0000-000000000001';

ALTER TABLE business_domains
ALTER COLUMN project_id SET NOT NULL;

CREATE INDEX idx_business_domains_project ON business_domains(project_id);

-- system_domains, concepts, change_requests も同様
```

---

## Phase 2: 型定義 + データアクセス層

### 2.1 Project型追加

**修正: `lib/domain/entities.ts`**

```typescript
export interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### 2.2 プロジェクトCRUD作成

**新規: `lib/data/projects.ts`**

```typescript
export const listProjects = async () => { ... }
export const getProjectById = async (id: string) => { ... }
export const createProject = async (input: ProjectInput) => { ... }
export const updateProject = async (id: string, input: Partial<ProjectInput>) => { ... }
export const deleteProject = async (id: string) => { ... }
```

### 2.3 既存データ取得関数にprojectIdフィルタ追加

**修正対象:**
- `lib/data/businesses.ts` - `listBusinesses(projectId?)`
- `lib/data/system-domains.ts` - `listSystemDomains(projectId?)`
- `lib/data/concepts.ts` - `listConcepts(projectId?)`
- `lib/data/change-requests.ts` - `listChangeRequests(projectId?)`

修正パターン:
```typescript
export const listBusinesses = async (projectId?: string) => {
  let query = supabase
    .from("business_domains")
    .select("*")
    .order("id");

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query;
  ...
};
```

---

## Phase 3: プロジェクトContext

### 3.1 ProjectContext作成

**新規: `components/project/project-context.tsx`**

```typescript
interface ProjectContextValue {
  currentProjectId: string | null;
  currentProject: Project | null;
  projects: Project[];
  loading: boolean;
  setCurrentProjectId: (id: string) => void;
}
```

- LocalStorageに`current-project-id`として永続化
- 参考: `components/layout/sidebar-context.tsx`

### 3.2 useProjectフック

**新規: `hooks/use-project.ts`**

### 3.3 レイアウトへ組み込み

**修正: `app/layout.tsx`**

```tsx
<SidebarProvider>
  <ProjectProvider>
    ...
  </ProjectProvider>
</SidebarProvider>
```

---

## Phase 4: UI層

### 4.1 プロジェクト切替UI

**新規: `components/project/project-switcher.tsx`**

機能:
- 現在のプロジェクト名表示
- ドロップダウンでプロジェクト一覧
- 「+ 新規プロジェクト」リンク
- 折りたたみ時はアイコンのみ

### 4.2 サイドバーへ追加

**修正: `components/layout/sidebar.tsx`**

```tsx
</nav>
<div className="mt-auto border-t border-slate-200 p-4">
  <ProjectSwitcher />
</div>
</aside>
```

### 4.3 一覧ページでContext利用

**修正対象:**
- `app/business/page.tsx`
- `app/system-domains/page.tsx`
- `app/ideas/page.tsx`
- `app/tickets/page.tsx`

```tsx
const { currentProjectId } = useProject();
// データ取得時にcurrentProjectIdを渡す
```

---

## 修正ファイル一覧

### 新規作成
| ファイル | 役割 |
|---------|------|
| `lib/data/projects.ts` | プロジェクトCRUD |
| `components/project/project-context.tsx` | Context + Provider |
| `components/project/project-switcher.tsx` | サイドバー切替UI |
| `hooks/use-project.ts` | Contextフック |

### 修正
| ファイル | 修正内容 |
|---------|---------|
| `lib/domain/entities.ts` | Project型追加 |
| `lib/domain/index.ts` | export追加 |
| `lib/data/businesses.ts` | projectIdフィルタ |
| `lib/data/system-domains.ts` | projectIdフィルタ |
| `lib/data/concepts.ts` | projectIdフィルタ |
| `lib/data/change-requests.ts` | projectIdフィルタ |
| `app/layout.tsx` | ProjectProvider追加 |
| `components/layout/sidebar.tsx` | ProjectSwitcher追加 |
| `app/business/page.tsx` | useProject利用 |
| `app/system-domains/page.tsx` | useProject利用 |
| `app/ideas/page.tsx` | useProject利用 |
| `app/tickets/page.tsx` | useProject利用 |

---

## 検証方法

### DB検証（Supabase MCP）
```sql
SELECT * FROM projects;
SELECT id, name, project_id FROM business_domains;
```

### UI検証（Playwright MCP）
1. サイドバー下部のプロジェクト切替UI確認
2. 「新会計システムプロジェクト」選択時に既存データ表示
3. 新規プロジェクト作成 → 切替 → 一覧が空
4. ページリロード後も選択維持（LocalStorage）

---

## 実装順序

```
1. DBマイグレーション実行（Supabase MCP）
2. 型定義追加（entities.ts）
3. lib/data/projects.ts 作成
4. 既存データ取得関数にprojectIdフィルタ追加
5. ProjectContext + useProject 作成
6. app/layout.tsx にProvider追加
7. ProjectSwitcher作成
8. sidebar.tsx にProjectSwitcher追加
9. 各一覧ページでuseProject利用
10. Playwright MCPで動作確認
```
