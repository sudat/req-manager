# 閲覧モードのUI改善計画

## 概要

プロダクト要件閲覧ページで、マークダウンが正しくレンダリングされていない問題と、技術スタックの表示改善を実施する。

**現在の課題:**
1. 閲覧モードでマークダウンがレンダリングされず、テキストとして表示されている
2. 技術スタック・規約タブがYAML形式で表示されて見にくい

**解決策:**
1. 既存の `MarkdownRenderer` を使用してマークダウンをレンダリング
2. 技術スタック・規約タブも階層型UIで表示する（閲覧モード用コンポーネントを作成）

---

## 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `components/product-requirement/markdown-textarea-view.tsx` | `MarkdownRenderer` を使用するように修正 |
| `components/product-requirement/tech-stack-view.tsx` | 階層型表示コンポーネントに置き換え |
| `components/forms/hierarchical-editor/viewer.tsx` | 閲覧モード用階層エディタ（新規） |

---

## 実装内容

### 1. マークダウンレンダリング対応

**変更前:** `whitespace-pre-wrap` でテキストをそのまま表示
**変更後:** 既存の `MarkdownRenderer` コンポーネントを使用

### 2. 技術スタックの階層型表示

**変更前:** `YamlFieldView` でYAML形式で表示
**変更後:** 階層型キー・バリュー表示コンポーネントを作成

**UIデザイン案:**
```
┌─ 技術スタック ─────────────────────────┐
│ ▼ frontend                              │
│   • framework: Next.js                  │
│   • language: TypeScript                │
│ ▼ backend                               │
│   • framework: NestJS                   │
└────────────────────────────────────────┘
```

---

## 実装手順

### Step 1: マークダウン表示を修正
1. `markdown-textarea-view.tsx` で `MarkdownRenderer` を使用

### Step 2: 階層エディタの閲覧モードコンポーネントを作成
1. `components/forms/hierarchical-editor/viewer.tsx` を新規作成
2. 階層データを読み取り専用で再帰表示

### Step 3: 技術スタック表示を更新
1. `tech-stack-view.tsx` で階層エディタの閲覧モードを使用

---

## 検証方法

### 動作確認
1. 閲覧ページで各タブを表示
2. マークダウンが正しくレンダリングされていること
3. 技術スタックが階層型で表示されていること

### 確認項目
- ✅ 見出し（h1-h3）が正しく表示
- ✅ 箇条書き（ul/ol）が正しく表示
- ✅ 強調（strong/em）が正しく表示
- ✅ コード（code）が正しく表示
- ✅ 技術スタックの入れ子構造が見やすい
