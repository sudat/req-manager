# システム設計カード入力構造の改善 実装計画

## 難易度

```
難易度: ★★☆
根拠: 8-10 files, 700-900 lines, 5 components
リスク: 既存データとの後方互換性、新UIへの置き換え
```

---

## 概要

システム設計カードを「一文メモ」から「対象物×観点」の構造化入力に改善する。

**Before**: `{ category: "database", title: "...", description: "一文" }`
**After**: `{ target: { name: "発行指示画面", type: "screen" }, category: "function", content: { input: "...", process: "...", output: "..." } }`

---

## 重要な発見

既存の`SystemRequirementCategory`（enums.ts:26-31）が新観点と同じ：
- `function` / `data` / `exception` / `auth` / `non_functional`

→ **`DesignPerspective`として再利用可能**（型エイリアス）

---

## Phase 1: 型定義 + Zodスキーマ（0.5日）

### 1.0 Zod導入

```bash
bun add zod
```

### 1.1 Zodスキーマ定義

**`lib/domain/schemas/system-design.ts`**

```typescript
import { z } from "zod";

// 設計観点
export const designPerspectiveSchema = z.enum([
  "function", "data", "exception", "auth", "non_functional"
]);
export type DesignPerspective = z.infer<typeof designPerspectiveSchema>;

// 対象物の種別
export const designTargetTypeSchema = z.enum([
  "screen", "batch", "api", "job", "template", "service"
]);
export type DesignTargetType = z.infer<typeof designTargetTypeSchema>;

// 対象物
export const designTargetSchema = z.object({
  name: z.string().min(1, "対象物の名前は必須です"),
  type: designTargetTypeSchema,
  entryPoint: z.string().nullable(),
});
export type DesignTarget = z.infer<typeof designTargetSchema>;

// 観点別content（5種類）
export const functionDesignContentSchema = z.object({
  input: z.string().min(1, "入力は必須です"),
  process: z.string().min(1, "処理は必須です"),
  output: z.string().min(1, "出力は必須です"),
  sideEffects: z.string().optional(),
});
export type FunctionDesignContent = z.infer<typeof functionDesignContentSchema>;

export const dataDesignContentSchema = z.object({
  fields: z.string().min(1, "対象項目は必須です"),
  tables: z.array(z.string()).optional(),
  constraints: z.string().optional(),
  migration: z.string().optional(),
});

export const exceptionDesignContentSchema = z.object({
  errorCases: z.string().min(1, "エラーケースは必須です"),
  userNotification: z.string().optional(),
  logging: z.string().optional(),
  recovery: z.string().optional(),
});

export const authDesignContentSchema = z.object({
  roles: z.string().min(1, "対象ロールは必須です"),
  operations: z.string().min(1, "許可操作は必須です"),
  boundary: z.string().optional(),
});

export const nonFunctionalDesignContentSchema = z.object({
  performance: z.string().optional(),
  availability: z.string().optional(),
  monitoring: z.string().optional(),
});

// レガシー移行用
export const legacyDesignContentSchema = z.object({
  legacy: z.string(),
});

// content ユニオン
export const designContentSchema = z.union([
  functionDesignContentSchema,
  dataDesignContentSchema,
  exceptionDesignContentSchema,
  authDesignContentSchema,
  nonFunctionalDesignContentSchema,
  legacyDesignContentSchema,
]);
export type DesignContent = z.infer<typeof designContentSchema>;

// 新SystemDesignItem
export const systemDesignItemV2Schema = z.object({
  id: z.string(),
  category: designPerspectiveSchema,
  title: z.string(),
  target: designTargetSchema,
  content: designContentSchema,
  priority: z.enum(["high", "medium", "low"]),
});
export type SystemDesignItemV2 = z.infer<typeof systemDesignItemV2Schema>;

// 型ガード
export function isV2Item(item: unknown): item is SystemDesignItemV2;
export function isLegacyItem(item: unknown): item is SystemDesignItem;
```

### 1.2 既存型の拡張

**`lib/domain/enums.ts`** - 変更なし（SystemRequirementCategoryを再利用）

**`lib/domain/entities.ts`** - SystemFunction.systemDesignの型をユニオンに

### 1.3 移行ロジック

**`lib/data/system-design-migration.ts`**

