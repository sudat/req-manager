# 業務要件カードの初期表示を折り畳み状態にする

## 変更概要

**難易度**: ★☆☆

**根拠**: 1ファイル、1行変更、依存なし。成功率95%

**リスク**: なし - 初期state値の変更のみで、他への影響はない

## 変更内容

### 対象ファイル
- `app/(with-sidebar)/business/[id]/[taskId]/business-requirement-card.tsx`

### 修正箇所
**35行目**: 初期state値を `true` から `false` に変更

```tsx
// 修正前
const [isOpen, setIsOpen] = useState(true);

// 修正後
const [isOpen, setIsOpen] = useState(false);
```

## 理由

現在、業務要件カードは初期表示時に展開状態（`isOpen = true`）になっている。
ユーザーは初期表示時に折り畳み状態にしたいとの要望がある。

## 検証方法

1. 対象ページにアクセス: `http://localhost:3000/business/AR/BT-AR-0001`
2. 業務要件カードが折り畳まれた状態で表示されることを確認
3. カードをクリックして展開できることを確認

## 影響範囲

- **影響コンポーネント**: `BusinessRequirementCard` のみ
- **他のカード**: 影響なし（他のカードは別コンポーネントまたは折り畳み機能なし）
- **データフロー**: 変更なし
