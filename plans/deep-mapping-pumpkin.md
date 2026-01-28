# 編集画面3点修正 実装計画

## 概要

`/business/[id]/[taskId]/edit` ページの3点修正:
1. 関連システム機能の複数選択対応（DBスキーマ変更含む）
2. カード間のgap追加
3. 用語変更: process_steps → 業務プロセス

---

## 修正1: 関連システム機能の複数選択対応

### 変更内容
- **現状**: `srfId: string | null` (単一選択)
- **目標**: `srfIds: string[]` (複数選択)

### ファイル変更一覧

#### 1.1 型定義変更

**`lib/domain/forms.ts`**
```typescript
// 変更前
srfId: string | null;

// 変更後
srfIds: string[];
```

**`lib/data/business-requirements.ts`**
```typescript
// BusinessRequirement型
srfIds: string[];  // srfId → srfIds

// BusinessRequirementInput型
srfIds: string[];

// BusinessRequirementRow型
srf_ids: string[] | null;  // srf_id → srf_ids

// toBusinessRequirement関数
srfIds: row.srf_ids ?? [],

// toBusinessRequirementRowBase関数
srf_ids: input.srfIds,
```

#### 1.2 Hookロジック変更

**`components/forms/hooks/useToggleHandlers.ts`**
```typescript
// createMultiToggleの型定義に srfIds を追加
const createMultiToggle = (
  key:
    | "conceptIds"
    | "srfIds"  // 追加
    | "systemDomainIds"
    | ...
)

// 単一選択ハンドラーを削除（不要になる）
// const createSingleToggle = ...;  // 削除

// 戻り値を変更
return {
  handleConceptToggle: createMultiToggle("conceptIds"),
  handleSystemFunctionToggle: createMultiToggle("srfIds"),  // createSingleToggle → createMultiToggle
  ...
};
```

#### 1.3 マッパー変更

**`lib/data/requirement-mapper.ts`**
```typescript
// toBusinessRequirementInput関数
srfIds: requirement.srfIds,  // srfId → srfIds

// fromBusinessRequirement関数
srfIds: br.srfIds ?? [],

// toSystemRequirementInput関数
srfIds: requirement.srfIds,

// fromSystemRequirement関数
srfIds: sr.srfIds ?? [],
```

#### 1.4 ダイアログUI変更

**`components/forms/SelectionDialog.tsx`**
```typescript
// システム機能選択時のisCheckedロジック
isChecked={(id) => activeRequirement.srfIds.includes(id)}  // srfId === id → srfIds.includes(id)
```

#### 1.5 カード表示変更

**`components/forms/requirement-card.tsx`**
```typescript
<SelectionField
  label="関連システム機能"
  selectedIds={requirement.srfIds ?? []}  // srfId ? [srfId] : [] → srfIds ?? []
  ...
/>
```

### 1.6 DBマイグレーション

**Supabase MCPの `apply_migration` ツールを使用**

マイグレーション内容:
```sql
-- 既存の srf_id (text) を srf_ids (text[]) に変更

-- 1. 新しい列を追加
ALTER TABLE public.business_requirements
  ADD COLUMN IF NOT EXISTS srf_ids text[] DEFAULT '{}'::text[];

-- 2. 既存データの移行
UPDATE public.business_requirements
SET srf_ids = CASE
  WHEN srf_id IS NOT NULL THEN ARRAY[srf_id]
  ELSE '{}'::text[]
END
WHERE srf_ids = '{}'::text[];

-- 3. 移行確認後、古い列を削除
-- ALTER TABLE public.business_requirements DROP COLUMN IF EXISTS srf_id;
-- 注: 移行完了確認後に手動で実行
```

---

## 修正2: カード間のgap追加

### 変更内容
基本情報カードと業務要件セクションの間に `space-y-8` を追加

### ファイル変更

**`app/(with-sidebar)/business/[id]/[taskId]/edit/page.tsx`**

