# FieldEditor Select の幅修正

## Context
Grid 列定義を `grid-cols-[20%_20%_1fr_auto_auto]` に変更したが、Select の幅が正しく 20% にならない。

### 問題の原因
shadcn/ui の SelectTrigger にデフォルトで `w-fit` が設定されており、Grid の列定義を無視してコンテンツ幅に縮んでしまう。

```tsx
// components/ui/select.tsx 40行目
<SelectTrigger className={cn("flex w-fit items-center ...", className)}>
```

---

## 実装計画

### 変更ファイル
`components/forms/FieldEditor.tsx`

### 変更内容
2箇所の SelectTrigger に `className="w-full"` を追加する。

#### 修正箇所1: 型の選択（79行目）
```tsx
// 修正前
<SelectTrigger>
  <SelectValue />
</SelectTrigger>

// 修正後
<SelectTrigger className="w-full">
  <SelectValue />
</SelectTrigger>
```

#### 修正箇所2: フォーマット（任意）（161行目）
```tsx
// 修正前
<SelectTrigger>
  <SelectValue placeholder="選択してください" />
</SelectTrigger>

// 修正後
<SelectTrigger className="w-full">
  <SelectValue placeholder="選択してください" />
</SelectTrigger>
```

---

## 技術的考慮事項

### className のマージ順序
- `cn()` ユーティリティは後に指定したクラスを優先する
- `w-full` がデフォルトの `w-fit` を正しく上書きする

### 一貫性
- Input コンポーネントはデフォルトで `w-full` が設定されている
- Select も `w-full` を指定することで、同じ幅制御を実現

---

## 検証方法
1. 画面をリロード
2. デザインドキュメント編集画面でフィールドエディタを表示
3. 1行目の名前・型・説明の幅が視覚的に 20%:20%:60% になっていることを確認
4. 型選択のドロップダウンを開いても幅が維持されていることを確認
