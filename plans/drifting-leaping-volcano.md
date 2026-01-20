# システム機能ページに構造化された受入条件機能を追加

## 概要

システム機能関連ページ（詳細・編集・作成）に、業務タスク詳細ページの業務要件カードと同じような構造化された受入条件機能を追加します。

## 現状の課題

| ページ | URL | 課題 |
|--------|-----|------|
| システム機能詳細 | `/system-domains/[id]/[srfId]` | 受入条件が単純なリスト表示（`string[]`） |
| システム機能編集 | `/system-domains/[id]/[srfId]/edit` | システム要件編集機能がない |
| システム機能作成 | `/system-domains/[id]/functions/create` | 構造化された受入条件入力がない |

## 業務タスク側（参照実装）

**編集ページ**: `/app/business/[id]/tasks/[taskId]/edit/page.tsx`
- `RequirementListSection` + `RequirementCard` + `StructuredAcceptanceCriteriaInput`
- `useMasterData` フックでマスターデータ取得
- `SelectionDialog` で関連概念/システム機能等を選択

## 実装計画

### Phase 1: システム機能作成ページに構造化された受入条件入力を追加

**対象**: `/app/system-domains/[id]/functions/create/`

1. **`types.ts`** - `acceptanceCriteriaJson` フィールドを追加
   ```typescript
   import type { AcceptanceCriterionJson } from "@/lib/data/structured";

   export type SystemRequirementCard = {
     id: string;
     title: string;
     summary: string;
     businessRequirementIds: string[];
     acceptanceCriteriaJson: AcceptanceCriterionJson[];
   };
   ```

2. **`hooks/useSystemRequirements.ts`** - 初期値に `acceptanceCriteriaJson: []` を追加
   ```typescript
   const nextSysReq: SystemRequirementCard = {
     id,
     title: "",
     summary: "",
     businessRequirementIds: [],
     acceptanceCriteriaJson: [],
   };
   ```

3. **`components/SystemRequirementCard.tsx`** - `StructuredAcceptanceCriteriaInput` を追加
   ```tsx
   import { StructuredAcceptanceCriteriaInput } from "@/components/forms/StructuredAcceptanceCriteriaInput";

   // 追加: 受入条件入力フィールド
   <StructuredAcceptanceCriteriaInput
     values={systemRequirement.acceptanceCriteriaJson}
     onChange={(values) => onUpdate({ acceptanceCriteriaJson: values })}
   />
   ```

### Phase 2: システム機能詳細ページの受入条件表示を改善

**対象**: `/components/system-domains/system-requirements-section.tsx`

現在の単純なリスト表示（`string[]`）を `AcceptanceCriteriaDisplay` に変更：

```tsx
import { AcceptanceCriteriaDisplay } from "@/components/forms/AcceptanceCriteriaDisplay";

// Before:
<ul className="list-disc pl-5 text-[13px] text-slate-700 space-y-0.5">
  {req.systemReqAcceptanceCriteria.map((ac, i) => (
    <li key={i}>{ac}</li>
  ))}
</ul>

// After:
<AcceptanceCriteriaDisplay
  items={/* acceptanceCriteriaJsonデータ */}
  emptyMessage="未登録"
/>
```

**注意**: `RelatedRequirementInfo` 型の拡張と `buildRelatedRequirements` の変更が必要です。

1. **`/lib/domain/value-objects.ts`** - `acceptanceCriteriaJson` フィールドを追加
   ```typescript
   export interface RelatedRequirementInfo {
     // ... 既存フィールド
     systemReqAcceptanceCriteria?: string[];  // レガシー
     systemReqAcceptanceCriteriaJson?: AcceptanceCriterionJson[];  // 追加
   }
   ```

2. **`/lib/data/transformers/related-requirements-transformer.ts`** - `buildRelatedRequirements` を拡張
   - `SystemRequirement` 型に `acceptanceCriteriaJson` を追加
   - `RelatedRequirementInfo` に `acceptanceCriteriaJson` を含める

### Phase 3: システム機能編集ページにシステム要件編集セクションを追加

**対象**: `/app/system-domains/[id]/[srfId]/edit/`

業務タスク編集ページと同様の構造でシステム要件編集を追加します。

1. **`page.tsx`** - システム要件セクションを追加
   ```tsx
   import { RequirementListSection } from "@/components/forms/requirement-list-section";
   import { SelectionDialog } from "@/components/forms/SelectionDialog";
   import { useMasterData } from "@/app/business/[id]/tasks/[taskId]/edit/hooks/useMasterData";

   // マスターデータ取得
   const {
     concepts,
     systemFunctions,
     systemDomains,
     conceptMap,
     systemFunctionMap,
     systemDomainMap,
   } = useMasterData();

   // システム要件編集セクションを追加
   <RequirementListSection
     title="システム要件"
     requirements={state.systemRequirements}
     onAdd={() => actions.addSystemRequirement(id)}
     onUpdate={(reqId, patch) => actions.updateSystemRequirement(reqId, patch)}
     onRemove={(reqId) => actions.removeSystemRequirement(reqId)}
     conceptMap={conceptMap}
     systemFunctionMap={systemFunctionMap}
     systemDomainMap={systemDomainMap}
     businessRequirementMap={businessRequirementMap}
     onOpenDialog={handleOpenDialog}
   />
   ```

