# Markdownバッジ統一チェックリスト

## 作業概要

マークダウン入力欄に「Markdown」バッジを統一的に表示するよう改修。
現在はシステム機能編集画面のみバッジがあり、他画面では不足している。

---

## 更新対象ファイル

### 1. MarkdownTextareaEditコンポーネント ✅

ファイル: `components/product-requirement/markdown-textarea-edit.tsx`

#### 実装項目
- [x] Badgeコンポーネントをimport
- [x] Labelとflex配置でバッジを右上に追加

#### 確認項目
- [ ] PRD編集画面でバッジが表示される

---

### 2. LabeledTextareaコンポーネント ✅

ファイル: `components/ui/labeled-textarea.tsx`

#### 実装項目
- [x] Badgeコンポーネントをimport
- [x] `showMarkdownBadge?: boolean`プロップスを追加
- [x] バッジ表示ロジック追加（showMarkdownBadge=true時のみ）

#### 確認項目
- [ ] 既存の使用箇所に影響しない（デフォルトfalse）

---

### 3. DD編集画面 ✅

ファイル: `components/forms/design-document/DesignDocumentCard.tsx`

#### 実装項目
- [x] 概要（summary）にバッジ追加
- [x] 設計方針（designPolicy）にバッジ追加

#### 確認項目
- [ ] DD編集画面でバッジが表示される

---

### 4. システム機能作成画面 ✅

ファイル: `app/(with-sidebar)/system/[id]/create/components/SystemFunctionBasicInfoForm.tsx`

#### 実装項目
- [x] Badgeコンポーネントをimport
- [x] 機能概要にバッジ追加
- [x] 設計方針のテキストをバッジに変更

#### 確認項目
- [ ] システム機能作成画面でバッジが表示される

---

### 5. 業務タスク画面（編集） ✅

ファイル: `app/(with-sidebar)/business/[id]/[taskId]/edit/components/TaskBasicInfoCard.tsx`

#### 実装項目
- [x] 業務概要に`showMarkdownBadge`追加
- [x] 業務コンテキストに`showMarkdownBadge`追加

#### 確認項目
- [ ] 業務タスク編集画面でバッジが表示される

---

### 6. 業務タスク画面（作成） ✅

ファイル: `app/(with-sidebar)/business/[id]/create/components/TaskForm.tsx`

#### 実装項目
- [x] 業務概要に`showMarkdownBadge`追加
- [x] 業務コンテキストに`showMarkdownBadge`追加

#### 確認項目
- [ ] 業務タスク作成画面でバッジが表示される

---

## 統合テスト

### 表示確認
- [ ] システム機能編集画面：バッジ表示（既存）
- [ ] システム機能作成画面：バッジ表示（新規）
- [ ] PRD編集画面：バッジ表示（新規）
- [ ] DD編集画面：バッジ表示（新規）
- [ ] 業務タスク編集画面：バッジ表示（新規）
- [ ] 業務タスク作成画面：バッジ表示（新規）

### デザイン確認
- [ ] 全画面でバッジデザインが統一されている

---

## 完了基準

- [ ] 上記すべてのチェック項目が完了
- [ ] アプリケーションがエラーなく起動
- [ ] TypeScriptエラーなし
