# PRD 3.8/3.9 準拠修正プラン

## 概要
PRD 3.8（受入基準）と 3.9（実装単位SD）の仕様に対して、実装が乖離している部分を修正する。
特に deprecated なカード（システム設計・SF直下エントリポイント・Deliverables）を完全削除し、`impl_unit_sds` テーブルに統一する。

---

## 難易度
```
難易度: ★★☆
根拠: 8 files, 約200 lines, 3 components削除 + 5 files修正
リスク: deprecated コンポーネント削除による既存データ表示不可（意図通り）
```

---

## 修正内容

### Phase 1: deprecated コンポーネント削除（UI）

#### 1.1 削除対象ファイル（3ファイル）
| ファイル | 理由 |
|----------|------|
| `components/system-domains/deliverables-section.tsx` | 旧deliverables表示（impl_unit_sdsに統一） |
| `components/system-domains/system-design-section.tsx` | 旧systemDesign表示（deprecated） |
| `components/system-domains/entry-points-section.tsx` | 旧entryPoints表示（deprecated） |

#### 1.2 修正対象ファイル

**`components/system-domains/index.ts`**
- 削除コンポーネントの export を削除

**`app/(with-sidebar)/system-domains/[id]/[srfId]/page.tsx`**（SF詳細画面）
- `DeliverablesSection` の import/使用を削除
- `EntryPointsSection` の import/使用を削除
- `SystemDesignSection` の import/使用を削除

**`app/(with-sidebar)/system-domains/[id]/[srfId]/edit/page.tsx`**（SF編集画面）
- `DeliverableList` の使用を削除（ImplUnitSdListに統一）
- `EntryPointsEditor` の使用を削除

**`app/(with-sidebar)/system-domains/[id]/create/page.tsx`**（SF作成画面）
- `DeliverableList` の使用を削除
- `EntryPointsEditor` の使用を削除

---

### Phase 2: 型定義のクリーンアップ

**`lib/domain/entities.ts`**
- `SystemFunction` から deprecated フィールドを削除:
  - `systemDesign` (deprecated)
  - `entryPoints` (deprecated)
  - `deliverables` → 残すか削除するか要検討

**`lib/domain/schemas/deliverable.ts`**
- スキーマファイル全体を削除

---

### Phase 3: 実装単位SD の PRD 準拠強化

**`components/forms/impl-unit-sd-list.tsx`**
- `type` フィールドをドロップダウン化（現在はテキスト入力）
- 選択肢を PRD 準拠の4種類に制限:
  - `screen` (画面)
  - `api` (API)
  - `batch` (バッチ)
  - `external_if` (外部I/F)

**`lib/domain/entities.ts`**
- `ImplUnitType` を4種類に限定:
```typescript
export type ImplUnitType = "screen" | "api" | "batch" | "external_if";
```

---

## スコープ外（今回対応しない）

### AC（受入基準）のオプションフィールド
PRD では以下がオプションだが未実装。優先度低のため今回スコープ外:
- `dependencies`（他SRへの依存関係）
- `given.test_data`
- `then.verification_steps`

### DBカラム削除
deprecated な DB カラムは残す（データ移行の安全性確保）:
- `system_functions.deliverables`
- `system_functions.entry_points`
- `system_functions.system_design`

---

## 作業順序

1. **deprecated コンポーネントの使用箇所を削除**
   - SF詳細/編集/作成画面から該当セクションを削除

2. **index.ts の export 削除**

3. **コンポーネントファイル削除**
   - deliverables-section.tsx
   - system-design-section.tsx
   - entry-points-section.tsx

4. **impl-unit-sd-list.tsx の type ドロップダウン化**

5. **型定義の整理**（オプション）

---

## 検証方法

1. **SF詳細画面**:
   - `ImplUnitSdSection` のみ表示されることを確認
   - 旧カード（システム設計、エントリポイント、成果物）が表示されないこと

2. **SF編集画面**:
   - 実装単位SD（IU）のみ編集可能であることを確認
   - type がドロップダウンで4種類から選択できること

3. **SF作成画面**:
   - 実装単位SD（IU）のみ入力可能であることを確認

4. **Playwright MCP** でE2Eテスト実行

---

## 影響ファイル一覧

### 削除（3ファイル）
- `components/system-domains/deliverables-section.tsx`
- `components/system-domains/system-design-section.tsx`
- `components/system-domains/entry-points-section.tsx`

### 修正（6ファイル）
- `components/system-domains/index.ts`
- `app/(with-sidebar)/system-domains/[id]/[srfId]/page.tsx`
- `app/(with-sidebar)/system-domains/[id]/[srfId]/edit/page.tsx`
- `app/(with-sidebar)/system-domains/[id]/create/page.tsx`
- `components/forms/impl-unit-sd-list.tsx`
- `lib/domain/entities.ts`

### 削除候補（要確認）
- `lib/domain/schemas/deliverable.ts`
- 編集画面用 `SystemDesignSection.tsx`（存在すれば）
