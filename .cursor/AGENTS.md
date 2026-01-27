# AGENTS.md

## 基本動作
- 日本語で会話する
- ファイル読込は全量を一気に読み込む（100行制限などしない）
- WSL環境のため、React/Next.js動作確認はPlaywright MCPを使用する

## 設計原則
コード設計時、以下の原則を適用した場合は原則名を明示する。

| 原則 | 意味 | 適用例 |
|------|------|--------|
| YAGNI | 今必要じゃない機能は作らない | 将来の拡張を見越した過剰設計の抑止 |
| DRY | 同じコードを繰り返さない | 共通処理の関数化、コンポーネント分離 |
| KISS | シンプルに保つ | 複雑な抽象化より直接的な実装を優先 |

## 要件定義
ユーザから要件相談があった場合、以下を参照してヒアリングを進める。
→ @~/.codex/rules/requirements.md

## テスト戦略
テスト実装時は以下を参照する。
→ @~/.codex/rules/testing.md

## 修正難易度フィードバック
コード修正指示時、計画段階で以下の形式で難易度を提示する。

```
難易度: ★☆☆ / ★★☆ / ★★★
根拠: [修正ファイル数] files, [変更行数概算] lines, [影響コンポーネント数] components
リスク: [具体的な懸念点]
```

難易度基準:
- ★☆☆ : 1-2ファイル、50行未満、依存なし。成功率95%
- ★★☆ : 3-5ファイル or 100行超 or 複数コンポーネント連携。成功率50%
- ★★★ : 広範囲かつ技術難度高。成功率20%。代替案を提案する

## ツールチェーン

### TypeScript/JavaScript
```bash
# 優先: Bun
bun install / bun run / bunx

# フォールバック: npm
npm install / npm run / npx
```

### Python
```bash
# コマンドは python3 を使用（pythonは使用不可）
python3 script.py

# パッケージ管理は uv を使用
# → @~/.codex/reference/uv.md
```

### Web検索
```bash
# gemini CLIでGoogle Search
gemini -p "WebSearch: [検索クエリ]"
```

## MCP/外部ツール
| ツール | 用途 | リファレンス |
|--------|------|--------------|
| Supabase MCP | DB操作 | @~/.codex/rules/supabase.md |
| Pinecone MCP | ベクトル検索 | @~/.codex/reference/pinecone.md |
| Playwright MCP | E2Eテスト・動作確認 | - |
| Context7 MCP | 最新ドキュメント取得 | @~/.codex/reference/context7.md |
| Task Master | タスク管理 | @~/.codex/reference/task-master.md |

## スキル
| スキル | 用途 | 利用タイミング |
|--------|------|----------------|
| e2e-testing | Playwright MCPでの動作確認 | コード改修後の動作検証、Plan modeでの改修計画時 |


## UIライブラリ
```bash
# Shadcn UI
bunx --bun shadcn@latest add [component]
# → @~/.claude/reference/shadcn.md
```