変更箇所: L219-238

```tsx
{/* 変更前 */}
<TaskBasicInfoCard ... />
<RequirementListSection ... />

{/* 変更後 */}
<div className="space-y-8">
  <TaskBasicInfoCard ... />
  <RequirementListSection ... />
</div>
```

---

## 修正3: 用語変更

### 変更内容
`process_steps` → `業務プロセス`

### ファイル変更

**`app/(with-sidebar)/business/[id]/[taskId]/edit/components/TaskBasicInfoCard.tsx`**

変更箇所: L74

```tsx
{/* 変更前 */}
<ProcessStepsField label="process_steps" ... />

{/* 変更後 */}
<ProcessStepsField label="業務プロセス" ... />
```

---

## 実装手順

### Phase 1: DBマイグレーション
1. Supabase MCPでマイグレーションを作成・適用
2. 既存データが正しく移行されたか確認
3. （検証後）古い `srf_id` 列を削除

### Phase 2: コード変更（型定義→マッパー→Hook→UI）
1. `lib/domain/forms.ts` - 型定義変更
2. `lib/data/business-requirements.ts` - 型・マッパー変更
3. `lib/data/requirement-mapper.ts` - マッパー変更
4. `components/forms/hooks/useToggleHandlers.ts` - Hook変更
5. `components/forms/SelectionDialog.tsx` - ダイアログ変更
6. `components/forms/requirement-card.tsx` - カード変更
7. `app/(with-sidebar)/business/[id]/[taskId]/edit/page.tsx` - gap追加
8. `app/(with-sidebar)/business/[id]/[taskId]/edit/components/TaskBasicInfoCard.tsx` - 用語変更

### Phase 3: 動作確認
1. 関連システム機能の複数選択ができること
2. 複数選択した値が保存・表示されること
3. カード間に適切な余白があること
4. ラベルが「業務プロセス」と表示されること

---

## 検証方法

### 1. 関連システム機能複数選択
- [ ] ダイアログで複数のシステム機能を選択できる
- [ ] 選択した複数の機能がBadgeとして表示される
- [ ] 保存後にDBに配列として格納される
- [ ] 既存データ（単一のsrf_idを持つもの）が正しく移行されている

### 2. gap追加
- [ ] 基本情報カードと業務要件セクションの間に余白がある
- [ ] レスポンシブデザインで正常に表示される

### 3. 用語変更
- [ ] ラベルが「業務プロセス」と表示される

### 4. 統合テスト（Playwright MCP）
- [ ] 業務タスク編集画面で保存が正常に動作する
- [ ] 保存後の詳細画面でデータが正しく表示される
- [ ] 既存の業務要件データが破損していない

---

## リスク評価

| リスク | 影響 | 軽減策 |
|--------|------|--------|
| DBスキーマ変更による既存データの破損 | 高 | 移行前にSupabaseダッシュボードでバックアップ、ステージング環境で検証 |
| srf_id → srf_ids 変更の影響範囲漏れ | 中 | Grepで全使用箇所を網羅的に検索 |
| 型変更によるコンパイルエラー | 低 | TypeScriptコンパイラが検出、修正箇所は特定済み |

---

## Critical Files

- **`lib/domain/forms.ts`** - Requirement型定義（srfId → srfIds）
- **`lib/data/business-requirements.ts`** - BusinessRequirement型・マッパー
- **`components/forms/hooks/useToggleHandlers.ts`** - トグルハンドラー（単一→複数）
- **`components/forms/SelectionDialog.tsx`** - ダイアログUI（isCheckedロジック）
- **`lib/data/requirement-mapper.ts`** - マッパー関数
- **`components/forms/requirement-card.tsx`** - カード表示
- **`app/(with-sidebar)/business/[id]/[taskId]/edit/page.tsx`** - gap追加
- **`app/(with-sidebar)/business/[id]/[taskId]/edit/components/TaskBasicInfoCard.tsx`** - 用語変更
