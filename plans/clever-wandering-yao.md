# Verbosity設定追加実装計画

## 概要
LLM設定画面にOpenAI GPT-5シリーズのVerbosityパラメータ設定を追加する。

## 背景: GPT-5.2 Verbosityについて
- **Verbosityパラメータ**: モデル応答の長さと詳細度を制御
- **設定値**: `low` | `medium` | `high`
  - `low`: 簡潔な出力（UX向き）
  - `medium`: バランスされた応答
  - `high`: 詳細で拡張的な応答
- **参照**:
  - [Introducing GPT‑5 for developers](https://openai.com/index/introducing-gpt-5-for-developers/)
  - [Using GPT-5.2 | OpenAI API](https://platform.openai.com/docs/guides/latest-model)
  - [GPT-5 New Params and Tools](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_new_params_and_tools/)

## 現状確認
- ✅ 型定義: `ProjectLlmSettings.verbosity` は既に定義済み（entities.ts:176）
- ✅ デフォルト値: `defaultProjectLlmSettings.verbosity = "low"` （llm-settings.ts:13）
- ✅ バリデーション: `normalizeVerbosity` 関数が実装済み（llm-settings.ts:26-34）
- ❌ UI表示: 設定画面にVerbosityフィールドが存在しない

## 実装内容

### 変更対象ファイル
- `components/settings/llm-settings-content.tsx`

### 追加するUI
1. **配置位置**: モデル選択の下、Temperature設定の上
2. **表示条件**: `settings.provider === "openai"` の場合のみ表示
3. **UIコンポーネント**: Select（ラジオボタンも検討可能）
4. **選択肢**:
   - `low`: 簡潔（UX推奨）
   - `medium`: バランス
   - `high`: 詳細

### 実装コード例
```tsx
{/* Verbosity設定（OpenAIのみ） */}
{settings.provider === "openai" && (
  <div className="space-y-2">
    <Label htmlFor="verbosity" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
      Verbosity（GPT-5）
    </Label>
    <Select
      value={settings.verbosity ?? "low"}
      onValueChange={(value) =>
        updateSettings((prev) => ({
          ...prev,
          verbosity: value as "low" | "medium" | "high",
        }))
      }
    >
      <SelectTrigger id="verbosity">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="low">Low（簡潔）</SelectItem>
        <SelectItem value="medium">Medium（バランス）</SelectItem>
        <SelectItem value="high">High（詳細）</SelectItem>
      </SelectContent>
    </Select>
    <p className="text-[13px] text-slate-500 leading-relaxed">
      GPT-5シリーズの応答の長さを制御します
    </p>
  </div>
)}
```

## 検証手順
1. http://localhost:3000/settings にアクセス
2. LLMプロバイダーを「OpenAI」に変更
3. Verbosityフィールドが表示されることを確認
4. Low/Medium/Highを選択して保存
5. リロード後に設定が保持されていることを確認
6. 他プロバイダー（Anthropic等）を選択時、Verbosityが非表示になることを確認

## 難易度評価
- **難易度**: ★☆☆
- **根拠**: 1ファイル、約20行追加、依存なし
- **リスク**: UI追加のみでバックエンド準備済みのため低リスク

## 注意事項
- VerbosityはGPT-5シリーズ向けのパラメータ（GPT-4以前には無効）
- 将来的にはモデル選択に応じて表示/非表示を切り替える検討もあり
