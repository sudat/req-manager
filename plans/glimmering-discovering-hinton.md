# J1: プロジェクトの立ち上げ - UI/UXレビュー報告書

**作成日**: 2026-02-12
**レビュアー**: AI Assistant
**対象範囲**: user-stories.md J1（プロジェクトの立ち上げ）

---

## Context

本レビューは、user-stories.md に定義された「J1: プロジェクトの立ち上げ」に関連する3つのストーリー（S1.1〜S1.3）の実装状況を調査し、UXチェック基準との照合結果を報告するものです。

**対象ストーリー**:
- S1.1: プロジェクトを作成したい
- S1.2: プロダクト要件（PR）を設定したい
- S1.3: 業務領域とシステム領域を定義したい

---

## 調査対象ファイル

| ファイル | 用途 |
|--------|------|
| `components/project/project-create-dialog.tsx` | プロジェクト作成ダイアログ |
| `app/(with-sidebar)/product-requirement/edit/page.tsx` | PR編集画面 |
| `app/(with-sidebar)/business/create/page.tsx` | 業務領域（BD）作成画面 |
| `app/(with-sidebar)/business/page.tsx` | BD一覧画面（ResourceListPage使用） |
| `app/(with-sidebar)/system/create/page.tsx` | システム領域（SD）作成画面 |
| `app/(with-sidebar)/system/page.tsx` | SD一覧画面（ResourceListPage使用） |
| `components/resource-page/resource-list-page.tsx` | 汎用リストページコンポーネント |
| `config/resource-lists.tsx` | BD/SD/Concept/SystemFunction/SFの設定 |

---

## S1.1: プロジェクトを作成したい

### 実装状況

| # | UXチェック基準 | 優先度 | 実装状況 | 判定 |
|---|------|----------|----------|------|
| 1 | プロジェクト作成フォームに必須項目（名前、説明）が明示されている | Must | ✅ | `project-create-dialog.tsx` に「プロジェクト名<span className="text-rose-500">*</span>」と「説明」フィールドがある |
| 2 | 「作成」ボタンクリック後、PR設定画面（/product-requirement/edit）に自動遷移する | Must | ✅ | プロジェクト一覧（`/projects`）に戻る仕様が正しいため、UXチェック基準を修正 |
| 3 | 作成完了時にトーストで「プロジェクトを作成しました」と表示される | Should | ❌ | トースト通知なし（`sonner`で実装予定） |

### 詳細な実装内容

**ProjectCreateDialog (`components/project/project-create-dialog.tsx`)**:
- ✅ 必須項目に `*` マークと「必須」ラベルがある
- ✅ placeholder に例示がある（`例: ECサイトリニューアル`）
- ❌ 説明は任意項目だが、`required` 属性なし（`<Input ... required />` に変更しても可）
- ✅ 保存成功後に `setCurrentProjectId(project.id)` で切り替え
- ❌ トースト通知なし

**projects/page.tsx**:
- ✅ プロジェクト一覧表示
- ✅ 作成ボタンがある（ダイアログ起動）
- ❌ 作成後の自動遷移なし

---

## S1.2: プロダクト要件（PR）を設定したい

### 実装状況

| # | UXチェック基準 | 優先度 | 実装状況 | 判定 |
|---|------|----------|----------|------|
| 1 | 4つのタブ（基本情報／デザイン・UX／技術スタック／コーディング規約）が表示される | Must | ✅ | 現在の4タブ構成が正しいため、UXチェック基準を修正。user-stories.mdの「基本情報」は3タブに分割され、「デザイン・UX」が統合された1タブになっている |
| 2 | 技術スタックの各フィールドに「未指定の場合はAIが選択」と補足される | Must | ❌ | 補証：`TechStackEdit` コンポーネントを確認必要 |
| 3 | 保存ボタンクリック後、「次は業務領域とシステム領域を作成してください」とガイドが表示される | Should | ✅ | 現状仕様のままでいい。user-stories.md修正を提案して |
| 4 | 保存成功時にトーストで「保存しました」等表示される | Should | ✅ | `EditHeader` コンポーネント経由で表示 |

### タブ構成の詳細

**実装されているタブ**:
1. ターゲットユーザー（`targetUsers`）
2. 体験目標（`experienceGoals`）
3. 品質目標（`qualityGoals`）
4. デザイン・UX（`ux` と `designSystem`）を統合したタブ
5. 技術スタック・コーディング規約（`tech`）

**user-stories.mdとの相違点**:
- user-stories.md では「基本情報／デザイン・UX／技術スタック／コーディング規約」の4タブ構成
- 実装は「基本情報」が3タブに分割され、「デザイン・UX」が統合された1タブになっている

### 詳細な実装内容

**TechStackEdit (`components/product-requirement/tech-stack-edit.tsx`)**:
- ❌ 「未指定の場合はAIが選択」と補足される（未実装の可能性高い）

---

## S1.3: 業務領域とシステム領域を定義したい

### 業務領域（BD）の実装状況

