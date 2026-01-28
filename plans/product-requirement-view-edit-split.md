# プロダクト要件画面の閲覧・編集分離実装計画

## 概要

現在の `/product-requirement` ルートを、閲覧モードと編集モードに分割する。

- **View Mode**: `/product-requirement` - 読み取り専用の表示画面
- **Edit Mode**: `/product-requirement/edit` - 現在の編集機能

## 現状の課題

1. 現在の `/product-requirement/page.tsx` は編集機能のみ
2. Markdown/YAMLがそのまま表示されるため、読みづらい
3. 既存の `/business/[id]/[taskId]/` パターン（閲覧・編集分離）と一貫性がない

## 実装方針

### 1. ファイル構成

```
app/(with-sidebar)/product-requirement/
├── page.tsx                  # View Mode（新規作成）
└── edit/
    └── page.tsx             # Edit Mode（現在のpage.tsxを移行・修正）

components/product-requirement/  # 新規ディレクトリ
├── view-header.tsx         # View Mode用ヘッダー（編集ボタン含む）
├── edit-header.tsx         # Edit Mode用ヘッダー（キャンセル・保存ボタン）
├── basic-info-view.tsx     # 基本情報タブの閲覧コンポーネント
├── basic-info-edit.tsx     # 基本情報タブの編集コンポーネント
├── tech-stack-view.tsx     # 技術スタックタブの閲覧コンポーネント
├── tech-stack-edit.tsx     # 技術スタックタブの編集コンポーネント
├── markdown-field-view.tsx # Markdownフィールドの閲覧表示
└── yaml-field-view.tsx     # YAMLフィールドの閲覧表示（シンタックスハイライト）
```

### 2. コンポーネント設計

#### 2.1 共通ヘッダーコンポーネント

**`view-header.tsx`**
```tsx
interface ViewHeaderProps {
  productRequirement: ProductRequirement | null;
  onEdit: () => void;
}

// 機能:
// - プロダクト要件タイトル
// - PR ID表示
// - 編集ボタン（/product-requirement/edit へ遷移）
```

**`edit-header.tsx`**
```tsx
interface EditHeaderProps {
  isSaving: boolean;
  canSave: boolean;
  onCancel: () => void;
  onSave: () => void;
}

// 機能:
// - 戻るリンク（/product-requirement へ）
// - キャンセルボタン（確認ダイアログ付き）
// - 保存ボタン
```

#### 2.2 Markdown閲覧コンポーネント

**`markdown-field-view.tsx`**
```tsx
interface MarkdownFieldViewProps {
  label: string;
  content: string;
}

// 既存の MarkdownRenderer を使用
// 空の場合は「未入力」を表示
```

#### 2.3 YAML閲覧コンポーネント

**`yaml-field-view.tsx`**
```tsx
interface YamlFieldViewProps {
  label: string;
  content: string | null;
}

// 機能:
// - <pre><code> でYAMLを整形表示
// - 空の場合は「未入力」を表示
// - 必要に応じてシンタックスハイライト（将来的な拡張）
```

#### 2.4 基本情報タブ

**`basic-info-view.tsx`**
- MarkdownRendererで各フィールドを表示
- targetUsers, experienceGoals, qualityGoals, designSystem, uxGuidelines

**`basic-info-edit.tsx`**
- 現在のTextareaロジックを抽出
- バリデーション状態管理

#### 2.5 技術スタックタブ

**`tech-stack-view.tsx`**
- YAML形式の techStackProfile, codingConventions, forbiddenChoices を表示

**`tech-stack-edit.tsx`**
- 現在の YamlTextareaField を使用

### 3. ページ実装

#### 3.1 View Mode (`page.tsx`)

```tsx
export default function ProductRequirementViewPage() {
  // データ取得
  const { currentProject } = useProject();
  const [productRequirement, setProductRequirement] = useState<ProductRequirement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useEffectでデータ取得（現在のロジックを再利用）
  
  return (
    <>
      <MobileHeader />
      <ViewHeader 
        productRequirement={productRequirement}
        onEdit={() => router.push('/product-requirement/edit')}
      />
      {loading && <Skeleton />}
      {error && <ErrorAlert />}
      {productRequirement && (
        <Tabs defaultValue="basic">
          <TabsContent value="basic">
            <BasicInfoView data={productRequirement} />
          </TabsContent>
          <TabsContent value="tech">
            <TechStackView data={productRequirement} />
          </TabsContent>
        </Tabs>
      )}
    </>
  );
}
```

#### 3.2 Edit Mode (`edit/page.tsx`)

現在の `page.tsx` のロジックをベースに、以下を変更:

1. ヘッダーを `EditHeader` に置き換え
2. キャンセルボタンで `/product-requirement` に戻る
3. 保存成功時に `/product-requirement` にリダイレクト
4. フォームコンポーネントを分離

