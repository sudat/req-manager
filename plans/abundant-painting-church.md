# LLM設定にBASE_URL追加計画

## 概要
OpenAIプロバイダー選択時に、カスタムBASE_URLを設定できるようにする。

## 背景
- OpenAI互換API（Ollama、LiteLLM、自己ホスト型等）を使用する際にBASE_URLの変更が必要
- 現在はデフォルトのOpenAI APIエンドポイントしか使えない

## 実装内容

### 変更ファイル
- `/usr/local/src/dev/wsl/personal-pj/req-manager/components/settings/llm-settings-content.tsx`

### 変更詳細

#### 1. 状態管理の追加
```typescript
const [provider, setProvider] = useState("openai");
const [baseUrl, setBaseUrl] = useState("https://api.openai.com/v1");
```

#### 2. プロバイダーSelectの変更
- `defaultValue` → `value` + `onValueChange` に変更
- 選択値を状態に保持

#### 3. BASE_URL入力欄の追加（条件レンダリング）
- `provider === "openai"` のときのみ表示
- ラベル: "Base URL"
- プレースホルダー: "https://api.openai.com/v1"
- 説明文: "OpenAI互換APIを使用する場合に設定してください"

#### 4. リセット処理の更新
- `handleReset` で `baseUrl` もリセット対象に追加

## UI構成（変更後）
```
LLMプロバイダー [Select]
├── OpenAI (GPT-4)
├── Anthropic (Claude)
├── Google (Gemini)
└── Azure OpenAI

[OpenAI選択時のみ表示]
Base URL [Input] https://api.openai.com/v1

APIキー [Input]
モデル [Select]
Temperature [Slider]
```

## 検証手順
1. SettingsページのLLMタブを開く
2. OpenAIが選択されている状態でBase URL入力欄が表示されることを確認
3. プロバイダーをAnthropicに変更 → Base URL入力欄が非表示になることを確認
4. 再度OpenAIに戻す → Base URL入力欄が再表示されることを確認

## 技術的考慮事項
- プロバイダー切り替え時に入力値は保持（またはリセット）するか？
  → 保持でOK（ユーザーの使い回しを想定）
- 入力検証は？
  → 今回は不要（URL形式のバリデーションは後述の本実装時に追加可能）