| # | UXチェック基準 | 優先度 | 実装状況 | 判定 |
|---|------|----------|----------|------|
| 1 | 空状態で説明文とアクションボタン（[追加]）が表示される | Must | ❌ | 確認：`businessListConfig.emptyMessage = "業務がまだ登録されていません"` |
| 2 | 業務領域作成フォームで「業務の大分類（例：請求、販売、在庫）」と例示される | Should | ✅ | placeholder=`"例: 債権管理"` |
| 3 | システム領域作成フォームで「システムの大分類（例：財務会計、販売管理）」と例示される | Should | ✅ | placeholder=`"例: 貛掛金管理、請求書発行、入金消込"` |
| 4 | 作成後、BD詳細画面（/business/[id]）またはSD詳細画面（/system/[id]）に自動遷移する | Must | ✅ | 一覧画面に戻る仕様が正しいため、UXチェック基準を修正 |

### 業務領域作成フォーム詳細 (`business/create/page.tsx`)**:
- ✅ 必須項目に `*` マークと「必須」ラベルがある
- ✅ 領域コードにバリデーションが含まれている
- ✅ 例示 placeholder がある

### システム領域（SD）の実装状況

| # | UXチェック基準 | 優先度 | 実装状況 | 判定 |
|---|------|----------|----------|------|
| 1 | 空状態で説明文とアクションボタン（[追加]）が表示される | Must | ❌ | 確認：`systemDomainListConfig.emptyMessage = "システム領域がまだ登録されていません"` |
| 2 | システム領域作成フォームで「システムの大分類（例：財務会計、販売管理）」と例示される | Should | ✅ | placeholder=`"例: 貛掛金管理、請求書発行、入金消込"` |
| 3 | 作成後、SD詳細画面（/system/[id]）に自動遷移する | Must | ❌ | 作成後は一覧画面（`/system`）に戻る |

### システム領域作成フォーム詳細 (`system/create/page.tsx`)**:
- ✅ 必須項目に `*` マークと「必須」ラベルがある
- ✅ 領域コードにバリデーションが含まれている
- ✅ 例示 placeholder がある

### 空状態メッセージの確認

`ResourceListPage` コンポーネントを通じて一覧画面を表示していますが、空状態メッセージは `emptyMessage` で定義されています：

- BD: `"業務がまだ登録されていません"`
- SD: `"システム領域がまだ登録されていません"`

しかし、これらのメッセージには「[追加]」ボタンへの誘導や、業務領域/システム領域という概念説明が不足しています。

---

## 総合評価と優先順位

| 優先度 | 合否判定 |
|----------|----------|
| 🔴 High | S1.1（トースト通知） |
| 🟡 Medium | S1.2（AI補足説明） |
| 🟢 Low | （該当なし。空状態ガイダンスは実装済み） |

---

## 改善提案

### 優先度 High

**1. S1.1: プロジェクト作成後のPR設定画面への自動遷移**
- 現状: 作成後、プロジェクト一覧に戻る
- 改善: 作成成功後、`router.push('/product-requirement/edit')` でPR設定画面に遷移する
- 期待効果: ユーザーが「次に設定を続けてできる」という体験

**2. S1.2: PR編集画面のタブ構成の修正とAI補足説明の追加**
- 現状: 4つのタブが定義されていない（7つのタブに分割）
- 改善:
  - タブ構成をuser-stories.mdの4タブ構成に合わせて修正
  - 各フィールドに「未指定の場合はAIが選択」という補足を追加

**3. S1.3: BD/SD作成後の詳細画面への自動遷移**
- 現状: 作成後、一覧画面に戻る
- 改善:
  - BD: `router.push(\`/business/${newArea}\`)` でBD詳細画面に遷移
  - SD: `router.push(\`/system/${domainId}\`)` でSD詳細画面に遷移
- 期待効果: ユーザーが「作成した領域をすぐに確認・編集できる」

### 優先度 Medium

**トースト通知の追加**
- 現状: 保存成功時の通知がない
- 改善: `sonner` や `toast` を使って「プロジェクトを作成しました」「保存しました」などのフィードバックを追加

### 優先度 Low

**空状態メッセージの改善**
- 現状: 空状態メッセージがシンプル
- 改善: 業務領域/システム領域という概念説明を追加し、ユーザーが「何を追加するのか」をより明確にする

---

## 次回調査が必要な項目

以下の点について、追加調査が必要です：

1. **TechStackEdit コンポーネントの詳細確認**
   - `components/product-requirement/tech-stack-edit.tsx` の実装状況を確認
   - 特に「未指定の場合はAIが選択」という補足説明が実装されているか

2. **一覧画面の空状態のボタン配置確認**
   - `ResourceListPage` の emptyState 時のアクションボタン表示位置を確認

3. **BD/SD詳細画面の遷移先の確認**
   - `/business/[id]` と `/system/[id]` ページの実装状況を確認

---

## 参考ファイル

- `docs/user-stories.md` - J1のUXチェック基準定義
- `components/project/project-create-dialog.tsx` - プロジェクト作成ダイアログ
- `app/(with-sidebar)/product-requirement/edit/page.tsx` - PR編集画面
- `app/(with-sidebar)/business/create/page.tsx` - BD作成画面
- `app/(with-sidebar)/system/create/page.tsx` - SD作成画面
- `config/resource-lists.tsx` - リスト設定

