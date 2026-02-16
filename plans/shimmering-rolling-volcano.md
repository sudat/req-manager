# 呼び出し元SF/DDボタンのtruncate修正

## Context

呼び出し元DD選択ダイアログ化 + SF名称表示追加の実装後、ユーザーから以下の報告がありました：

**問題**: 呼び出し元SF/DDのボタンで、文字がtruncateせずに入力項目の幅が広がっていない

## 原因分析

### Grid構造
```tsx
<div className="grid grid-cols-[repeat(4,1fr)_auto] gap-2 items-end">
```
- 各カラムは `1fr`（フレキシブル幅）
- 各カラムのButtonは `flex-1`（利用可能な全幅）

### 問題の原因
1. Buttonに `flex-1` があると、幅を広げ続ける
2. Button自体に `max-width` や固定幅がない
3. 内部の `span.truncate` は、親Buttonが幅を持たないとtruncateのタイミングを決められない

Tailwindの `truncate` が動作するには、親要素に**固定幅**または**`max-width`**が必要です。

---

## 実装計画

### 変更内容

呼び出し元SFとDDのButtonのclassNameを変更します：

**変更前**:
```tsx
className="flex-1 justify-start text-left h-8 px-2 text-sm truncate"
```

**変更後**:
```tsx
className="w-full justify-start text-left h-8 px-2 text-sm"
```

### 理由
- `flex-1` → `w-full` に変更することで、Gridカラムの幅に従うようになる
- Buttonの `truncate` は削除（内部の `span.truncate` で十分）
- 内部の `span className="truncate block"` は維持

### 変更対象ファイル
- `/usr/local/src/dev/wsl/personal-pj/req-manager/components/forms/design-document/DesignDocumentCard.tsx`
  - 呼び出し元SF Button（約467行目）
  - 呼び出し元DD Button（約512行目）

---

## 検証項目

1. 呼び出し元SFの文字列が長い場合、`...`で省略される
2. 呼び出し元DDの文字列が長い場合、`...`で省略される
3. 他のカラムの幅が圧迫されない
4. レイアウト崩れがない
