# GPT-5-mini Reasoning Effort 導入計画

## 📋 要約

ユーザー質問: 「GPT-5-miniを使っているAI機能で、リーズニングの強さ（reasoning effort）を指定できる？low, medium, highとか？」

OpenAI APIの最新仕様を調査した結果、**`reasoning_effort`パラメータが存在する**ことが判明。

---

## 🔍 調査結果

### 1. OpenAI APIのreasoning_effortパラメータ

**公式ドキュメント（Context7より）:**

```json
POST /chat/completions
{
  "model": "gpt-5.1",
  "messages": [...],
  "reasoning_effort": "high"  // ← これ！
}
```

**サポートされている値:**
- `none` - 推論なし
- `minimal` - 最小の推論
- `low` - 低い推論
- `medium` - 中程度の推論
- `high` - 高い推論
- `xhigh` - 最高の推論

**モデルごとのサポート状況:**

| モデル | デフォルト | サポート値 |
|--------|-----------|-----------|
| gpt-5.1 | `none` | `none`, `low`, `medium`, `high` |
| gpt-5.1以前 | `medium` | `low`, `medium`, `high`, `xhigh` (`none`は非サポート) |
| gpt-5-pro | `high` | `high`のみ |
| gpt-5.1-codex-max以降 | `medium` | 全て（`xhigh`含む） |

**効果:**
- reasoning effortを下げる → 応答が速くなる、トークン消費が減る
- reasoning effortを上げる → より深い推論、応答時間・トークン増加

### 2. 問題点: gpt-5-miniの記録がない

**現状の調査結果:**
- OpenAI APIドキュメントに`gpt-5-mini`についての明示的な記載がない
- gpt-5.1、gpt-5-pro、gpt-5.1-codex-maxなどは記載あり

**予想されるサポート状況:**
1. **ケースA**: gpt-5-miniはreasoning機能をサポートしていない（可能性高）
2. **ケースB**: gpt-5-miniはgpt-5.1と同様のサポート（デフォルト`none`）
3. **ケースC**: gpt-5-mini独自のサポート範囲がある

### 3. 現在のコードベース状況

**影響範囲:**

| ファイル | 行番号 | 現在の設定 |
|----------|--------|-----------|
| `lib/mastra/agents/requirements-agent.ts` | 226 | `model: 'openai/gpt-5-mini'` |
| `lib/mastra/tools/bt-draft.ts` | 163 | `temperature: 0.3` |
| `lib/mastra/tools/br-draft.ts` | 87 | `temperature: 0.3` |
| `lib/mastra/tools/system-draft.ts` | 152 | `temperature: 0.3` |
| `lib/mastra/tools/impl-unit-draft.ts` | 160 | `temperature: 0.3` |

**現状:**
- `reasoning_effort`パラメータは設定されていない
- `temperature: 0.3`が固定値として設定されている（ツール内）

---

## 🎯 実装計画

### Phase 1: gpt-5-miniのreasoning_effort対応確認

1. **実際にAPIを叩いて確認する**
   - `reasoning_effort: "low"` を指定してリクエスト
   - エラーになるか、成功するかで判定

2. **確認方法**
   - OpenAI APIのPlaygroundでテスト（推奨）
   - または、curlで直接テスト

### Phase 2: 対応している場合の実装

**変更ファイル:**

#### 2.1 エージェント設定（Mastra Agent）

**ファイル:** `lib/mastra/agents/requirements-agent.ts`

```typescript
// 現在
export const requirementsAgent = new Agent({
  model: 'openai/gpt-5-mini',
  // ...
});

// 変更案
export const requirementsAgent = new Agent({
  model: 'openai/gpt-5-mini',
  reasoning_effort: 'medium',  // ← 追加
  // ...
});
```

※ Mastraが`reasoning_effort`をサポートしているか要確認

#### 2.2 ツール内の直接API呼び出し

**ファイル:**
- `lib/mastra/tools/bt-draft.ts`
- `lib/mastra/tools/br-draft.ts`
- `lib/mastra/tools/system-draft.ts`
- `lib/mastra/tools/impl-unit-draft.ts`

