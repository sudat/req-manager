# 推奨コマンド

- 依存解決: `bun install`
- 開発サーバ: `bun run dev`（必要なら `--port 3002` を付与）
- Lint: `bun run lint`
- DBメンテ: `bun run db:remove-legacy-only`, `bun run db:remove-legacy`
- 検索: `rg "pattern" app components lib hooks`
- 画面確認: Playwright MCP を使用（WSL環境のため）