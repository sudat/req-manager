# システム機能編集ページ分割計画

## Context

`/system/[domainId]/[srfId]/edit` の編集ページが「モノリス」状態で、基本情報・システム要件・DD（Design Document）を1画面で全部編集する重厚な構成になっている。17個のuseState、6ステップの逐次保存処理を抱え、ユーザーが基本情報だけ直したい場合でも全データをロードし、全セクションを表示してしまう。

**目的**: 詳細画面のカード単位で編集を分離し、認知負荷・データ取得量・保存の複雑度をすべて改善する。

```
難易度: ★★☆
根拠: 3 new pages + 3 new hooks + 2 modified files, ~400 lines new, ~300 lines reuse
リスク: 保存ロジック分割時のデータ整合性（特にrequirementIds同期）
```

---

## 方針

### Before（現状）
```
詳細画面 ─── [編集] ボタン1つ ──→ モノリス編集画面（基本情報 + SR + DD 全部入り）
```

### After（提案）
```
詳細画面
  ├── FunctionSummaryCard ─── [編集] ──→ /edit/basic（基本情報のみ）
  ├── SystemRequirementsSection ─── [編集] ──→ /edit/requirements（SR のみ）
  └── DesignDocumentSection ─── [編集] ──→ /edit/design-documents（DD のみ）
```

---

## Step 1: 保存ロジックの分割

現在の `saveSystemFunction()` (6ステップ) を3つの関数に分解する。

### ファイル: `lib/utils/system-functions/save-system-function.ts`

#### 既存: `saveSystemFunction()` → 残すが非推奨化（旧editページ削除時に除去）

#### 新規: `saveBasicInfo()`
```ts
// Step 1 のみ: updateSystemFunction() で基本フィールドだけ更新
// existingSrf から requirementIds, systemDesign, entryPoints, codeRefs を引き継ぎ
type SaveBasicInfoInput = {
  srfId: string;
  existingSrf: SystemFunction;
  systemDomainId: string;
  category: SrfCategory;
  status: SrfStatus;
  title: string;
  summary: string;
  designPolicy: string;
  projectId: string;
};
```

#### 新規: `saveSystemRequirements()`
```ts
// Step 2-4, 6: SR の delete+recreate + acceptance criteria + link sync
// + updateSystemFunction で requirementIds のみ更新
type SaveSystemRequirementsInput = {
  srfId: string;
  existingSrf: SystemFunction;
  systemDomainId: string;
  systemRequirements: Requirement[];
  projectId: string;
};
```

#### 新規: `saveDesignDocuments()`
```ts
// Step 5 のみ: DD の delete+recreate
type SaveDesignDocumentsInput = {
  srfId: string;
  designDocuments: DesignDocumentDraft[];
  projectId: string;
};
```

---

## Step 2: フック分割（3つの専用フック新規作成）

### `edit/hooks/useBasicInfoForm.ts`（新規）
- **State**: category, status, title, summary, designPolicy + loading/saving/error/existingSrf
- **Fetch**: `getSystemFunctionById()` のみ（軽量）
- **Save**: `saveBasicInfo()` → 成功時に詳細ページへ遷移

### `edit/hooks/useSystemRequirementsForm.ts`（新規）
- **State**: systemRequirements[] + loading/saving/error/existingSrf
- **Fetch**: `getSystemFunctionById()` + `listSystemRequirementsBySrfId()`
- **Actions**: add/update/remove（既存 `useSystemFunctionFormActions` から抽出）
- **Save**: `saveSystemRequirements()` → 成功時に詳細ページへ遷移

### `edit/hooks/useDesignDocumentsForm.ts`（新規）
- **State**: designDocuments[] + loading/saving/error
- **Fetch**: `getSystemFunctionById()` + `listDesignDocumentsBySrfId()`
- **Save**: `saveDesignDocuments()` → 成功時に詳細ページへ遷移

---

## Step 3: 新規ページ作成（3ページ）

### ルート構成
```
app/(with-sidebar)/system/[id]/[srfId]/edit/
  basic/page.tsx              ← NEW
  requirements/page.tsx       ← NEW
  design-documents/page.tsx   ← NEW
  page.tsx                    ← 詳細画面へリダイレクト（後方互換）
```

### 各ページの共通構造
```tsx
// 共通パターン（各ページで繰り返し。抽象化不要 = KISS）
<PageLayout>
  <BackLink to={`/system/${id}/${srfId}`} label="システム機能詳細に戻る" />
  <PageTitle>編集: {srf.title} - [セクション名]</PageTitle>
  <EditForm ... />
  <ActionButtons onSave={handleSave} onCancel={goBack} saving={saving} />
</PageLayout>
```

### `basic/page.tsx`（~80行）
- `useBasicInfoForm(srfId, systemDomainId)` で状態管理
- 既存 `BasicInfoSection` コンポーネントをそのまま再利用
- 最も軽量なページ

