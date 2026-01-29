# AIチャット「解凍中」永遠に続く問題 - 修正プラン（改訂版）

## 問題概要

### 症状
- AIチャットでメッセージを送信すると、「解凍中」（ローディング）表示が永遠に続く
- ユーザーは何分待ってもAIの応答を受け取れない

### 根本原因
ログ調査により発見:

```
[Chat API] Stream finishReason: Promise { 'stop', ... }
```

**`stream.finishReason` は Promise を返す** が、現在のコードでは `await` していないため、Promise オブジェクトのまま評価されている。

---

## 修正内容

### 対象ファイル: `app/api/chat/route.ts`

**修正前（問題あり）:**
```typescript
const finishReason = stream.finishReason;  // Promiseのまま
if (finishReason && typeof finishReason === 'object') { ... }
```

**修正後:**
```typescript
const finishReason = await stream.finishReason;  // 値を取得
```

---

## 完全な修正コード（`start` 関数内）

```typescript
async start(controller) {
  try {
    console.log('[Chat API] Starting text stream...');

    const textPromise = stream.text;

    for await (const chunk of stream.textStream) {
      console.log('[Chat API] Chunk received, length:', chunk.length);
      const data = encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      controller.enqueue(data);
    }

    await textPromise;
    console.log('[Chat API] Stream text completed');

    // ★ ここが修正ポイント：finishReasonをawaitする
    const finishReason = await stream.finishReason;
    console.log('[Chat API] Stream finishReason:', finishReason);

    if (finishReason && typeof finishReason === 'object') {
      const { unified, raw } = finishReason;
      if (unified === 'error' || unified === 'length' || unified === 'content-filter') {
        throw new Error(`Stream ended abnormally: ${unified} (raw: ${raw})`);
      }
    }

    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
    controller.close();
  } catch (error: any) {
    console.error('[Chat API] Stream error:', error);
    const errorData = {
      error: true,
      message: error.message || 'ストリーミングエラーが発生しました',
    };
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`));
    controller.close();
  }
}
```

---

## 検証方法

1. サーバーを再起動: `bun dev`
2. チャットでメッセージ送信
3. ログ確認:
   - `[Chat API] Stream finishReason: stop` （Promiseではなく値が出力されるはず）
   - `[Chat] [DONE] marker received` （クライアントコンソール）
4. ローディング表示が消えることを確認
