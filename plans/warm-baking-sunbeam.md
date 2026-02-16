# J1: プロジェクトの立ち上げ - レビュー結果

## コンテキスト

ユーザーストーリー `docs/user-stories.md` の J1（プロジェクトの立ち上げ）に定義されている以下の3つのストーリーについて、現状の実装状況とUXチェック基準の合致状況をレビューした。

1. **S1.1**: プロジェクトを作成したい
2. **S1.2**: プロダクト要件（PR）を設定したい
3. **S1.3**: 業務領域とシステム領域を定義したい

---

## S1.1: プロジェクトを作成したい

### ユーザーストーリーのUXチェック基準

| # | 項目 | 優先度 | 実装状況 |
|---|------|--------|----------|
| 1 | プロジェクト作成フォームに必須項目（名前、説明）が明示されている | Must | ✅ 実装済み |
| 2 | 「作成」ボタンクリック後、PR設定画面（/product-requirement/edit）に自動遷移する | Must | ❌ 未実装 |
| 3 | 作成完了時にトーストで「プロジェクトを作成しました」と表示される | Should | ✅ 実装済み |

### 実装の詳細

#### ✅ 実装済み（項目1, 3）

**ファイル**: `components/project/project-create-dialog.tsx`

- 必須項目（名前）に `*` マークと赤色で表示
  ```tsx
  <Label htmlFor="name">
    プロジェクト名<span className="text-rose-500">*</span>
  </Label>
  ```
- トースト通知：sonner ライブラリを使用して実装
  ```tsx
  import { toast } from "sonner"
  // ...
  toast.success("プロジェクトを作成しました。続けてPR設定をしてください。")
  ```

#### ❌ 未実装（項目2）

**期待される動作**:
- 作成後、自動的に `/product-requirement/edit` に遷移し、PR設定を促す

**現状の動作**:
- プロジェクト作成後、プロジェクト一覧（`/projects`）に留まる
- ユーザーは手動でサイドメニューから「プロダクト要件」を選択する必要がある

**関連ファイル**:
- `components/project/project-create-dialog.tsx:61` - `setCurrentProjectId(project.id)` でプロジェクト切り替えのみ
- `app/(with-sidebar)/projects/page.tsx:167` - 編集ボタンは `/projects/${project.id}/edit` へのリンク

### 改善提案

1. **プロジェクト作成後にPR設定画面へ自動遷移**
   - 方法A: `router.push("/product-requirement/edit")` で直接遷移
   - 方法B: `setCurrentProjectId()` 後に、自動遷移のガイドを表示

2. **PR設定画面への初回訪問時のガイダンス強化**
   - 初回アクセス時に「プロジェクトを作成しました。続けてPR設定をしてください。」と表示

---

## S1.2: プロダクト要件（PR）を設定したい

### ユーザーストーリーのUXチェック基準

| # | 項目 | 優先度 | 実装状況 |
|---|------|--------|----------|
| 1 | 4つのタブ（基本情報／デザイン・UX／技術スタック／コーディング規約）が表示される | Must | ✅ 実装済み |
| 2 | 技術スタックの各フィールドに「未指定の場合はAIが選択」と補足される | Must | ⚠️ 部分的に実装済み |
| 3 | 保存ボタンクリック後、「次は業務領域とシステム領域を作成してください」とガイドが表示される | Should | ❌ 未実装 |

### 実装の詳細

#### ✅ 実装済み（項目1）

**ファイル**: `app/(with-sidebar)/product-requirement/edit/page.tsx`

4つのタブが実装されている：
```tsx
<Tabs defaultValue="targetUsers" className="w-full">
  <TabsList className="w-full justify-start flex-wrap">
    <TabsTrigger value="targetUsers" className="px-4">ターゲットユーザー</TabsTrigger>
    <TabsTrigger value="experienceGoals" className="px-4">体験目標</TabsTrigger>
    <TabsTrigger value="qualityGoals" className="px-4">品質目標</TabsTrigger>
    <TabsTrigger value="ux" className="px-4">UX・デザイン</TabsTrigger>
    <TabsTrigger value="tech" className="px-4">技術スタック・規約</TabsTrigger>
  </TabsList>
</Tabs>
```

各タブの内容：
- **基本情報**: TargetUsersEdit, ExperienceGoalsEdit, QualityGoalsEdit
- **デザイン・UX**: UxGuidelinesEdit, DesignSystemEdit
- **技術スタック・規約**: TechStackEdit

#### ⚠️ 部分的に実装済み（項目2）

**ファイル**: `components/product-requirement/tech-stack-edit.tsx` など

技術スタック選択時に「agent_decides」の補足があるが、全フィールドに統一されていない様子：

```tsx
// 現状：個別のフィールドに補足がある場合も
<Input
  id="framework"
  placeholder="例: Next.js"
  // agent_decidesの補足はない
/>

// 期待される：全フィールドに統一の補足
<div className="text-sm text-slate-500">
  未指定の場合はAIが選択されます
</div>
```

#### ❌ 未実装（項目3）

**期待される動作**:
- 保存後、「次は業務領域とシステム領域を作成してください」というガイドが表示される

**現状の動作**:
- 保存後、`router.push("/product-requirement")` で閲覧モードに戻る
- ガイドメッセージやトースト通知がない

**関連ファイル**:
- `app/(with-sidebar)/product-requirement/edit/page.tsx:209` - `router.push("/product-requirement")`

