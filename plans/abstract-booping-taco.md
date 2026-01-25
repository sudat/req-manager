# プルダウン問題とビルドエラーの修正

## 問題の概要

ユーザーから以下の問題が報告されている：

1. **プルダウン問題**: システム機能編集ページなどで、プルダウンをクリックしても空っぽのリストが表示される
2. **ビルドエラー**: `Module not found: Can't resolve '@/app/tickets/[id]/actions'`

---

## 1. ビルドエラーの修正

### 原因

`components/tickets/ticket-basic-info-card.tsx` でインポートしているパスが古い。

```typescript
// 現在（誤り）
import { updateTicketStatus } from "@/app/tickets/[id]/actions";

// 正しいパス
import { updateTicketStatus } from "@/app/(with-sidebar)/tickets/[id]/actions";
```

### 修正内容

| ファイル | 行 | 修正内容 |
|---------|-----|----------|
| `components/tickets/ticket-basic-info-card.tsx` | 15 | インポートパスを修正 |

---

## 2. プルダウンが空になる問題の調査

### 原因の分析

`useMasterData` フック（`app/(with-sidebar)/business/[id]/tasks/[taskId]/edit/hooks/useMasterData.ts`）が以下の3つのデータを取得している：

1. **Concepts** - `lib/data/concepts.ts` の `listConcepts(projectId)`
2. **System Functions** - `lib/data/system-functions.ts` の `listSystemFunctions(projectId)`
3. **System Domains** - `lib/data/system-domains.ts` の `listSystemDomains(projectId)`

各データファイルは `project_id` でフィルタリングを行っている：

```typescript
if (projectId) {
  query = query.eq("project_id", projectId);
}
```

### 考えられる原因

1. **プロジェクト未選択**: `currentProjectId` が `null`
2. **DBにデータがない**: 選択したプロジェクトIDに対応するデータがDBに存在しない
3. **Supabase認証設定の問題**: `getSupabaseConfigError()` でエラーになっている

### デバッグ手順

1. **プロジェクトIDの確認**
   - ブラウザの開発者ツールで `localStorage.getItem('current-project-id')` を確認
   - プロジェクトが選択されているか確認

2. **DBデータの確認**
   - Supabase MCPで、選択したプロジェクトIDのデータが存在するか確認
   - `SELECT * FROM concepts WHERE project_id = '...'`
   - `SELECT * FROM system_functions WHERE project_id = '...'`
   - `SELECT * FROM system_domains WHERE project_id = '...'`

3. **エラーメッセージの表示**
   - `useMasterData` フックが返す `optionsError` の値をUIに表示して確認

---

## 実行計画

### Phase 1: ビルドエラーの修正（優先）

1. `components/tickets/ticket-basic-info-card.tsx` のインポートパスを修正
2. ビルドが成功することを確認

### Phase 2: プルダウン問題の調査と修正

ユーザーはプロジェクトを選択しているとのことなので、DBデータの状態を確認します。

1. **Supabase MCPでDBデータの確認**
   - `SELECT * FROM projects` - プロジェクト一覧を確認
   - `SELECT * FROM concepts` - コンセプトデータの確認
   - `SELECT * FROM system_functions` - システム機能データの確認
   - `SELECT * FROM system_domains` - システムドメインデータの確認

2. **データが存在しない場合**
   - シードデータを作成して投入

3. **データが存在する場合**
   - `project_id` の値が正しく設定されているか確認
   - RLSポリシーの問題がないか確認

---

## 難易度評価

**ビルドエラー修正**: ★☆☆
- 修正ファイル数: 1 file
- 変更行数概算: 1 line
- リスク: 低

**プルダウン問題**: 調査中
- データの状態次第で対応が異なる

---

## 検証方法

1. ビルドが成功すること
2. システム機能編集ページでプルダウンにデータが表示されること
