# システム機能編集画面の根本的再設計

## 概要

現在の画面には以下の概念的混乱がある:

| 問題 | 現状 | 解決策 |
|------|------|--------|
| 3つの「分類」的概念の混在 | 機能分類/カテゴリ/対象物の種別が似て非なる概念 | 「成果物(Deliverable)」に統合 |
| 「名前」と「タイトル」の混在 | システム設計のtitleとtarget.nameが重複 | 成果物の「名前」に一本化 |
| 非機能設計の項目が限定的 | performance/availability/monitoringのみ | security/scalabilityを追加 |
| エントリポイントが別セクション | 対象物との関連が不明瞭 | 成果物に統合 |

---

## 難易度

```
難易度: ★★★
根拠: 15+ files, 500+ lines, DBマイグレーション + データ移行 + UIリファクタリング
リスク: 既存データの互換性、レガシーデータの移行失敗
```

---

## 新しいドメインモデル

### Before（現状）
```
SystemFunction
├── category: SrfCategory (screen/internal/interface) ← 削除
├── systemDesign: SystemDesignItem[]
│   ├── category: DesignItemCategory (レガシー) or DesignPerspective (V2)
│   ├── title: string ← 削除
│   └── target: DesignTarget
│       ├── name: string
│       ├── type: DeliverableType
│       └── entryPoint: string | null
├── entryPoints: EntryPoint[] ← 削除
└── systemRequirements: SystemRequirement[]
    └── category: SystemRequirementCategory ← 削除
```

### After（新構造）
```
SystemFunction
├── title, summary, status
├── deliverables: Deliverable[] ★新概念
│   ├── id: string
│   ├── name: string (日本語名)
│   ├── type: "screen" | "batch" | "api" | "job" | "template" | "service"
│   ├── entryPoint: string | null
│   └── design: Record<Perspective, DesignContent | null>
│       ├── function: { input, process, output, sideEffects }
│       ├── data: { fields, tables, constraints, migration }
│       ├── exception: { errorCases, userNotification, logging, recovery }
│       ├── auth: { roles, operations, boundary }
│       └── non_functional: { performance, availability, monitoring, security, scalability }
└── systemRequirements: SystemRequirement[]
    ├── title, summary
    ├── acceptanceCriteria
    └── relatedDeliverableIds: string[] (成果物への紐づけ)
```

---

## 廃止される概念

| 廃止 | 理由 | 代替 |
|------|------|------|
| SrfCategory (機能分類) | 成果物の種別で十分 | `deliverables[].type` |
| SystemRequirementCategory | 要件に観点は不要（設計側で持つ） | 削除 |
| EntryPoint（別セクション） | 成果物と一対一で紐づく | `deliverables[].entryPoint` |
| SystemDesignItem.title | 対象物のnameと重複 | `deliverables[].name` |

---

## 新しいUI構造

```
┌─────────────────────────────────────────────────────────────────────┐
│ 編集: [機能名]                                                       │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─ 基本情報 ─────────────────────────────────────────────────────┐ │
│ │ 機能名*: [_______________]  ステータス*: [▼ 未実装 ]           │ │
│ │ 機能概要*: [______________________________________________]    │ │
│ │ ※機能分類は廃止                                                │ │
│ └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─ 成果物 (2) ──────────────────────────────────────────── [+追加]│ │
│ │ ┌───────────────────────────────────────────────────────────┐  │ │
│ │ │ 発行指示画面 (画面)                          [エントリ設定]│  │ │
│ │ │ [機能] [データ] [例外] [権限] [非機能]                     │  │ │
│ │ │ ┌───────────────────────────────────────────────────────┐│  │ │
│ │ │ │ 入力*: [メールアドレス、パスワード]                    ││  │ │
│ │ │ │ 処理*: [1. 重複チェック 2. ハッシュ化 3. DB保存]       ││  │ │
│ │ │ │ 出力*: [登録完了メッセージ、登録ID返却]                 ││  │ │
│ │ │ │ 副作用: [確認メール送信、監査ログ出力]                  ││  │ │
│ │ │ └───────────────────────────────────────────────────────┘│  │ │
│ │ └───────────────────────────────────────────────────────────┘  │ │
│ │                                                                 │ │
│ │ ┌───────────────────────────────────────────────────────────┐  │ │
│ │ │ PDF生成バッチ (バッチ)                                    │  │ │
│ │ │ ...                                                        │  │ │
│ │ └───────────────────────────────────────────────────────────┘  │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─ システム要件 (1) ────────────────────────────────────── [+追加]│ │
│ │ ┌───────────────────────────────────────────────────────────┐  │ │
│ │ │ SR-GL-001                                                  │  │ │
│ │ │ タイトル*: [ランダムなテスト伝票作成]                      │  │ │
│ │ │ 概要*: [______________________________________________]    │  │ │
│ │ │ 受入条件: [+ 条件追加]                                     │  │ │
│ │ │ 関連成果物: [▼ 発行指示画面 ]  ※カテゴリは廃止            │  │ │
│ │ └───────────────────────────────────────────────────────────┘  │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                          [キャンセル] [保存]        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 実装計画

### Phase 1: DBスキーマ変更

**ファイル**: `supabase/migrations/YYYYMMDD_add_deliverables.sql`

```sql
-- 新カラム追加
ALTER TABLE system_functions
  ADD COLUMN IF NOT EXISTS deliverables jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE system_requirements
  ADD COLUMN IF NOT EXISTS related_deliverable_ids text[] NOT NULL DEFAULT '{}'::text[];

