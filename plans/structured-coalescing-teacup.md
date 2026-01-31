# チャット機能修正計画

## 難易度

```
難易度: ★★☆
根拠: 2 files, ~60 lines, 2 components (UI + Agent)
リスク: エージェントプロンプト変更後の振る舞い検証が必要
```

## 修正対象ファイル

| ファイル | 修正内容 |
|----------|----------|
| `components/ai-chat/chat-messages.tsx` | UI修正3件 |
| `lib/mastra/agents/requirements-agent.ts` | エージェントプロンプト修正4件 |

---

## Part 1: UI/UX修正

### ①2個メッセージ欄が表示される問題

**場所**: `chat-messages.tsx` 68行目付近

**原因**: `isLoading && (...)` のローディングバブルと、ストリーミング中のアシスタントメッセージが同時表示

**修正**:
```tsx
// ストリーミング中のアシスタントメッセージがあるか判定
const hasStreamingMessage = messages.some(
  (m) => m.role === 'assistant' && m.isStreaming
);

// ストリーミング中でない場合のみローディングバブル表示
{isLoading && !hasStreamingMessage && (
  // ローディングバブル
)}
```

### ②「途中経過をご覧ください」を削除

**場所**: `chat-messages.tsx` 156-160行目

**修正**:
```tsx
// Before
{message.isStreaming
  ? '回答を生成中です。途中経過をご覧ください。'
  : '途中経過をご覧ください。'}

// After
{message.isStreaming ? '回答を生成中です。' : ''}
```

### ③cursor-pointer追加

**場所**: `chat-messages.tsx` 231行目

**修正**: ボタンのclassNameに `cursor-pointer` を追加

---

## Part 2: エージェント振る舞い修正

### 問題点1&2: 冗長な出力を簡潔に

**場所**: `requirements-agent.ts` プロンプト

**追加する指示**:
```
### 出力の簡潔さ（重要）
- 草案は1回だけ提示する
- 「私の理解」と「草案」を分けて2回出さない
- 必要項目の一覧を列挙しない（すぐに草案を生成する）
- btDraftToolを呼んだら、その結果をそのまま提示する
```

### 問題点3&4: データが失われる・結合される

**場所**: `requirements-agent.ts` Working Memory例（189-214行目付近）

**原因**:
- 例の `content` が部分的（codeとnameのみ）
- 配列データを文字列に変換している

**修正**: 例を完全なデータに変更し、注意書きを追加

```json
{
  "activeDrafts": [{
    "type": "bt",
    "content": {
      "code": "GL-001",
      "name": "一般会計の締め処理",
      "summary": "...",
      "businessContext": "...",
      "processSteps": ["ステップ1", "ステップ2", "ステップ3"],
      "input": ["入力1", "入力2"],
      "output": ["出力1", "出力2"],
      "business_domain_id": "BIZ-GL-001",
      "project_id": "xxx-uuid-xxx"
    },
    "status": "draft"
  }]
}
```

**追加する注意書き**:
```
**重要**:
- contentにはbtDraftToolの出力（btDraft）をそのまま保存する
- processSteps, input, outputは配列のまま保持する
- 文字列に結合したり省略したりしない
```

---

## 実装順序

1. `chat-messages.tsx` のUI修正（①②③）
2. `requirements-agent.ts` のプロンプト修正
3. Playwright MCPで動作検証

---

## 検証方法

### UI検証
1. チャットでメッセージ送信 → ローディングバブルが2個出ないことを確認
2. 途中経過ボタンにホバー → cursor-pointerになることを確認
3. 「途中経過をご覧ください」が表示されないことを確認

### エージェント検証
1. 「GLの税務調査対応を登録したい」と入力
2. 必要項目一覧が出ず、すぐに草案が提示されることを確認
3. 「登録して」でコミット後、DBでprocess_steps/input/outputが正しく保存されていることを確認
