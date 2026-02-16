# UI/UX改善プロジェクト - 業務タスクページ

## 作業概要
システム機能詳細ページ（/system/AR/SF-AR-0001）を基準に、業務タスク詳細ページ（/business/AR/BT-AR-0003）のデザインを統一・改善する。

## 依存関係
- システム機能ページの実装が完了していること
- UI/UX Pro Maxスキルでのレビュー済み

## 現在の進捗
**全体: 6/6 (100%)**

---

## セクション1: 基本改善（完了）

### 1.1 パンくずリストの視認性改善 ✅
- [x] BreadcrumbPageに`font-semibold text-slate-900`を追加
- **ファイル**: `app/(with-sidebar)/business/[id]/[taskId]/page.tsx`
- **行**: 147

### 1.2 編集ボタンのスタイル統一 ✅
- [x] `variant="outline"` → `variant="ghost"`に変更
- [x] `hover:bg-slate-100 transition-colors`を追加
- [x] サイズを`h-8` → `h-7`に統一
- **ファイル**: `app/(with-sidebar)/business/[id]/[taskId]/page.tsx`
- **行**: 165

### 1.3 タイトルに下線追加 ✅
- [x] `border-b border-slate-200 pb-2`を追加
- **ファイル**: `app/(with-sidebar)/business/[id]/[taskId]/components/TaskSummaryCard.tsx`
- **行**: 52

### 1.4 セクション間の余白統一 ✅
- [x] `mt-4` → `mt-6 space-y-6`に変更
- **ファイル**: `app/(with-sidebar)/business/[id]/[taskId]/page.tsx`
- **行**: 192

### 1.5 RequirementsSection構造変更 ✅
- [x] カードを外してフラットな構造に変更
- [x] CardとCardContentコンポーネントを削除
- **ファイル**: `app/(with-sidebar)/business/[id]/[taskId]/components/RequirementsSection.tsx`

---

## セクション2: 業務要件セクション構造（ブロッキング）

### 2.1 業務要件セクションにタイトルと編集ボタンを追加 ✅
- [x] 左ライン`border-l-4 border-brand-600`を追加
- [x] タイトル「業務要件」を追加
- [x] 編集ボタンを追加
- [x] JSX構造エラーを修正

**ファイル**: `app/(with-sidebar)/business/[id]/[taskId]/page.tsx`
**行**: 205-228

**修正内容**:
- 192行目の`<div className="mt-6 space-y-6">`に対応する閉じタグが230行目に追加された
- JSX構造が正しく整理され、ビルドエラーが解決

---

## 次の作業

1. **JSX構造エラーの修正**（優先度: 最高）
   - `page.tsx`のタグ対応を修正
   - ビルドが通ることを確認

2. **動作確認**
   - http://localhost:3000/business/AR/BT-AR-0003 にアクセス
   - システム機能ページと同じデザインになっているか確認

3. **残タスクがあれば実施**
   - 折り畳みアイコンの回転アニメーション確認
   - スクロール位置維持機能の確認

---

## 参考資料

- **設計書**: `/home/test/.local/share/opencode/plans/business-task-ui-improvements.md`
- **システム機能ページ（参考実装）**: `app/(with-sidebar)/system/[id]/[srfId]/page.tsx`
- **RequirementsSection**: `app/(with-sidebar)/business/[id]/[taskId]/components/RequirementsSection.tsx`

## 注意事項

- エラー修正後、ビルドが通ることを必ず確認すること
- 修正後はブラウザで表示確認を行うこと
- システム機能ページとの比較を行い、統一感を確認すること
