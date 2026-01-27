# req-manager プロジェクト概要

- 目的: 要件管理DBアプリ（PRDは `docs/PRD.md`）。業務要件/システム要件/受入基準/実装単位などを管理する。
- 技術スタック: Next.js 16 (App Router) / React 19 / TypeScript / Tailwind CSS / Radix UI / Supabase。
- データ: Supabase を直接 `lib/data/*` から呼び出す構成が多い。
- 重要ドメイン: system_domains, system_functions, system_requirements, acceptance_criteria など。
- 注意: WSL環境。React/Next.jsの動作確認は Playwright MCP を使う（AGENTS.md）。