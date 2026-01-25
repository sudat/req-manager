# System-Domain Edit Page Layout Fix

## 目的
`/system-domains/[id]/[srfId]/edit` ページのレイアウト修正:
- カードの順序を変更: 基本情報 → システム要件 → システム設計 → エントリポイント
- 各カード間に一貫したgap（`space-y-4`）を追加

## 現状の課題

**現在の順序:**
1. BasicInfoSection (`mb-4` あり)
2. SystemDesignEditor (**マージンなし**)
3. EntryPointsEditor (`mb-4` あり)
4. RequirementListSection (`mt-4` あり)

**問題点:**
- SystemDesignEditorに下マージンがないため、カード間が詰まっている
- RequirementListSectionが最後にある（システム要件を2番目にしたい）

## 実装計画

### Step 1: page.tsx で順序変更とwrapper追加

**ファイル:** `app/(with-sidebar)/system-domains/[id]/[srfId]/edit/page.tsx`

4つのセクションを `div` でラップし、順序を入れ替える:

```tsx
// 変更前（220-257行目）
<BasicInfoSection ... />
<SystemDesignEditor ... />
<EntryPointsEditor ... />
<RequirementListSection ... />

// 変更後
<div className="space-y-4">
  <BasicInfoSection ... />
  <RequirementListSection ... />
  <SystemDesignEditor ... />
  <EntryPointsEditor ... />
</div>
```

**変更内容:**
- `<div className="space-y-4">` でラップ（各カード間に1remのgapを追加）
- `RequirementListSection` を2番目に移動
- `SystemDesignEditor` を3番目に移動
- `EntryPointsEditor` を4番目に移動

### Step 2: 各コンポーネントの個別マージンを削除

spacingを一元管理するため、各コンポーネントの個別マージンを削除:

| ファイル | 行 | 変更内容 |
|----------|----|----------|
| `BasicInfoSection.tsx` | 48 | `mb-4` を削除 |
| `EntryPointsEditor.tsx` | 45 | `mb-4` を削除 |
| `requirement-list-section.tsx` | 38 | `mt-4` を削除 |
| `system-design-editor.tsx` | 138 | （変更なし、元々マージンなし） |

## 修正ファイル一覧

| ファイル | 変更内容 |
|----------|----------|
| `app/(with-sidebar)/system-domains/[id]/[srfId]/edit/page.tsx` | 順序変更 + `space-y-4` wrapper追加 |
| `app/(with-sidebar)/system-domains/[id]/[srfId]/edit/components/BasicInfoSection.tsx` | `mb-4` 削除 |
| `components/forms/EntryPointsEditor.tsx` | `mb-4` 削除 |
| `components/forms/requirement-list-section.tsx` | `mt-4` 削除 |

## 難易度評価

**難易度:** ★☆☆
**根拠:** 4ファイル、約10行変更、ロジック変更なし
**リスク:** 低 - 純粋なレイアウト変更のみ

## 検証方法

1. `http://localhost:3000/system-domains/GL/SRF-027/edit` にアクセス
2. 以下を確認:
   - [ ] カードの順序が「基本情報 → システム要件 → システム設計 → エントリポイント」である
   - [ ] 各カード間に一貫したgapがある
   - [ ] レスポンシブデザインが崩れていない
