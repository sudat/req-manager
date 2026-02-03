# チャットUI追加修正計画

## 概要
前回の修正完了後、ユーザーから追加の要望があった。

1. **ユーザーメッセージの幅** - max 400pxに固定する（機械的な折り返し）
2. **ProgressStepsのステータス表示** - 完了済みステップに「回答済」を表示する

---

## 変更ファイル一覧

| ファイル | 変更内容 | 変更行数概算 |
|---------|---------|-------------|
| `components/ai-chat/message-bubble.tsx` | ユーザーメッセージ幅を400pxに固定 | 1行 |
| `components/ai-chat/progress-steps.tsx` | ステータスラベルを「回答済」に変更 | 1行 |

**合計**: 2 files, 約2 lines

---

## 詳細設計

### 1. ユーザーメッセージの幅固定 (message-bubble.tsx)

**現状 (37行目):**
```tsx
<div className={cn(isUser ? 'max-w-[80%]' : 'max-w-full')}>
```

**変更後:**
```tsx
<div className={cn(isUser ? 'max-w-[400px]' : 'max-w-full')}>
```

**理由:**
- `max-w-[80%]` は画面サイズに依存して幅が変化する
- `max-w-[400px]` で固定することで、一貫した折り返しを実現
- 長いテキストも機械的に400pxで折り返される

### 2. ProgressStepsのステータス表示変更 (progress-steps.tsx)

**現状 (19-30行目):**
```tsx
const statusLabel = (status: ChatProgressStep['status']) => {
  switch (status) {
    case 'running':
      return '進行中';
    case 'done':
      return '完了';
    case 'error':
      return 'エラー';
    default:
      return status;
  }
};
```

**変更後:**
```tsx
const statusLabel = (status: ChatProgressStep['status']) => {
  switch (status) {
    case 'running':
      return '進行中';
    case 'done':
      return '回答済';  // '完了' → '回答済' に変更
    case 'error':
      return 'エラー';
    default:
      return status;
  }
};
```

**表示例:**
```
Step 1: 回答作成 回答済
Step 2: 回答作成 進行中
```

---

## 難易度評価

```
難易度: ★☆☆
根拠: 2 files, 約2 lines, 2 components
リスク: CSSと表示文字列の変更のみ、ロジック変更なし
```

---

## 検証方法（E2Eテスト）

### テスト項目
1. [ ] ユーザーメッセージがmax 400pxで固定されている
2. [ ] 長いテキストが400pxで機械的に折り返される
3. [ ] ProgressStepsの完了済みステップに「回答済」と表示される
4. [ ] ProgressStepsの進行中ステップに「進行中」と表示される

### Playwright MCPでの確認
```bash
# 1. チャットページに移動
await page.goto('http://localhost:3000/chat')

# 2. 長いメッセージを送信して幅を確認
await page.locator('textarea').fill('こんにちは' * 50)
await page.locator('textarea').press('Enter')

# 3. スクリーンショットで400px固定を確認
# 4. ProgressStepsのステータス表示を確認
```

---

## 実装順序

1. message-bubble.tsx - ユーザーメッセージ幅を400pxに固定
2. progress-steps.tsx - ステータスラベルを「回答済」に変更
3. E2Eテストで動作確認
