# システム機能編集画面の修正

## 要件
1. **設計書Noの完全削除** - UI、コード、DBカラムから削除
2. **システム要件一覧の追加** - 編集画面にシステム要件セクションを追加

---

## 難易度
**★☆☆** - 6 files, 150-200 lines, 3 components

**リスク:**
- `designDocNo`の既存データ確認が必要
- DBマイグレーションはロールバック可能

---

## 変更ファイル一覧

| # | ファイル | 変更内容 |
|---|---------|----------|
| 1 | `lib/domain/entities.ts` | `SystemFunction`から`designDocNo`プロパティ削除 |
| 2 | `lib/data/system-functions.ts` | `SystemFunctionInput`、`toSystemFunction`、`toSystemFunctionRowBase`から`designDocNo`削除 |
| 3 | `app/system-domains/[id]/[srfId]/edit/components/BasicInfoSection.tsx` | 設計書No入力フィールド削除 |
| 4 | `app/system-domains/[id]/[srfId]/edit/hooks/useSystemFunctionForm.ts` | `designDocNo`状態と`setDesignDocNo`削除 |
| 5 | `app/system-domains/[id]/[srfId]/edit/page.tsx` | システム要件セクション追加、`designDocNo`関連props削除 |
| 6 | `supabase/migrations/20260121000000_remove_design_doc_no.sql` | DBカラム削除 |

---

## 実装手順

### Phase 1: 既存データの確認（重要）
```sql
-- design_doc_noに値があるデータを確認
SELECT id, design_doc_no FROM system_functions WHERE design_doc_no IS NOT NULL;
```
データがある場合はバックアップを取得し、ユーザーに確認する。

### Phase 2: コード変更

#### 2.1 `lib/domain/entities.ts`
```typescript
// SystemFunction インターフェースから削除
// designDocNo: string;  // <-- 削除
```

#### 2.2 `lib/data/system-functions.ts`
- `SystemFunctionInput`型から`designDocNo`削除
- `toSystemFunction`関数から`designDocNo: row.design_doc_no`削除
- `toSystemFunctionRowBase`関数から`design_doc_no: input.designDocNo`削除

#### 2.3 `app/system-domains/[id]/[srfId]/edit/components/BasicInfoSection.tsx`
- Propsから`designDocNo`と`onDesignDocNoChange`削除
- JSXから設計書No入力フィールド（63-73行目相当）削除

#### 2.4 `app/system-domains/[id]/[srfId]/edit/hooks/useSystemFunctionForm.ts`
- `SystemFunctionFormState`から`designDocNo`削除
- `SystemFunctionFormActions`から`setDesignDocNo`削除
- `useSystemFunctionForm`内の状態と`setDesignDocNo(data.designDocNo)`削除
- `save`関数から`designDocNo`削除

#### 2.5 `app/system-domains/[id]/[srfId]/edit/page.tsx`
```typescript
// インポート追加
import { SystemRequirementsSection } from "@/components/system-domains/system-requirements-section";

// BasicInfoSectionからprops削除
<BasicInfoSection
  srfId={srfId}
  // designDocNo={designDocNo}              <-- 削除
  // onDesignDocNoChange={setDesignDocNo}   <-- 削除
  ...
/>

// システム要件セクション追加（EntryPointsEditorの前）
<SystemRequirementsSection srfId={srfId} />
```

### Phase 3: DBマイグレーション

```sql
-- supabase/migrations/20260121000000_remove_design_doc_no.sql
begin;

alter table public.system_functions
  drop column if exists design_doc_no;

commit;
```

---

## 検証手順

### 1. 型チェック・ビルド
```bash
bunx tsc --noEmit
bun run build
```

### 2. UI確認
- `http://localhost:3000/system-domains/AR/SRF-001/edit` にアクセス
- 設計書No入力欄がないことを確認
- システム要件一覧が表示されることを確認
- 保存機能が正常動作することを確認

### 3. DB確認
```sql
-- カラムが削除されたことを確認
\d system_functions
```