### `requirements/page.tsx`（~120行）
- `useSystemRequirementsForm(srfId, systemDomainId)` で状態管理
- 既存 `RequirementListSection` + `SelectionDialog` を再利用
- `useMasterData()` も必要（SelectionDialog用）

### `design-documents/page.tsx`（~60行）
- `useDesignDocumentsForm(srfId)` で状態管理
- 既存 `DesignDocumentList` をそのまま再利用
- 最もシンプルなページ

---

## Step 4: 詳細ページの修正

### ファイル: `app/(with-sidebar)/system/[id]/[srfId]/page.tsx`

#### 変更1: ヘッダーの「編集」ボタンを削除
```diff
- <Link href={`/system/${id}/${srf.id}/edit`}>
-   <Button variant="outline">編集</Button>
- </Link>
```

#### 変更2: 各セクションに個別の編集ボタンを追加

**FunctionSummaryCard** の右上に編集ボタン:
```tsx
<div className="flex items-center justify-between">
  <h2>基本情報</h2>
  <Link href={`/system/${id}/${srf.id}/edit/basic`}>
    <Button variant="ghost" size="sm"><Pencil className="h-3.5 w-3.5" /></Button>
  </Link>
</div>
```

**SystemRequirementsSection** のヘッダーに編集ボタン:
```tsx
<div className="flex items-center justify-between">
  <SectionLabel>仕様 > システム要件</SectionLabel>
  <Link href={`/system/${id}/${srf.id}/edit/requirements`}>
    <Button variant="ghost" size="sm"><Pencil className="h-3.5 w-3.5" /></Button>
  </Link>
</div>
```

**DesignDocumentSection** のヘッダーに編集ボタン:
```tsx
<div className="flex items-center justify-between">
  <SectionLabel>実装 > DD</SectionLabel>
  <Link href={`/system/${id}/${srf.id}/edit/design-documents`}>
    <Button variant="ghost" size="sm"><Pencil className="h-3.5 w-3.5" /></Button>
  </Link>
</div>
```

#### 変更3: 「AIで追加」ボタンはヘッダーに残す

---

## Step 5: 旧editページの後方互換

### ファイル: `app/(with-sidebar)/system/[id]/[srfId]/edit/page.tsx`

詳細画面へリダイレクト:
```tsx
import { redirect } from "next/navigation";

export default function SystemFunctionEditPage({ params }) {
  const { id, srfId } = use(params);
  redirect(`/system/${id}/${srfId}`);
}
```

これにより `/system/GL/SF-GL-0009/edit` へのブックマークやリンクが壊れない。

---

## Step 6: 不要コード削除

以下のファイルは全ページ移行完了後に削除可能:
- `edit/hooks/useSystemFunctionForm.ts`（オーケストレーター）
- `edit/hooks/useSystemFunctionFormState.ts`（巨大state）
- `edit/hooks/useSystemFunctionFormActions.ts`（混合アクション）
- `edit/hooks/useSystemFunctionDataFetch.ts`（全データfetch）
- `edit/components/SystemDesignSection.tsx`（既に未使用）
- `lib/utils/system-functions/save-system-function.ts` 内の旧 `saveSystemFunction()`

---

## 対象ファイル一覧

| ファイル | 操作 | 概要 |
|----------|------|------|
| `lib/utils/system-functions/save-system-function.ts` | 修正 | 3つの保存関数を追加 |
| `edit/hooks/useBasicInfoForm.ts` | 新規 | 基本情報用フック |
| `edit/hooks/useSystemRequirementsForm.ts` | 新規 | SR用フック |
| `edit/hooks/useDesignDocumentsForm.ts` | 新規 | DD用フック |
| `edit/basic/page.tsx` | 新規 | 基本情報編集ページ |
| `edit/requirements/page.tsx` | 新規 | SR編集ページ |
| `edit/design-documents/page.tsx` | 新規 | DD編集ページ |
| `[srfId]/page.tsx` | 修正 | 詳細ページにセクション別編集ボタン追加 |
| `edit/page.tsx` | 修正 | 詳細ページへリダイレクト化 |

---

## 検証方法

1. **基本情報編集**: `/system/GL/SF-GL-0009/edit/basic` → category/title等を変更 → 保存 → 詳細画面で反映確認
2. **SR編集**: `/system/GL/SF-GL-0009/edit/requirements` → SR追加/削除 → 保存 → 詳細画面で反映確認
3. **DD編集**: `/system/GL/SF-GL-0009/edit/design-documents` → DD追加/削除 → 保存 → 詳細画面で反映確認
4. **後方互換**: `/system/GL/SF-GL-0009/edit` → 詳細ページにリダイレクトされること
5. **詳細画面**: 各セクションの編集ボタンが正しいURLに遷移すること
6. **データ整合性**: 基本情報の保存でSR/DDが消えないこと、SR保存でDD/基本情報が変わらないこと