2. **`hooks/useSystemFunctionForm.ts`** - システム要件の状態管理を追加
   ```typescript
   import { listSystemRequirementsBySrfId } from "@/lib/data/system-requirements";
   import { fromSystemRequirement } from "@/lib/data/requirement-mapper";
   import type { Requirement } from "@/lib/domain/forms";

   export interface SystemFunctionFormState {
     // ... 既存フィールド
     systemRequirements: Requirement[];
   }

   export interface SystemFunctionFormActions {
     // ... 既存アクション
     addSystemRequirement: () => void;
     updateSystemRequirement: (reqId: string, patch: Partial<Requirement>) => void;
     removeSystemRequirement: (reqId: string) => void;
   }
   ```

## 依存ファイル

### 既存コンポーネント（再利用）

| ファイル | 用途 |
|---------|------|
| `/components/forms/StructuredAcceptanceCriteriaInput.tsx` | 構造化された受入条件入力 |
| `/components/forms/AcceptanceCriteriaDisplay.tsx` | 構造化された受入条件表示 |
| `/components/forms/requirement-card.tsx` | 要件編集カード |
| `/components/forms/requirement-list-section.tsx` | 要件リストセクション |
| `/components/forms/SelectionDialog.tsx` | 選択ダイアログ |
| `/app/business/[id]/tasks/[taskId]/edit/hooks/useMasterData.ts` | マスターデータ取得フック |

### データアクセス

| ファイル | 関数 |
|---------|------|
| `/lib/data/system-requirements.ts` | `listSystemRequirementsBySrfId`, `createSystemRequirement`, `updateSystemRequirement`, `deleteSystemRequirement` |
| `/lib/data/requirement-mapper.ts` | `fromSystemRequirement`, `toSystemRequirementInput` |

## 変更ファイル一覧

1. `/app/system-domains/[id]/functions/create/types.ts` - 型定義に `acceptanceCriteriaJson` を追加
2. `/app/system-domains/[id]/functions/create/hooks/useSystemRequirements.ts` - 初期値に `acceptanceCriteriaJson` を追加
3. `/app/system-domains/[id]/functions/create/components/SystemRequirementCard.tsx` - `StructuredAcceptanceCriteriaInput` を追加
4. `/lib/domain/value-objects.ts` - `RelatedRequirementInfo` に `acceptanceCriteriaJson` を追加
5. `/lib/data/transformers/related-requirements-transformer.ts` - `buildRelatedRequirements` を拡張
6. `/components/system-domains/system-requirements-section.tsx` - `AcceptanceCriteriaDisplay` を使用
7. `/app/system-domains/[id]/[srfId]/edit/page.tsx` - システム要件編集セクションを追加
8. `/app/system-domains/[id]/[srfId]/edit/hooks/useSystemFunctionForm.ts` - システム要件の状態管理を追加

## 検証方法

### 1. システム機能作成ページ

```
1. http://localhost:3000/system-domains/AR/functions/create にアクセス
2. システム要件を追加
3. 受入条件（構造化）に入力（説明 + 検証方法）
4. 保存
5. DBで `acceptance_criteria_json` が正しく保存されていることを確認
```

### 2. システム機能詳細ページ

```
1. 作成したシステム機能の詳細ページにアクセス
2. システム要件カードで受入条件が構造化表示されていることを確認
   - 説明文が表示される
   - 検証方法がある場合は表示される
```

### 3. システム機能編集ページ

```
1. システム機能の編集ページにアクセス
2. システム要件セクションが存在することを確認
3. 要件の追加・編集・削除ができることを確認
4. 構造化された受入条件の編集ができることを確認
5. 保存後に反映されていることを確認
```

## 難易度評価

**難易度: ★★☆**

**根拠**:
- 変更ファイル数: 8ファイル
- 変更行数概算: 約300行
- 影響コンポーネント数: 約6コンポーネント

**リスク**:
- `RelatedRequirementInfo` 型の拡張は既存コードへの影響が大きい可能性がある
- システム機能編集ページは保存処理の拡張が必要

**成功のポイント**:
- 業務タスク編集ページの実装パターンを確実に踏襲する
- 既存の共通コンポーネントを最大限再利用する
- `Requirement` 型と各ページ固有の型の違いを正しく扱う