-- 旧カラムは段階的に廃止（後方互換性のため残す）
-- category, entry_points, system_design は読み取り専用に
```

### Phase 2: 型定義・スキーマ変更

**新規**: `lib/domain/schemas/deliverable.ts`

```typescript
import { z } from "zod";

export const deliverableTypeSchema = z.enum([
  "screen", "batch", "api", "job", "template", "service"
]);

export const nonFunctionalDesignContentSchema = z.object({
  performance: z.string().optional(),
  availability: z.string().optional(),
  monitoring: z.string().optional(),
  security: z.string().optional(),      // ★追加
  scalability: z.string().optional(),   // ★追加
});

export const deliverableSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "成果物名は必須です"),
  type: deliverableTypeSchema,
  entryPoint: z.string().nullable(),
  design: z.object({
    function: functionDesignContentSchema.nullable(),
    data: dataDesignContentSchema.nullable(),
    exception: exceptionDesignContentSchema.nullable(),
    auth: authDesignContentSchema.nullable(),
    non_functional: nonFunctionalDesignContentSchema.nullable(),
  }),
});
```

**変更**: `lib/domain/entities.ts`
- `SystemFunction`に`deliverables: Deliverable[]`を追加
- `category`に`@deprecated`コメント

**変更**: `lib/domain/enums.ts`
- `SrfCategory`, `SystemRequirementCategory`に`@deprecated`コメント

### Phase 3: データアクセス層

**変更**: `lib/data/system-functions.ts`
- `toSystemFunction`: deliverablesの読み取り・正規化
- 既存データがある場合はsystem_design + entry_pointsから自動変換

**新規**: `lib/data/deliverable-migration.ts`
```typescript
// 既存データの移行ロジック
export function migrateToDeliverables(
  systemDesign: SystemDesignItem[],
  entryPoints: EntryPoint[]
): Deliverable[]
```

**変更**: `lib/data/system-requirements.ts`
- `category`の読み書きを段階的に廃止
- `relatedDeliverableIds`の読み書き追加

### Phase 4: UIコンポーネント

**削除**:
- `components/forms/EntryPointsEditor.tsx`（成果物に統合）

**新規**:
- `components/forms/design/deliverable-list.tsx` - 成果物リスト
- `components/forms/design/deliverable-card.tsx` - 成果物カード

**大幅変更**:
- `components/forms/design/system-design-editor.tsx` → `deliverable-editor.tsx`

**変更**:
- `app/(with-sidebar)/system-domains/[id]/[srfId]/edit/page.tsx`
  - BasicInfoSectionから`category`を削除
  - `EntryPointsEditor`を削除
  - `SystemDesignEditor`を`DeliverableEditor`に置換
- `app/(with-sidebar)/system-domains/[id]/[srfId]/edit/components/BasicInfoSection.tsx`
  - `category`セレクトを削除
- `app/(with-sidebar)/system-domains/[id]/[srfId]/edit/hooks/useSystemFunctionForm.ts`
  - `deliverables`状態管理を追加

### Phase 5: データマイグレーション

**スクリプト**: `scripts/migrate-to-deliverables.ts`

1. 全system_functionsを取得
2. system_design + entry_points → deliverables に変換
3. UPDATE実行
4. 検証

### Phase 6: クリーンアップ

- 旧カラム（category, entry_points, system_design）をDROP
- deprecated警告を削除

---

## 変更ファイル一覧

| ファイル | 変更種別 |
|----------|----------|
| `supabase/migrations/YYYYMMDD_add_deliverables.sql` | 新規 |
| `lib/domain/schemas/deliverable.ts` | 新規 |
| `lib/data/deliverable-migration.ts` | 新規 |
| `components/forms/design/deliverable-list.tsx` | 新規 |
| `components/forms/design/deliverable-card.tsx` | 新規 |
| `lib/domain/entities.ts` | 変更 |
| `lib/domain/enums.ts` | 変更 |
| `lib/data/system-functions.ts` | 変更 |
| `lib/data/system-requirements.ts` | 変更 |
| `components/forms/design/system-design-editor.tsx` | 大幅変更 |
| `app/(with-sidebar)/system-domains/[id]/[srfId]/edit/page.tsx` | 変更 |
| `app/(with-sidebar)/system-domains/[id]/[srfId]/edit/components/BasicInfoSection.tsx` | 変更 |
| `app/(with-sidebar)/system-domains/[id]/[srfId]/edit/hooks/useSystemFunctionForm.ts` | 変更 |
| `components/forms/EntryPointsEditor.tsx` | 削除 |
| `scripts/migrate-to-deliverables.ts` | 新規 |

---

## 検証方法

### 手動テスト
1. `/system-domains/GL/SRF-027/edit` を開く
2. 基本情報に「機能分類」がないことを確認
3. 成果物を追加し、5観点のタブで設計を入力
4. 保存後、DBのdeliverablesカラムを確認
5. システム要件に「カテゴリ」がなく、成果物への紐づけがあることを確認

### E2Eテスト（Playwright）
- 成果物の追加・編集・削除
- 観点タブの切り替え
- 既存データの表示（後方互換性）

---

## リスクと対策

| リスク | 対策 |
|--------|------|
| データ損失 | マイグレーション前にバックアップ、ロールバック可能な段階的移行 |
| UI破損 | フィーチャーフラグで新旧UIを切り替え可能に（オプション） |
| 移行漏れ | 検証スクリプトで全レコード確認 |
