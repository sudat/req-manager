# ラベル変更・helperText削除 実装計画

## 概要

**難易度**: ★☆☆
**根拠**: 3 files, 約15行変更, 依存なし
**リスク**: なし（純粋なUIテキスト変更）

## 変更内容

### 1. 業務要件フィールドのラベル日本語化
- `goal` → 「ゴール」
- `owner` → 「オーナー」
- `constraints` → 「制約条件」

### 2. helperText削除
- `constraints`: 「守るべき業務ルールや制度を箇条書きで記載します。」
- `concept_ids`: 「関連概念IDをバッジで管理します（任意）。」

### 3. 照会画面でゴールラベル追加
- 現在は値だけ表示されてるので、「ゴール」ラベルを追加

---

## 対象ファイルと変更箇所

### ファイル1: `components/forms/requirement-card.tsx`
新規作成・編集画面の業務要件カード

| 行 | 項目 | 変更内容 |
|----|------|----------|
| 130 | goalラベル | `goal` → `ゴール` |
| 139 | constraintsラベル | `constraints` → `制約条件` |
| 143 | constraints helperText | 削除 |
| 147 | ownerラベル | `owner` → `オーナー` |

**変更前（goal）**:
```tsx
<Label className="text-[12px] font-medium text-slate-500">
  goal
</Label>
```

**変更後**:
```tsx
<Label className="text-[12px] font-medium text-slate-500">
  ゴール
</Label>
```

---

### ファイル2: `app/(with-sidebar)/business/[id]/[taskId]/business-requirement-card.tsx`
照会画面の業務要件カード

| 行 | 項目 | 変更内容 |
|----|------|----------|
| 63-67 | goal表示 | 「ゴール」ラベル追加 |
| 84 | ownerラベル | `owner` → `オーナー` |
| 91 | constraintsラベル | `constraints` → `制約条件` |

**変更前（goal表示部分）**:
```tsx
{displayGoal && (
  <div className="mt-2 text-[13px] text-slate-700">
    <MarkdownRenderer content={displayGoal} />
  </div>
)}
```

**変更後**:
```tsx
{displayGoal && (
  <div className="mt-2">
    <div className="text-[12px] font-medium text-slate-500">ゴール</div>
    <div className="text-[13px] text-slate-700 mt-1">
      <MarkdownRenderer content={displayGoal} />
    </div>
  </div>
)}
```

---

### ファイル3: `app/(with-sidebar)/business/[id]/[taskId]/edit/components/TaskBasicInfoCard.tsx`
編集画面の業務タスク基本情報

| 行 | 項目 | 変更内容 |
|----|------|----------|
| 101 | concept_ids helperText | 削除 |

※ `constraints` は `ProcessStepsField` 経由で表示されており、ラベルは `TaskForm.tsx` 側で指定済み

---

### ファイル4: `app/(with-sidebar)/business/[id]/create/components/TaskForm.tsx`
新規作成画面の業務タスクフォーム

| 行 | 項目 | 変更内容 |
|----|------|----------|
| 151 | concept_ids helperText | 削除 |

---

## 検証方法

### 手動検証手順

1. **新規作成画面** (`/business/AR/create`)
   - [ ] 業務要件セクションで「ゴール」「制約条件」「オーナー」ラベルが表示される
   - [ ] constraintsのhelperTextが表示されない
   - [ ] concept_idsのhelperTextが表示されない

2. **照会画面** (`/business/AR/BT-AR-0001`)
   - [ ] goalの上に「ゴール」ラベルが表示される
   - [ ] 「オーナー」「制約条件」ラベルが表示される

3. **編集画面** (`/business/AR/BT-AR-0001/edit`)
   - [ ] 業務要件セクションで「ゴール」「制約条件」「オーナー」ラベルが表示される
   - [ ] concept_idsのhelperTextが表示されない

### Playwright MCP での自動検証（オプション）

```bash
# 開発サーバー起動
bun run dev

# 以下のURLにアクセスしてスクリーンショット確認
# - http://localhost:3000/business/AR/create
# - http://localhost:3000/business/AR/BT-AR-0001
# - http://localhost:3000/business/AR/BT-AR-0001/edit
```

---

## 変更サマリー

| 画面 | ファイル | 変更点 |
|------|----------|--------|
| 新規作成 | `TaskForm.tsx` | concept_ids helperText削除 |
| 新規作成・編集 | `requirement-card.tsx` | goal/owner/constraintsラベル変更、constraints helperText削除 |
| 照会 | `business-requirement-card.tsx` | goalラベル追加、owner/constraintsラベル変更 |
| 編集 | `TaskBasicInfoCard.tsx` | concept_ids helperText削除 |
