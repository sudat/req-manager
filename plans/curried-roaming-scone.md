# 業務タスク草案カードコンポーネント表示不具合の修正

## 問題概要
業務タスク作成を依頼すると `btDraftTool` は正常に実行されるが、専用カードコンポーネント（`DraftPreviewCard`）が表示されない。

## 根本原因
`route.ts:399` の条件 `meta.toolName === 'bt_draft'` が、実際にMastraが返す `toolName`（`'btDraftTool'`）と一致しない。

### 詳細
1. ツール定義: `id: 'bt_draft'`（bt-draft.ts:15）
2. エージェント登録: `tools: { btDraftTool }` → ES6ショートハンドで `{ btDraftTool: btDraftTool }`
3. Mastraストリーム: toolsオブジェクトの**キー名**を `toolName` として返す
4. 結果: `'btDraftTool'` !== `'bt_draft'` で条件不一致

## 修正方針
**route.ts の条件を修正する（KISS原則）**

## 難易度
```
難易度: ★☆☆
根拠: 1 file, 1 line, 0 components
リスク: 極めて低い（条件文字列の変更のみ）
```

## 実装手順

### Step 1: route.ts の修正
**ファイル:** `app/api/chat/route.ts`
**行:** 399

変更前:
```typescript
if (meta.toolName === 'bt_draft') {
```

変更後:
```typescript
if (meta.toolName === 'btDraftTool') {
```

## 検証方法
1. Next.jsサーバーを再起動（最新コードを反映）
2. 業務タスク作成を依頼（例: 「ARに顧客登録という業務を追加して」）
3. 確認事項:
   - サーバーログに `[Chat API] Sending draft event with btDraft:` が出力される
   - UIに `DraftPreviewCard` が表示される

## 関連ファイル（参照のみ）
- `lib/mastra/agents/requirements-agent.ts` - ツール登録
- `lib/mastra/tools/bt-draft.ts` - ツール定義
- `hooks/use-streaming-chat.ts` - クライアント側のdraftイベント処理
- `components/ai-chat/draft-preview-card.tsx` - カードコンポーネント