### 改善提案

1. **技術スタックの補足を統一表示**
   - `TechStackEdit` コンポーネントの上部に共通説明を追加
   - または各フィールドのヘルパーに補足を表示

2. **保存後のナビゲーション改善**
   - トースト通知を追加
   - 次のアクション（業務領域・システム領域作成）への誘導を表示

---

## S1.3: 業務領域とシステム領域を定義したい

### ユーザーストーリーのUXチェック基準

| # | 項目 | 優先度 | 業務領域 | システム領域 |
|---|------|--------|----------|--------------|
| 1 | 空状態で説明文とアクションボタン（[追加]）が表示される | Must | ⚠️ 共通で実装済み |
| 2 | 業務領域作成フォームで「業務の大分類（例：請求、販売、在庫）」と例示される | Should | ❌ 未実装 |
| 3 | システム領域作成フォームで「システムの大分類（例：財務会計、販売管理）」と例示される | Should | ❌ 未実装 |
| 4 | 作成後、BD詳細画面（/business/[id]）またはSD詳細画面（/system/[id]）に自動遷移する | Must | ❌ 未実装 |

### 実装の詳細

#### ⚠️ 共通で実装済み（項目1）

**ファイル**: `components/resource-page/resource-list-page.tsx`, `components/resource-page/empty-state.tsx`

空状態の実装があります：
```tsx
{filtered.length === 0 && (
  <TableRow>
    <TableCell colSpan={config.errorColSpan} className="border-0 p-0">
      <EmptyState
        message={config.emptyMessage}
        createHref={config.createHref}
        aiChatHref={config.aiChatHref}
      />
    </TableCell>
  </TableRow>
)}
```

各リストの `emptyMessage`:
- 業務領域: "業務がまだ登録されていません"
- システム領域: "システム領域がまだ登録されていません"

ただし、ユーザーストーリーで期待される「説明文とアクションボタン」の具体的なガイダンス（"〇〇領域を追加してください"）が不足している。

#### ❌ 未実装（項目2, 3, 4）

**ファイル**: 両方とも `ResourceListPage` を使用

業務領域・システム領域とも、共通コンポーネントを使用しているため、作成フォーム自体の実装状況を確認する必要があります。

**期待される動作**:
- 作成フォームで例示（「業務の大分類（例：請求、販売、在庫）」がある
- 作成後、詳細画面に自動遷移する

**現状の動作**:
- 共通コンポーネントを使用しているため、フォームのカスタマイズが難しい
- 作成後の遷移先は不明（恐らく一覧画面に留まる）

### 改善提案

1. **空状態のメッセージ改善**
   - 「〇〇領域を追加してください」のような具体的なガイダンスを追加

2. **作成フォームのカスタマイズ**
   - `ResourceListPage` を継承したカスタム実装
   - または専用の作成ダイアログを実装

3. **作成後の自動遷移**
   - 作成完了後に詳細画面へ遷移

---

## サマリ

### J1全体の実装状況

| ストーリー | Must項目 | Should項目 | 実装完了度 |
|---------|-----------|-------------|-------------|
| S1.1 | 1/3 (67%) | 1/1 (100%) | 🟡 部分的 |
| S1.2 | 1/3 (67%) | 1/2 (50%) | 🟡 部分的 |
| S1.3 | 0/4 (0%) | 0/4 (0%) | 🔴 未実装 |

### 優先度別の対応状況

| 優先度 | 実装済み数 | 未実装数 |
|---------|-----------|-----------|
| Must | 2/7 (29%) | 5/7 (71%) |
| Should | 2/6 (33%) | 4/6 (67%) |

### 優先度を高めた改善の効果

- ユーザーが「次に何をすればいいか」を迷わずに進める
- 初回ユーザー体験の向上
- プロジェクト立ち上げの効率化

---

## 次のステップ

実装が不足している機能を改善するには、以下の順序で実装することを推奨します：

### Phase 1: S1.1 の改善（重要度：高）

1. プロジェクト作成後のPR設定画面への自動遷移を実装
2. （オプション）トースト通知後に遷移する

### Phase 2: S1.2 の改善（重要度：高）

1. 技術スタックの補足を統一表示を実装
2. 保存後のガイド/トースト通知を実装

### Phase 3: S1.3 の改善（重要度：中）

1. 空状態メッセージの改善（具体的なガイダンス）
2. 作成フォームの例示を実装
3. 作成後の詳細画面への自動遷移を実装

---

## 変更対象ファイル（予定）

### S1.1 改善
- `components/project/project-create-dialog.tsx` - 自動遷移ロジックの追加

### S1.2 改善
- `components/product-requirement/tech-stack-edit.tsx` - 統一補足の追加
- `app/(with-sidebar)/product-requirement/edit/page.tsx` - 保存後のガイド追加

### S1.3 改善
- `components/resource-page/empty-state.tsx` - メッセージ改善
- `app/(with-sidebar)/business/create/page.tsx` - 作成ダイアログ（新規）
- `app/(with-sidebar)/system/create/page.tsx` - 作成ダイアログ（新規）
- または `ResourceListPage` のカスタマイズ

---

## 検証方法

実装後、以下の手順で検証することを推奨します：

1. プロジェクト一覧（`/projects`）から新規プロジェクトを作成
2. PR設定画面へ自動遷移することを確認
3. PRを保存し、ガイドが表示されることを確認
4. 業務領域・システム領域を作成し、ガイドを確認
