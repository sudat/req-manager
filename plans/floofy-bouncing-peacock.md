# BT草案の表形式UI表示

## 概要
AIチャットで業務タスク（BT）草案を表示する際、Markdown文字列ではなく専用の表形式UIコンポーネントでレンダリングする。

## 背景・課題
- 現状: `btDraftTool`が構造化JSONを返すが、AIがMarkdown文字列として表示
- 問題: AIの出力に依存するため、表記揺れ・項目抜けが発生しやすい
- 解決: ProgressStepsと同様のパターンで、専用UIコンポーネントを表示

## 難易度
```
難易度: ★★☆
根拠: 5 files, 約150-200 lines, 4 components
リスク: tool-resultの構造がMastraバージョンで異なる可能性
```

## 実装ステップ

### Step 1: 型定義の追加
**ファイル:** `components/ai-chat/types.ts`

```typescript
// BT草案の型定義
export type BtDraft = {
  code: string;
  name: string;
  summary: string;
  businessContext: string;
  processSteps: { when: string; who: string; action: string }[];
  input: { name: string; source: string }[];
  output: { name: string; source: string }[];
  business_domain_id: string;
  concept_ids?: string[];
};

// ChatMessageにbtDraftフィールドを追加
export type ChatMessage = {
  // ...既存フィールド
  btDraft?: BtDraft;
};
```

### Step 2: SSE送信処理の追加（サーバー側）
**ファイル:** `app/api/chat/route.ts`

`tool-result`イベント処理内（L368-391付近）で、bt_draftツールの結果を検出してdraftイベントを送信。

```typescript
if (chunkType === 'tool-result') {
  // 既存の処理...

  // bt_draftツールの結果を検出してdraftイベントを送信
  if (meta.toolName === 'bt_draft') {
    const output = meta.output as { btDraft?: any };
    if (output?.btDraft) {
      sendData({ event: 'draft', draft: output.btDraft });
    }
  }
}
```

### Step 3: SSE受信処理の追加（クライアント側）
**ファイル:** `components/ai-chat/chat-container.tsx`

progressイベント処理（L212-226）の直後にdraftイベント処理を追加。

```typescript
if (data.event === 'draft' && data.draft) {
  assistantMessage.btDraft = data.draft;
  setMessages((prev) =>
    prev.map((msg) =>
      msg.id === assistantMessage.id
        ? { ...msg, btDraft: assistantMessage.btDraft }
        : msg
    )
  );
  continue;
}
```

### Step 4: DraftPreviewCardコンポーネントの実装
**ファイル:** `components/ai-chat/draft-preview-card.tsx`（新規作成）

表形式UIで草案を表示。shadcn/uiのTableコンポーネントを使用。

```
+------------------------------------------+
| 📋 業務タスク草案               [未確定] |
+------------------------------------------+
| コード       | BT-GL-0001               |
| 業務名       | 月次売上集計               |
| 概要         | 月末に売上データを集計...   |
| 業務コンテキスト | 経営判断のための...      |
+------------------------------------------+
| 業務プロセス                              |
| いつ | だれが | 何を                      |
| 月末 | 経理  | データを集計               |
+------------------------------------------+
| インプット                               |
| 名称 | 取得元                            |
| 販売データ | 販売管理システム            |
+------------------------------------------+
| アウトプット                              |
| 名称 | 出力先                            |
| 売上管理表 | Excel                       |
+------------------------------------------+
```

### Step 5: chat-messages.tsxへの統合
**ファイル:** `components/ai-chat/chat-messages.tsx`

MessageBubble内で`btDraft`がある場合に`DraftPreviewCard`をレンダリング。
ProgressStepsの下、contentの前または後に配置。

```tsx
{message.btDraft && (
  <DraftPreviewCard draft={message.btDraft} />
)}
```

## 変更ファイル一覧

| ファイル | 変更内容 |
|----------|----------|
| `components/ai-chat/types.ts` | BtDraft型追加、ChatMessage拡張 |
| `app/api/chat/route.ts` | draftイベント送信ロジック追加 |
| `components/ai-chat/chat-container.tsx` | draftイベント受信・state更新 |
| `components/ai-chat/draft-preview-card.tsx` | **新規作成** - 表形式カード |
| `components/ai-chat/chat-messages.tsx` | DraftPreviewCard統合 |

## 検証方法

1. `bun dev`でサーバー起動
2. http://localhost:3000/chat にアクセス
3. 「月次売上集計の業務を登録して」などと入力
4. BT草案が表形式カードで表示されることを確認
5. 「はい」と回答して登録完了を確認

## 既存機能との共存

- `btDraft`と`content`は独立フィールド → 両方同時に表示可能
- AIは「登録しますか?」等のメッセージをcontent（Markdown）で返す
- 確定/キャンセルボタンはカード内に含めない（会話で「はい/いいえ」で判断）
