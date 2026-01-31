# 業務要件カードの縦幅調整

## 目的
業務要件カードの折り畳み状態での縦幅を短くするため、トリガーボタンの下部余白（`mb-3`）を削除する。

## 変更内容

### 修正ファイル
- `app/(with-sidebar)/business/[id]/[taskId]/business-requirement-card.tsx`

### 修正箇所（59行目）
`CollapsibleTrigger` の `className` から `mb-3` を削除

**修正前:**
```tsx
<CollapsibleTrigger className="flex flex-wrap items-start justify-between gap-2 mb-3 w-full text-left hover:bg-slate-50/50 rounded px-2 -mx-2 py-1 transition-colors cursor-pointer">
```

**修正後:**
```tsx
<CollapsibleTrigger className="flex flex-wrap items-start justify-between gap-2 w-full text-left hover:bg-slate-50/50 rounded px-2 -mx-2 py-1 transition-colors cursor-pointer">
```

## 難易度評価
**難易度**: ★☆☆
**根拠**: 1ファイル、1行のクラス削除のみ、依存関係なし
**リスク**: なし（純粋なスタイル調整）

## 検証方法
1. Playwright MCP で `http://localhost:3000/business/AR/BT-AR-0001` にアクセス
2. 業務要件カードが折り畳まれた状態でスクリーンショット取得
3. カード間の余白が適切に短くなっていることを視覚確認
