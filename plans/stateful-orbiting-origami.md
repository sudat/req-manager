# BR草案カード表示 実装計画

## 課題
業務要件（BR）登録時に、業務タスク（BT）と同様に照会画面に近いカードが表示されない。
テキスト＋プログレスのみで草案が提示される。

## 難易度
難易度: ★★☆
根拠: 5 files, 約60 lines, 3 components連携
リスク: ツール名の解決パターン（変数名 vs ID）が不明確。既存BTパターンに合わせて変数名で実装。

---

## 根本原因
BT登録のカード表示フローが以下のように実装されているが、BRは途中で途絶える。

```
ツール実行 → chunk-handlers.ts で toolName 検出 → draft イベント送信
  → use-streaming-chat.ts で受信 → ChatMessage に draft 設定
  → message-bubble.tsx で DraftPreviewCard 表示
```

| 段階 | BT（動作済み） | BR（未実装） |
|------|--------------|-------------|
| ツール実装 | `bt-draft.ts` (id: `bt_draft`, export: `btDraftTool`) | `br-draft.ts` (id: `br_draft`, export: `brDraftTool`) ✓ 済み |
| ツール出力 | `{ btDraft: {...} }` | `{ brDraft: {...} }` ✓ 済み |
| chunk-handlers 検出 | `meta.toolName === 'btDraftTool'` → `sendData({ event: 'draft', draft })` | **未実装** |
| ChatMessage 型 | `btDraft?: BtDraft` | **フィールドなし** |
| ストリーミングフック | `data.event === 'draft'` → `message.btDraft = data.draft` | **区別ロジックなし** |
| カードコンポーネント | `DraftPreviewCard`（BT专用） | **未実装** |
| message-bubble 表示 | `message.btDraft && <DraftPreviewCard>` | **未実装** |

---

## 変更ファイル一覧

### 1. `components/ai-chat/types.ts`（変更）
**BrDraft型の追加と ChatMessage フィールド拡張**

追加する型（brDraftToolの outputSchema から導出）:
```typescript
export type BrDraft = {
  code: string;
  requirement: string;
  rationale: string;
  business_task_id: string;
  concept_ids?: string[];
};
```

ChatMessage に追加:
```typescript
brDraft?: BrDraft;
```

### 2. `app/api/chat/lib/chunk-handlers.ts`（変更）
**handleToolResult 内に brDraftTool 検出処理を追加**

Line 175（btDraftTool ブロックの閉じ花かっこ）の直後に追加。
パターンはLine 141-151と同じ。

```typescript
if (meta.toolName === 'brDraftTool') {
  const output = meta.output as { brDraft?: unknown };
  if (output?.brDraft) {
    ctx.sendData({ event: 'draft', draftType: 'br', draft: output.brDraft });
  }
}
```

注意: `draftType: 'br'` を送信データに付与する。BT側は `draftType` なしのままで後方互換を維持。

### 3. `hooks/use-streaming-chat.ts`（変更）
**draft イベント処理で draftType を判定**

現在のLine 192-204:
```typescript
if (data.event === 'draft' && data.draft) {
  assistantMessage.btDraft = data.draft;
  setMessages((prev) => prev.map(...{ btDraft: assistantMessage.btDraft }));
}
```

変更後:
```typescript
if (data.event === 'draft' && data.draft) {
  if (data.draftType === 'br') {
    assistantMessage.brDraft = data.draft;
    setMessages((prev) => prev.map(...{ brDraft: assistantMessage.brDraft }));
  } else {
    // draftType が 'bt' か未定義の場合は BT として扱う（後方互換）
    assistantMessage.btDraft = data.draft;
    setMessages((prev) => prev.map(...{ btDraft: assistantMessage.btDraft }));
  }
}
```

### 4. `components/ai-chat/br-draft-preview-card.tsx`（新規作成）
**BRカードコンポーネント**

- `draft-preview-card.tsx` と同じスタイルパターン（ヘッダー・InfoRow・border）を使用
- ヘッダータイトル: `業務要件草案`
- 表示項目: コード・要件・根拠・業務タスクID の 4 行（InfoRow）
- InfoRow は draft-preview-card.tsx と同じ実装をコピーする（各ファイルで小規模なため共通化は YAGNI）

### 5. `components/ai-chat/message-bubble.tsx`（変更）
**BrDraftPreviewCard のインポートと表示**

Line 3に import 追加:
```typescript
import { BrDraftPreviewCard } from './br-draft-preview-card';
```

Line 70-72（btDraft 表示の直後）に追加:
```typescript
{message.brDraft && (
  <BrDraftPreviewCard draft={message.brDraft} />
)}
```

---

## 実装順序
1. types.ts — 型の基盤（他の変更の前提）
2. chunk-handlers.ts — サーバー側イベント送信
3. use-streaming-chat.ts — フロント側イベント受信
4. br-draft-preview-card.tsx — カードコンポーネント新規
5. message-bubble.tsx — カード表示トリガー

---

## 検証方法
1. サーバー起動: `bun run dev`
2. `http://localhost:3000/chat` へ遷移
3. BR登録依頼を送信（既存の「BR登録」クイックアクション）
4. レスポンスで業務要件草案カードが表示されることを確認
5. BT登録も行い、既存のBTカード表示が壊れていないことを確認
6. Playwright MCPでスクリーンショット検証

---

## 設計原則
- **KISS**: draftType フィールドで単純に分岐。汎用型や Factory パターンは不要
- **YAGNI**: InfoRow の共通化は今は不要（2つのファイルにのみ）。将来的に SF/SR/AC/SD カード追加時に検討
- **後方互換**: draftType が未定義の場合は BT として扱う（既存BT動作に影響なし）