```typescript
// 旧カテゴリ→新観点マッピング
const CATEGORY_MAP = {
  database: "data",
  api: "function",
  logic: "function",
  ui: "function",
  integration: "function",
  batch: "function",
  error_handling: "exception",
};

// 読み込み時にV2とレガシーを分類
export function classifyDesignItems(items: unknown[]): {
  v2Items: SystemDesignItemV2[];
  legacyItems: SystemDesignItem[];
};
```

---

## Phase 2: UIコンポーネント（1日）

### 2.1 コンポーネント構成

```
components/forms/design/
├── index.ts
├── system-design-editor.tsx      # メイン（対象物選択＋タブ）
├── design-target-selector.tsx    # 対象物ドロップダウン＋新規追加
├── perspective-tabs.tsx          # 観点タブ（5タブ）
├── forms/
│   ├── function-design-form.tsx  # 入力/処理/出力/副作用
│   ├── data-design-form.tsx
│   ├── exception-design-form.tsx
│   ├── auth-design-form.tsx
│   └── non-functional-design-form.tsx
├── legacy-content-banner.tsx     # レガシーデータ参考表示
└── ambiguous-word-lint.tsx       # 曖昧語警告
```

### 2.2 メインエディター構造

```tsx
<SystemDesignEditor
  targets={targets}
  items={v2Items}
  legacyItems={legacyItems}
  entryPoints={entryPoints}
  onTargetsChange={...}
  onItemsChange={...}
>
  {legacyItems.length > 0 && <LegacyContentBanner />}

  <DesignTargetSelector />  {/* 対象物選択 */}

  <PerspectiveTabs>         {/* 観点タブ */}
    <FunctionDesignForm />
    <DataDesignForm />
    ...
  </PerspectiveTabs>
</SystemDesignEditor>
```

### 2.3 曖昧語lint

```typescript
const AMBIGUOUS_WORDS = ["高速", "柔軟", "便利", "適切", "迅速", "安定"];
// 入力時に警告表示（ブロックしない）
```

---

## Phase 3: 統合（0.5日）

### 3.1 フック更新

**`app/(with-sidebar)/system-domains/[id]/[srfId]/edit/hooks/useSystemFunctionForm.ts`**

- `systemDesign` 状態を V2/Legacy 分離管理に変更
- `targets` 状態を追加
- 保存時にマージして送信

### 3.2 編集ページ統合

**`app/(with-sidebar)/system-domains/[id]/[srfId]/edit/page.tsx`**

- 既存`SystemDesignSection`を新`SystemDesignEditor`に置き換え

### 3.3 詳細画面対応

**`components/system-domains/system-design-section.tsx`**

- V2構造の表示対応（対象物、観点別表示）

---

## Phase 4: テスト・検証（0.5日）

1. 既存データでの読み込み確認（後方互換性）
2. 新規作成フローの動作確認
3. Playwright MCPでE2Eテスト

---

## 修正対象ファイル一覧

| ファイル | 変更内容 |
|----------|----------|
| `lib/domain/schemas/system-design.ts` | **新規** - 型定義 |
| `lib/data/system-design-migration.ts` | **新規** - 移行ロジック |
| `components/forms/design/*.tsx` | **新規** - UIコンポーネント群 |
| `lib/domain/entities.ts` | systemDesign型をユニオンに |
| `app/(with-sidebar)/system-domains/[id]/[srfId]/edit/hooks/useSystemFunctionForm.ts` | 状態管理拡張 |
| `app/(with-sidebar)/system-domains/[id]/[srfId]/edit/page.tsx` | 新コンポーネント統合 |
| `app/(with-sidebar)/system-domains/[id]/[srfId]/edit/components/SystemDesignSection.tsx` | 削除（置き換え） |
| `components/system-domains/system-design-section.tsx` | V2表示対応 |

---

## 検証手順

1. **型チェック**: `bun run typecheck`
2. **ビルド**: `bun run build`
3. **E2Eテスト（Playwright MCP）**:
   - システム機能編集画面を開く
   - 対象物を新規追加（名前: テスト画面, 種別: screen）
   - 機能タブで入力/処理/出力を入力
   - 保存して詳細画面で確認
   - 既存データ（レガシー）が正常に表示されることを確認

---

## 設計原則

| 原則 | 適用 |
|------|------|
| **DRY** | Zodスキーマから型を推論（`z.infer`）、型定義の重複排除 |
| **KISS** | react-hook-formは未導入、Zodは検証のみに使用 |
| **YAGNI** | 必須観点マトリクスは初期実装では見送り |