```tsx
export default function ProductRequirementEditPage() {
  // 現在のステート管理ロジックを維持
  // useYamlValidation, useState など
  
  const router = useRouter();
  
  const handleSave = async () => {
    // 現在の保存ロジック
    // 成功時: router.push('/product-requirement');
  };
  
  const handleCancel = () => {
    // 変更がある場合は確認ダイアログ
    // router.push('/product-requirement');
  };
  
  return (
    <>
      <MobileHeader />
      <EditHeader
        isSaving={saving}
        canSave={canSave}
        onCancel={handleCancel}
        onSave={handleSave}
      />
      {/* 現在のフォームコンテンツ */}
    </>
  );
}
```

### 4. データフロー

```
View Mode (page.tsx)
  ├─ データ取得: getProductRequirementByProjectId
  ├─ 表示: MarkdownRenderer + YAML code block
  └─ 編集ボタン → Edit Mode へ遷移

Edit Mode (edit/page.tsx)
  ├─ データ取得: getProductRequirementByProjectId
  ├─ フォーム状態管理: useState
  ├─ バリデーション: useYamlValidation
  ├─ 保存: createProductRequirement / updateProductRequirement
  └─ 保存成功 → View Mode へ遷移
```

### 5. カスタムフックの抽出（オプション）

複雑なロジックをカスタムフックに抽出して再利用性を向上:

```tsx
// hooks/use-product-requirement-form.ts
export function useProductRequirementForm(projectId: string) {
  // データ取得、ステート管理、バリデーション、保存処理
  // View Mode と Edit Mode で共通のデータ取得ロジックを共有
}
```

### 6. YAML表示のデザイン

View ModeでのYAML表示には、シンプルな `<pre><code>` を使用:

```tsx
<pre className="bg-slate-900 text-slate-100 p-4 rounded-md overflow-x-auto text-xs font-mono">
  <code>{yamlContent}</code>
</pre>
```

オプションで、将来的にシンタックスハイライトライブラリ（例: `react-syntax-highlighter`）を追加可能。

### 7. ナビゲーション

```
/product-requirement
  ├─ [編集ボタン] → /product-requirement/edit
  
/product-requirement/edit
  ├─ [戻るリンク] → /product-requirement
  ├─ [キャンセルボタン] → /product-requirement (確認ダイアログ付き)
  └─ [保存成功後] → /product-requirement (自動遷移)
```

### 8. エッジケース考慮

#### 8.1 データが存在しない場合

- **View Mode**: 「プロダクト要件が未登録です」と表示し、新規作成を促す
- **Edit Mode**: 新規作成フォームを表示

#### 8.2 プロジェクト未選択時

- 両モードで「プロジェクトを選択してください」を表示

#### 8.3 保存時のエラーハンドリング

- 現在のエラーロジックを維持
- バリデーションエラーは Edit Mode で表示

#### 8.4 キャンセル時の変更確認

- フォームに変更がある場合は確認ダイアログを表示
- 変更がない場合は即座に View Mode へ遷移

### 9. 実装順序

1. **コンポーネントディレクトリ作成**
   - `components/product-requirement/` 作成

2. **共有コンポーネント実装**
   - `markdown-field-view.tsx`
   - `yaml-field-view.tsx`

3. **View Mode 実装**
   - `view-header.tsx`
   - `basic-info-view.tsx`
   - `tech-stack-view.tsx`
   - `page.tsx`（新規View Mode）

4. **Edit Mode 移行**
   - 現在の `page.tsx` を `edit/page.tsx` に移動
   - `edit-header.tsx` 作成
   - フォームコンポーネント分離（オプション）

5. **ナビゲーション実装**
   - 編集ボタン ← View Mode
   - 戻る・キャンセル・保存 ← Edit Mode

6. **テスト・動作確認**
   - データ取得、表示、保存フロー全体の確認

### 10. 依存関係の確認

**既存コンポーネントの再利用:**
- `MarkdownRenderer` (`components/markdown/markdown-renderer.tsx`)
- `YamlTextareaField` (`components/forms/yaml-textarea-field.tsx`)
- `useYamlValidation` (`hooks/use-yaml-validation.ts`)

**既存データレイヤーの再利用:**
- `getProductRequirementByProjectId`
- `createProductRequirement`
- `updateProductRequirement`
- すべて `lib/data/product-requirements.ts` に実装済み

**既存UIコンポーネントの再利用:**
- `Card`, `Button`, `Input`, `Label`, `Tabs`, `Textarea`
- `MobileHeader`, `useProject`

### 11. 将来の拡張可能性

- YAMLのシンタックスハイライト追加
- 編集履歴機能
- 差分表示（変更前後の比較）
- PDF出力機能
- アクセス権限管理（閲覧専用ユーザー）

## 難易度評価

**難易度: ★★☆**
- **根拠**: 5-7 files, 300-400 lines, 複数コンポーネント連携
- **リスク**: 
  - 状態管理の複雑化（View/Edit間のデータ同期）
  - フォームの変更検出ロジック
  - 既存機能のリグレッション

## 成功基準

- [ ] View ModeでMarkdownが正しくレンダリングされる
- [ ] View ModeでYAMLが読みやすく表示される
- [ ] Edit Modeで既存の保存機能が正常に動作する
- [ ] View/Edit間の遷移がスムーズに行われる
- [ ] キャンセル時の確認ダイアログが機能する
- [ ] `/business/[id]/[taskId]/` パターンとの整合性が取れている