```typescript
// 現在
body: JSON.stringify({
  model: 'gpt-5-mini',
  messages: [...],
  response_format: { type: 'json_object' },
  temperature: 0.3,
})

// 変更案
body: JSON.stringify({
  model: 'gpt-5-mini',
  messages: [...],
  response_format: { type: 'json_object' },
  temperature: 0.3,
  reasoning_effort: 'medium',  // ← 追加
})
```

### Phase 3: 非対応の場合の代替案

1. **モデル変更**: `gpt-5-mini` → `gpt-5.1` に変更
2. **パラメータなし**: 現状維持（temperatureで調整）

---

## ✅ ユーザー決定事項

1. **確認方法**: 先にAPIテストで確認
2. **デフォルト値**: `low`（高速・低コスト優先）
3. **UI設定**: 今のところ不要（コード内で固定値）

## 🧪 実行するAPIテスト

### テスト1: gpt-5-miniのreasoning_effort対応確認

```bash
# テスト用curlコマンド
curl https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5-mini",
    "messages": [{"role": "user", "content": "日本の首都は？"}],
    "reasoning_effort": "low"
  }'
```

**期待する結果:**
- ✅ 成功: gpt-5-miniはreasoning_effortをサポートしている
- ❌ エラー: サポートしていない（エラーメッセージを確認）

### テスト2: 異なるeffortレベルでの挙動確認

```bash
# highでテスト
curl https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5-mini",
    "messages": [{"role": "user", "content": "17 × 23 の計算結果は？"}],
    "reasoning_effort": "high"
  }'
```

**確認ポイント:**
- レスポンス時間の違い（low vs high）
- 推論内容がレスポンスに含まれるか
- usage.tokensの違い

## 📝 次のステップ（テスト結果に基づく）

### ケースA: gpt-5-miniがreasoning_effortに対応している場合

**実装内容:**

1. **エージェント設定の更新** (`lib/mastra/agents/requirements-agent.ts`)
   - Mastra Agentの初期化パラメータに`reasoning_effort: 'low'`を追加
   - ※Mastraがこのパラメータをサポートしているか要確認

2. **ツール内API呼び出しの更新**（4ファイル）
   - 各ツールのOpenAI API呼び出しに`reasoning_effort: 'low'`を追加
   - 対象: `bt-draft.ts`, `br-draft.ts`, `system-draft.ts`, `impl-unit-draft.ts`

### ケースB: gpt-5-miniが対応していない場合

**代替案:**
1. モデルを`gpt-5.1`に変更して実装
2. または、現状維持（temperatureで調整のみ）

---

## 📝 検証計画

### テスト手順

1. **API動作確認**
   ```bash
   curl https://api.openai.com/v1/chat/completions \
     -H "Authorization: Bearer $OPENAI_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "gpt-5-mini",
       "messages": [{"role": "user", "content": "Hello"}],
       "reasoning_effort": "medium"
     }'
   ```

2. **実装後のE2Eテスト**
   - Playwright MCPで`http://localhost:3000/chat`にアクセス
   - チャット送信して応答を確認
   - 応答時間と品質を比較

### 成功基準

- [ ] APIが`reasoning_effort`パラメータを受け付ける
- [ ] チャットで正常な応答が返ってくる
- [ ] reasoning effortの変更で応答品質・速度に差が出る

---

## 🔗 関連ファイル

- `/usr/local/src/dev/wsl/personal-pj/req-manager/lib/mastra/agents/requirements-agent.ts`
- `/usr/local/src/dev/wsl/personal-pj/req-manager/lib/mastra/tools/bt-draft.ts`
- `/usr/local/src/dev/wsl/personal-pj/req-manager/lib/mastra/tools/br-draft.ts`
- `/usr/local/src/dev/wsl/personal-pj/req-manager/lib/mastra/tools/system-draft.ts`
- `/usr/local/src/dev/wsl/personal-pj/req-manager/lib/mastra/tools/impl-unit-draft.ts`
- `/usr/local/src/dev/wsl/personal-pj/req-manager/app/api/chat/route.ts`
